import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Helper: parse angka aman, fallback ke default jika tidak valid
function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// GET /api/stok-pakan
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama, stok, satuan, stok_minimum, created_at
       FROM stok_pakan
       ORDER BY nama ASC`
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data stok pakan', error: err.message })
  }
})

// POST /api/stok-pakan
router.post('/', async (req, res) => {
  const { nama, stok, satuan, stok_minimum } = req.body

  if (!nama || nama.trim() === '') {
    return res.status(400).json({ message: 'Nama pakan wajib diisi' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO stok_pakan (nama, stok, satuan, stok_minimum)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nama, stok, satuan, stok_minimum, created_at`,
      [
        nama.trim(),
        toNumber(stok, 0),
        satuan || 'kg',
        toNumber(stok_minimum, 10)
      ]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah jenis pakan', error: err.message })
  }
})

// PUT /api/stok-pakan/:id
router.put('/:id', async (req, res) => {
  const { nama, stok, satuan, stok_minimum } = req.body

  // null berarti "jangan ubah kolom ini" (dipakai oleh COALESCE di query)
  const stokVal = stok !== undefined ? toNumber(stok, null) : null
  const stokMinVal = stok_minimum !== undefined ? toNumber(stok_minimum, null) : null

  try {
    const result = await pool.query(
      `UPDATE stok_pakan
       SET
         nama = COALESCE($1, nama),
         stok = COALESCE($2, stok),
         satuan = COALESCE($3, satuan),
         stok_minimum = COALESCE($4, stok_minimum)
       WHERE id = $5
       RETURNING id, nama, stok, satuan, stok_minimum, created_at`,
      [
        nama?.trim() || null,
        stokVal,
        satuan || null,
        stokMinVal,
        req.params.id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Jenis pakan tidak ditemukan' })
    }

    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengupdate jenis pakan', error: err.message })
  }
})

// DELETE /api/stok-pakan/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM stok_pakan WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Jenis pakan tidak ditemukan' })
    }
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus jenis pakan', error: err.message })
  }
})

export default router