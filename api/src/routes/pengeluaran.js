import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()
const KATEGORI_VALID = ['obat', 'listrik', 'gaji', 'perlengkapan', 'lainnya']

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pengeluaran ORDER BY tanggal DESC')
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data pengeluaran', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { kategori, jumlah, deskripsi, tanggal } = req.body
  if (!kategori || jumlah === undefined || !tanggal) {
    return res.status(400).json({ message: 'kategori, jumlah, tanggal wajib diisi' })
  }
  if (!KATEGORI_VALID.includes(kategori)) {
    return res.status(400).json({ message: `kategori harus salah satu dari: ${KATEGORI_VALID.join(', ')}` })
  }
  try {
    const result = await pool.query(
      `INSERT INTO pengeluaran (kategori, jumlah, deskripsi, tanggal) VALUES ($1, $2, $3, $4) RETURNING *`,
      [kategori, jumlah, deskripsi || null, tanggal]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah pengeluaran', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pengeluaran WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' })
    res.json({ message: 'Pengeluaran dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus pengeluaran', error: err.message })
  }
})

export default router