import { Router } from 'express'
import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { pool } from '../config/db.js'
import { kolam, tebar, jenisIkan, jadwal, sortir, panen, pakan, penjualan } from '../drizzle/schema.js'

const router = Router()

function galatValidasi(pesan) {
  const err = new Error(pesan)
  err.status = 400
  return err
}

// Mengembalikan id jenis ikan MILIK USAHA INI.
// - Kalau input berupa angka: pastikan jenis ikan itu memang milik usaha ini.
// - Kalau input berupa nama: cari di usaha ini, kalau belum ada dibuatkan otomatis.
async function resolveJenisIkanId(businessId, jenisInput, namaJenisInput) {
  if (jenisInput && !isNaN(Number(jenisInput))) {
    const cek = await pool.query(
      'SELECT id FROM jenis_ikan WHERE id = $1 AND business_id = $2',
      [Number(jenisInput), businessId]
    )
    if (cek.rows.length === 0) throw galatValidasi('Jenis ikan tidak ditemukan')
    return cek.rows[0].id
  }

  const nama = (namaJenisInput || jenisInput || '').trim()
  if (!nama) return null

  const existing = await pool.query(
    `SELECT id FROM jenis_ikan
     WHERE business_id = $1 AND LOWER(TRIM(nama)) = LOWER(TRIM($2)) LIMIT 1`,
    [businessId, nama]
  )
  if (existing.rows.length > 0) {
    return existing.rows[0].id
  }

  // Buat jenis ikan baru otomatis (untuk usaha ini saja)
  const created = await pool.query(
    `INSERT INTO jenis_ikan (business_id, nama, hari_sortir, hari_panen, hari_obat_pertama, interval_obat_hari, harga_per_kg)
     VALUES ($1, $2, 30, 90, 7, 14, 0) RETURNING id`,
    [businessId, nama]
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
      .where(eq(kolam.businessId, req.user.businessId))
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
    const finalJenisId = await resolveJenisIkanId(req.user.businessId, jenis_ikan_id || jenis_id, nama_jenis)
    const result = await db
      .insert(kolam)
      .values({
        businessId: req.user.businessId,
        namaKolam: nama_kolam,
        luasM2: luas_m2 || null,
        jenisIkanId: finalJenisId,
      })
      .returning()

    res.status(201).json({ data: result[0] })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Gagal menambah kolam', error: err.message })
  }
})

// PUT /api/kolam/:id → update kolam (partial, seperti COALESCE)
router.put('/:id', async (req, res) => {
  const { nama_kolam, luas_m2, jenis_id, jenis_ikan_id, nama_jenis } = req.body
  try {
    let finalJenisId = undefined
    if (jenis_ikan_id !== undefined || jenis_id !== undefined || nama_jenis !== undefined) {
      finalJenisId = await resolveJenisIkanId(req.user.businessId, jenis_ikan_id || jenis_id, nama_jenis)
    }

    const result = await db
      .update(kolam)
      .set({
        namaKolam: nama_kolam !== undefined ? nama_kolam : sql`${kolam.namaKolam}`,
        luasM2: luas_m2 !== undefined ? (luas_m2 || null) : sql`${kolam.luasM2}`,
        jenisIkanId: finalJenisId !== undefined ? finalJenisId : sql`${kolam.jenisIkanId}`,
        updatedAt: sql`NOW()`,
      })
      .where(and(eq(kolam.id, req.params.id), eq(kolam.businessId, req.user.businessId)))
      .returning()

    if (result.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ data: result[0] })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Gagal mengubah kolam', error: err.message })
  }
})

// DELETE /api/kolam/:id → hapus kolam beserta seluruh riwayat terkait (cascade manual)
//
// Urutan hapus WAJIB dari "cucu" ke "induk" karena ada foreign key.
// Semua dibungkus dalam satu transaksi: kalau ada satu langkah gagal,
// semua langkah dibatalkan (tidak ada data yang terhapus setengah-setengah).
router.delete('/:id', async (req, res) => {
  const kolamId = req.params.id
  const businessId = req.user.businessId

  try {
    // Pastikan kolam ini memang milik usaha yang login sebelum menghapus apa pun
    const milikSendiri = await db
      .select({ id: kolam.id })
      .from(kolam)
      .where(and(eq(kolam.id, kolamId), eq(kolam.businessId, businessId)))

    if (milikSendiri.length === 0) {
      return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    }

    await db.transaction(async (tx) => {
      // 1. Hapus panen, sortir, ganti_air, & obat (referensi ke tebar/jadwal/kolam)
      await tx.delete(panen).where(eq(panen.kolamId, kolamId))
      await tx.delete(sortir).where(eq(sortir.kolamId, kolamId))
      await tx.execute(sql`DELETE FROM ganti_air WHERE kolam_id = ${kolamId}`)
      await tx.execute(sql`DELETE FROM obat WHERE kolam_id = ${kolamId}`)

      // 2. Hapus jadwal (referensi ke tebar & kolam)
      await tx.delete(jadwal).where(eq(jadwal.kolamId, kolamId))

      // 3. Hapus riwayat tebar (referensi ke kolam)
      await tx.delete(tebar).where(eq(tebar.kolamId, kolamId))

      // 4. Hapus catatan pakan (referensi ke kolam)
      await tx.delete(pakan).where(eq(pakan.kolamId, kolamId))

      // 5. Hapus catatan penjualan (referensi ke kolam)
      await tx.delete(penjualan).where(eq(penjualan.kolamId, kolamId))

      // 6. Terakhir, hapus kolamnya sendiri
      await tx
        .delete(kolam)
        .where(and(eq(kolam.id, kolamId), eq(kolam.businessId, businessId)))
    })

    res.json({ message: 'Kolam beserta seluruh riwayatnya berhasil dihapus' })
  } catch (err) {
    console.error('❌ ERROR HAPUS KOLAM:', err)
    res.status(500).json({ message: 'Gagal menghapus kolam', error: err.message })
  }
})

export default router