import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/obat?tanggal=2026-09-04 → riwayat obat, bisa difilter per tanggal
router.get('/', async (req, res) => {
  const { tanggal } = req.query
  try {
    const params = []
    let where = ''
    if (tanggal) {
      params.push(tanggal)
      where = 'WHERE o.tanggal = $1'
    }
    const result = await pool.query(
      `SELECT o.*, k.nama_kolam
       FROM obat o JOIN kolam k ON k.id = o.kolam_id
       ${where}
       ORDER BY o.tanggal DESC`,
      params
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data obat', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { kolam_id, tanggal, nama_obat, dosis, biaya, catatan } = req.body
  if (!kolam_id || !tanggal || !nama_obat) {
    return res.status(400).json({ message: 'kolam_id, tanggal, nama_obat wajib diisi' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO obat (kolam_id, tanggal, nama_obat, dosis, biaya, catatan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [kolam_id, tanggal, nama_obat, dosis || null, biaya || 0, catatan || null]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencatat pemberian obat', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM obat WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Data obat tidak ditemukan' })
    res.json({ message: 'Data obat dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus data obat', error: err.message })
  }
})

export default router