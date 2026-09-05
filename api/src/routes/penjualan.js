import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, ji.nama AS nama_ikan, k.nama_kolam
      FROM penjualan p
      JOIN jenis_ikan ji ON ji.id = p.jenis_ikan_id
      LEFT JOIN kolam k ON k.id = p.kolam_id
      ORDER BY p.tanggal DESC, p.created_at DESC
    `)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data penjualan', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { tanggal, jenis_ikan_id, kolam_id, jumlah_kg, harga_per_kg, catatan } = req.body
  if (!tanggal || !jenis_ikan_id || !jumlah_kg || !harga_per_kg) {
    return res.status(400).json({ message: 'tanggal, jenis_ikan_id, jumlah_kg, harga_per_kg wajib diisi' })
  }
  const total = Number(jumlah_kg) * Number(harga_per_kg)
  try {
    const result = await pool.query(
      `INSERT INTO penjualan (tanggal, jenis_ikan_id, kolam_id, jumlah_kg, harga_per_kg, total, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tanggal, jenis_ikan_id, kolam_id || null, jumlah_kg, harga_per_kg, total, catatan || null]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencatat penjualan', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM penjualan WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Penjualan tidak ditemukan' })
    res.json({ message: 'Penjualan dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus penjualan', error: err.message })
  }
})

export default router