import { Router } from 'express'
import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { pool } from '../config/db.js'
import { kolam, tebar, jenisIkan, jadwal, sortir, panen, pakan, penjualan } from '../drizzle/schema.js'

const router = Router()

async function resolveJenisIkanId(jenisInput, namaJenisInput) {
  if (jenisInput && !isNaN(Number(jenisInput))) {
    return Number(jenisInput)
  }

  const nama = (namaJenisInput || jenisInput || '').trim()
  if (!nama) return null

  // Check if existing
  const existing = await pool.query(
    'SELECT id FROM jenis_ikan WHERE LOWER(TRIM(nama)) = LOWER(TRIM($1)) LIMIT 1',
    [nama]
  )
  if (existing.rows.length > 0) {
    return existing.rows[0].id
  }

  // Create new fish type automatically
  const created = await pool.query(
    `INSERT INTO jenis_ikan (nama, hari_sortir, hari_panen, hari_obat_pertama, interval_obat_hari, harga_per_kg)
     VALUES ($1, 30, 90, 7, 14, 0) RETURNING id`,
    [nama]
  )
  return created.rows[0].id
}

// GET /api/kolam → daftar kolam + info tebar aktif (jenis ikan & jumlah saat ini)
router.get('/', async (req, res) => {
  try {
    const result = await db
      .select({
        id: kolam.id,
        nama_kolam: kolam.namaKolam,
        luas_m2: kolam.luasM2,
        status: kolam.status,
        jenis_id: kolam.jenisIkanId,
        jenis_ikan_id: sql`COALESCE(${tebar.jenisIkanId}, ${kolam.jenisIkanId})`.as('jenis_ikan_id'),
        nama_ikan: jenisIkan.nama,
        nama_jenis: jenisIkan.nama,
        hari_sortir: jenisIkan.hariSortir,
        hari_panen: jenisIkan.hariPanen,
        tebar_id: tebar.id,
        tanggal_tebar: tebar.tanggalTebar,
        jumlah_bibit: tebar.jumlahBibit,
        jumlah_saat_ini: tebar.jumlahSaatIni,
      })
      .from(kolam)
      .leftJoin(tebar, and(eq(tebar.kolamId, kolam.id), eq(tebar.status, 'aktif')))
      .leftJoin(jenisIkan, eq(jenisIkan.id, sql`COALESCE(${tebar.jenisIkanId}, ${kolam.jenisIkanId})`))
      .orderBy(asc(kolam.namaKolam))

    res.json({ data: result })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data kolam', error: err.message })
  }
})

// POST /api/kolam → tambah kolam baru
router.post('/', async (req, res) => {
  const { nama_kolam, luas_m2, jenis_id, jenis_ikan_id, nama_jenis } = req.body
  if (!nama_kolam) return res.status(400).json({ message: 'nama_kolam wajib diisi' })
  try {
    const finalJenisId = await resolveJenisIkanId(jenis_ikan_id || jenis_id, nama_jenis)
    const result = await db
      .insert(kolam)
      .values({
        namaKolam: nama_kolam,
        luasM2: luas_m2 || null,
        jenisIkanId: finalJenisId,
      })
      .returning()

    res.status(201).json({ data: result[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah kolam', error: err.message })
  }
})

// PUT /api/kolam/:id → update kolam (partial, seperti COALESCE)
router.put('/:id', async (req, res) => {
  const { nama_kolam, luas_m2, jenis_id, jenis_ikan_id, nama_jenis } = req.body
  try {
    let finalJenisId = undefined
    if (jenis_ikan_id !== undefined || jenis_id !== undefined || nama_jenis !== undefined) {
      finalJenisId = await resolveJenisIkanId(jenis_ikan_id || jenis_id, nama_jenis)
    }

    const result = await db
      .update(kolam)
      .set({
        namaKolam: nama_kolam !== undefined ? nama_kolam : sql`${kolam.namaKolam}`,
        luasM2: luas_m2 !== undefined ? (luas_m2 || null) : sql`${kolam.luasM2}`,
        jenisIkanId: finalJenisId !== undefined ? finalJenisId : sql`${kolam.jenisIkanId}`,
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