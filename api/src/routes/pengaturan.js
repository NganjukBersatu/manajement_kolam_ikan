import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/akun', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pengaturan_akun WHERE id = 1')
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data akun', error: err.message })
  }
})

router.put('/akun', async (req, res) => {
  const { nama, email } = req.body
  try {
    const result = await pool.query(
      `UPDATE pengaturan_akun SET nama = COALESCE($1, nama), email = COALESCE($2, email), updated_at = NOW()
       WHERE id = 1 RETURNING *`,
      [nama, email]
    )
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah data akun', error: err.message })
  }
})

export default router