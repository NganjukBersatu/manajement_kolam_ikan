import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Nilai bawaan kalau hari_sortir / hari_panen tidak dikirim dari form.
// Dipakai tebar.js untuk membuat jadwal sortir & panen otomatis.
// SESUAIKAN dengan kebiasaan kolam kamu.
const DEFAULT_HARI_SORTIR = 30
const DEFAULT_HARI_PANEN = 90

// Ubah input jadi angka; kalau kosong/tidak valid, pakai nilai bawaan
function angkaAtauDefault(nilai, bawaan) {
  if (nilai === undefined || nilai === null || nilai === '') return bawaan
  const n = Number(nilai)
  return Number.isFinite(n) && n >= 0 ? n : bawaan
}

// Daftar jenis ikan milik usaha yang login
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jenis_ikan WHERE business_id = $1 ORDER BY nama ASC',
      [req.user.businessId]
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil jenis ikan', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { nama, hari_sortir, hari_panen, harga_per_kg } = req.body
  if (!nama) {
    return res.status(400).json({ message: 'nama wajib diisi' })
  }
  const hariSortir = angkaAtauDefault(hari_sortir, DEFAULT_HARI_SORTIR)
  const hariPanen = angkaAtauDefault(hari_panen, DEFAULT_HARI_PANEN)
  const harga = Number(harga_per_kg) >= 0 ? Number(harga_per_kg) : 0
  try {
    const result = await pool.query(
      `INSERT INTO jenis_ikan (business_id, nama, hari_sortir, hari_panen, harga_per_kg)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.businessId, nama, hariSortir, hariPanen, harga]
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
       WHERE id = $5 AND business_id = $6 RETURNING *`,
      [
        nama !== undefined ? nama : null,
        hari_sortir !== undefined ? Number(hari_sortir) : null,
        hari_panen !== undefined ? Number(hari_panen) : null,
        harga_per_kg !== undefined ? Number(harga_per_kg) : null,
        req.params.id,
        req.user.businessId
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
    const result = await pool.query(
      'DELETE FROM jenis_ikan WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.user.businessId]
    )
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