import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()
const KATEGORI_VALID = ['obat', 'listrik', 'gaji', 'perlengkapan', 'lainnya']

// GET /api/pengeluaran
// Support filter bulan & tahun (opsional)
router.get('/', async (req, res) => {
  try {
    const { bulan, tahun } = req.query

    let query = 'SELECT * FROM pengeluaran'
    const params = []

    if (bulan && tahun) {
      query += ' WHERE EXTRACT(MONTH FROM tanggal) = $1 AND EXTRACT(YEAR FROM tanggal) = $2'
      params.push(Number(bulan), Number(tahun))
    }

    query += ' ORDER BY tanggal DESC'

    const result = await pool.query(query, params)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data pengeluaran', error: err.message })
  }
})

// POST /api/pengeluaran → Tambah
router.post('/', async (req, res) => {
  const { kategori, jumlah, deskripsi, tanggal } = req.body

  if (!kategori || jumlah === undefined || !tanggal) {
    return res.status(400).json({ message: 'kategori, jumlah, tanggal wajib diisi' })
  }

  if (!KATEGORI_VALID.includes(kategori)) {
    return res.status(400).json({
      message: `kategori harus salah satu dari: ${KATEGORI_VALID.join(', ')}`
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO pengeluaran (kategori, jumlah, deskripsi, tanggal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [kategori, jumlah, deskripsi || null, tanggal]
    )

    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah pengeluaran', error: err.message })
  }
})

// PUT /api/pengeluaran/:id → Edit
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { kategori, jumlah, deskripsi, tanggal } = req.body

  if (!kategori || jumlah === undefined || !tanggal) {
    return res.status(400).json({ message: 'kategori, jumlah, tanggal wajib diisi' })
  }

  if (!KATEGORI_VALID.includes(kategori)) {
    return res.status(400).json({
      message: `kategori harus salah satu dari: ${KATEGORI_VALID.join(', ')}`
    })
  }

  try {
    const result = await pool.query(
      `UPDATE pengeluaran
       SET kategori = $1,
           jumlah = $2,
           deskripsi = $3,
           tanggal = $4
       WHERE id = $5
       RETURNING *`,
      [kategori, jumlah, deskripsi || null, tanggal, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' })
    }

    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengedit pengeluaran', error: err.message })
  }
})

// DELETE /api/pengeluaran/:id → Hapus
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM pengeluaran WHERE id = $1 RETURNING id',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' })
    }

    res.json({ message: 'Pengeluaran dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus pengeluaran', error: err.message })
  }
})

export default router