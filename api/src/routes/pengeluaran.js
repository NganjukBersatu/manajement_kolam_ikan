import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()
const KATEGORI_VALID = ['pakan', 'obat', 'listrik', 'gaji', 'perlengkapan', 'lainnya']

// GET /api/pengeluaran
// Support filter bulan & tahun (opsional)
router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const { bulan, tahun } = req.query

    // $1 selalu business_id, filter bulan/tahun menyusul kalau ada
    const params = [businessId]
    let query = 'SELECT * FROM pengeluaran WHERE business_id = $1'

    if (bulan && tahun) {
      params.push(Number(bulan))
      query += ` AND EXTRACT(MONTH FROM tanggal) = $${params.length}`
      params.push(Number(tahun))
      query += ` AND EXTRACT(YEAR FROM tanggal) = $${params.length}`
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
  const businessId = req.user.businessId
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
      `INSERT INTO pengeluaran (kategori, jumlah, deskripsi, tanggal, business_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [kategori, jumlah, deskripsi || null, tanggal, businessId]
    )

    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah pengeluaran', error: err.message })
  }
})

// PUT /api/pengeluaran/:id → Edit
router.put('/:id', async (req, res) => {
  const businessId = req.user.businessId
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
       WHERE id = $5 AND business_id = $6
       RETURNING *`,
      [kategori, jumlah, deskripsi || null, tanggal, id, businessId]
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
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      'DELETE FROM pengeluaran WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, businessId]
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