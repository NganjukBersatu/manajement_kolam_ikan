import { Router } from 'express'
import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { kolam, tebar, jenisIkan, jadwal, sortir, panen, pakan, penjualan } from '../drizzle/schema.js'

const router = Router()

// GET /api/kolam → daftar kolam + info tebar aktif (jenis ikan & jumlah saat ini)
router.get('/', async (req, res) => {
  try {
    const result = await db
      .select({
        id: kolam.id,
        nama_kolam: kolam.namaKolam,
        luas_m2: kolam.luasM2,
        status: kolam.status,
        tebar_id: tebar.id,
        tanggal_tebar: tebar.tanggalTebar,
        jumlah_bibit: tebar.jumlahBibit,
        jumlah_saat_ini: tebar.jumlahSaatIni,
        jenis_ikan_id: jenisIkan.id,
        nama_ikan: jenisIkan.nama,
        hari_sortir: jenisIkan.hariSortir,
        hari_panen: jenisIkan.hariPanen,
      })
      .from(kolam)
      .leftJoin(tebar, and(eq(tebar.kolamId, kolam.id), eq(tebar.status, 'aktif')))
      .leftJoin(jenisIkan, eq(jenisIkan.id, tebar.jenisIkanId))
      .orderBy(asc(kolam.namaKolam))

    res.json({ data: result })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data kolam', error: err.message })
  }
})

// POST /api/kolam → tambah kolam baru
router.post('/', async (req, res) => {
  const { nama_kolam, luas_m2 } = req.body
  if (!nama_kolam) return res.status(400).json({ message: 'nama_kolam wajib diisi' })
  try {
    const result = await db
      .insert(kolam)
      .values({
        namaKolam: nama_kolam,
        luasM2: luas_m2 || null,
      })
      .returning()

    res.status(201).json({ data: result[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah kolam', error: err.message })
  }
})

// PUT /api/kolam/:id → update kolam (partial, seperti COALESCE)
router.put('/:id', async (req, res) => {
  const { nama_kolam, luas_m2 } = req.body
  try {
    const result = await db
      .update(kolam)
      .set({
        namaKolam: nama_kolam !== undefined ? nama_kolam : sql`${kolam.namaKolam}`,
        luasM2: luas_m2 !== undefined ? luas_m2 : sql`${kolam.luasM2}`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(kolam.id, req.params.id))
      .returning()

    if (result.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ data: result[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah kolam', error: err.message })
  }
})

// DELETE /api/kolam/:id → hapus kolam beserta seluruh riwayat terkait (cascade manual)
//
// Urutan hapus WAJIB dari "cucu" ke "induk" karena ada foreign key:
//   kolam <- tebar <- jadwal <- sortir
//                             <- panen
//                             <- ganti_air
//          <- pakan
//          <- penjualan
//          <- sortir (langsung)
//          <- panen (langsung)
//          <- ganti_air (langsung)
//          <- jadwal (langsung)
//
// Catatan: tabel ganti_air belum terdaftar di skema Drizzle (dibuat lewat SQL manual),
// jadi dihapus pakai raw SQL lewat tx.execute, bukan tx.delete(...).
//
// Semua dibungkus dalam satu transaksi: kalau ada satu langkah gagal,
// semua langkah dibatalkan (tidak ada data yang terhapus setengah-setengah).
router.delete('/:id', async (req, res) => {
  const kolamId = req.params.id

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Hapus panen, sortir, & ganti_air (referensi ke tebar/jadwal/kolam)
      await tx.delete(panen).where(eq(panen.kolamId, kolamId))
      await tx.delete(sortir).where(eq(sortir.kolamId, kolamId))
      await tx.execute(sql`DELETE FROM ganti_air WHERE kolam_id = ${kolamId}`)

      // 2. Hapus jadwal (referensi ke tebar & kolam)
      await tx.delete(jadwal).where(eq(jadwal.kolamId, kolamId))

      // 3. Hapus riwayat tebar (referensi ke kolam)
      await tx.delete(tebar).where(eq(tebar.kolamId, kolamId))

      // 4. Hapus catatan pakan (referensi ke kolam)
      await tx.delete(pakan).where(eq(pakan.kolamId, kolamId))

      // 5. Hapus catatan penjualan (referensi ke kolam, nullable tapi tetap dibersihkan)
      await tx.delete(penjualan).where(eq(penjualan.kolamId, kolamId))

      // 6. Terakhir, hapus kolamnya sendiri
      const deleted = await tx
        .delete(kolam)
        .where(eq(kolam.id, kolamId))
        .returning({ id: kolam.id })

      return deleted
    })

    if (result.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ message: 'Kolam beserta seluruh riwayatnya berhasil dihapus' })
  } catch (err) {
    console.error('❌ ERROR HAPUS KOLAM:', err)
    res.status(500).json({ message: 'Gagal menghapus kolam', error: err.message })
  }
})

export default router