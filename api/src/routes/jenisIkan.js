import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jenis_ikan ORDER BY nama ASC')
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil jenis ikan', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { nama, hari_sortir, hari_panen, harga_per_kg } = req.body
  if (!nama || hari_sortir === undefined || hari_panen === undefined) {
    return res.status(400).json({ message: 'nama, hari_sortir, dan hari_panen wajib diisi' })
  }
  const harga = Number(harga_per_kg) >= 0 ? Number(harga_per_kg) : 0
  try {
    const result = await pool.query(
      `INSERT INTO jenis_ikan (nama, hari_sortir, hari_panen, harga_per_kg) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nama, Number(hari_sortir), Number(hari_panen), harga]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah jenis ikan', error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { nama, hari_sortir, hari_panen, harga_per_kg } = req.body
  try {
    const result = await pool.query(
      `UPDATE jenis_ikan SET 
        nama = COALESCE($1, nama), 
        hari_sortir = COALESCE($2, hari_sortir),
        hari_panen = COALESCE($3, hari_panen),
        harga_per_kg = COALESCE($4, harga_per_kg)
       WHERE id = $5 RETURNING *`,
      [
        nama !== undefined ? nama : null,
        hari_sortir !== undefined ? Number(hari_sortir) : null,
        hari_panen !== undefined ? Number(hari_panen) : null,
        harga_per_kg !== undefined ? Number(harga_per_kg) : null,
        req.params.id
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    res.json({ data: result.rows[0] })
  } catch (err) {
    console.error('❌ ERROR UPDATE JENIS IKAN:', err)
    res.status(500).json({ message: 'Gagal mengubah jenis ikan', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jenis_ikan WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    res.json({ message: 'Jenis ikan berhasil dihapus' })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        message: 'Jenis ikan tidak dapat dihapus karena masih digunakan pada data tebar bibit atau transaksi penjualan.'
      })
    }
    res.status(500).json({ message: 'Gagal menghapus jenis ikan', error: err.message })
  }
})

export default router