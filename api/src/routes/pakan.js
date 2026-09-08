import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

const SESI_VALID = ['pagi', 'siang', 'sore']

// GET /api/pakan?tanggal=2026-09-08 → riwayat pakan, bisa difilter per tanggal
router.get('/', async (req, res) => {
  const { tanggal } = req.query
  try {
    const params = []
    let where = ''
    if (tanggal) {
      params.push(tanggal)
      where = 'WHERE p.tanggal = $1'
    }
    const result = await pool.query(
      `SELECT p.id, p.kolam_id, p.sesi, p.tanggal::text AS tanggal, p.jumlah_kg, p.biaya, p.catatan, k.nama_kolam
       FROM pakan p JOIN kolam k ON k.id = p.kolam_id
       ${where}
       ORDER BY p.tanggal DESC, p.sesi`,
      params
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data pakan', error: err.message })
  }
})

// GET /api/pakan/kolam/:kolam_id → riwayat pakan untuk satu kolam (dipakai modal riwayat)
router.get('/kolam/:kolam_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.kolam_id, p.sesi, p.tanggal::text AS tanggal, p.jumlah_kg, p.biaya, p.catatan, k.nama_kolam
       FROM pakan p JOIN kolam k ON k.id = p.kolam_id
       WHERE p.kolam_id = $1
       ORDER BY p.tanggal DESC, p.sesi
       LIMIT 100`,
      [req.params.kolam_id]
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil riwayat pakan', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { kolam_id, tanggal, sesi, jumlah_kg, biaya, catatan } = req.body

  if (!kolam_id || !tanggal || !jumlah_kg) {
    return res.status(400).json({ message: 'kolam_id, tanggal, jumlah_kg wajib diisi' })
  }
  if (!sesi || !SESI_VALID.includes(sesi)) {
    return res.status(400).json({ message: `sesi wajib diisi salah satu dari: ${SESI_VALID.join(', ')}` })
  }

  try {
    const result = await pool.query(
      `INSERT INTO pakan (kolam_id, tanggal, sesi, jumlah_kg, biaya, catatan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, kolam_id, sesi, tanggal::text AS tanggal, jumlah_kg, biaya, catatan`,
      [kolam_id, tanggal, sesi, jumlah_kg, biaya || 0, catatan || null]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    // 23505 = pelanggaran unique constraint (kolam_id, tanggal, sesi)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Sesi ini sudah dicatat untuk kolam dan tanggal tersebut' })
    }
    res.status(500).json({ message: 'Gagal mencatat pakan', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pakan WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Data pakan tidak ditemukan' })
    res.json({ message: 'Data pakan dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus data pakan', error: err.message })
  }
})

export default router