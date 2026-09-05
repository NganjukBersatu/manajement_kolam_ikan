import { Router } from 'express'
import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { kolam, tebar, jenisIkan } from '../drizzle/schema.js'

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

// DELETE /api/kolam/:id → hapus kolam
router.delete('/:id', async (req, res) => {
  try {
    const result = await db
      .delete(kolam)
      .where(eq(kolam.id, req.params.id))
      .returning({ id: kolam.id })

    if (result.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ message: 'Kolam dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus kolam', error: err.message })
  }
})

export default router