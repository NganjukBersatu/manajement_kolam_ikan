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
  const { nama, hari_sortir, hari_panen } = req.body
  if (!nama || !hari_sortir || !hari_panen) {
    return res.status(400).json({ message: 'nama, hari_sortir, dan hari_panen wajib diisi' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO jenis_ikan (nama, hari_sortir, hari_panen) VALUES ($1, $2, $3) RETURNING *`,
      [nama, hari_sortir, hari_panen]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah jenis ikan', error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { nama, hari_sortir, hari_panen } = req.body
  try {
    const result = await pool.query(
      `UPDATE jenis_ikan SET nama = COALESCE($1, nama), hari_sortir = COALESCE($2, hari_sortir),
       hari_panen = COALESCE($3, hari_panen) WHERE id = $4 RETURNING *`,
      [nama, hari_sortir, hari_panen, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah jenis ikan', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jenis_ikan WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    res.json({ message: 'Jenis ikan dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus jenis ikan', error: err.message })
  }
})

export default router