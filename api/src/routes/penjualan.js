import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Pastikan jenis ikan & kolam yang dipilih memang milik usaha ini
// (mencegah akun lain menyisipkan id milik usaha berbeda).
async function referensiValid(businessId, jenisIkanId, kolamId) {
  const ikan = await pool.query(
    'SELECT 1 FROM jenis_ikan WHERE id = $1 AND business_id = $2',
    [jenisIkanId, businessId]
  )
  if (ikan.rows.length === 0) return false

  if (kolamId) {
    const kolam = await pool.query(
      'SELECT 1 FROM kolam WHERE id = $1 AND business_id = $2',
      [kolamId, businessId]
    )
    if (kolam.rows.length === 0) return false
  }
  return true
}

// GET semua penjualan (hanya milik usaha yang login)
// tanggal dikirim sebagai teks 'YYYY-MM-DD' agar tidak bergeser zona waktu
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              to_char(p.tanggal, 'YYYY-MM-DD') AS tanggal,
              ji.nama AS nama_ikan,
              k.nama_kolam
       FROM penjualan p
       LEFT JOIN jenis_ikan ji ON ji.id = p.jenis_ikan_id
       LEFT JOIN kolam k ON k.id = p.kolam_id
       WHERE p.business_id = $1
       ORDER BY p.tanggal DESC, p.created_at DESC`,
      [req.user.businessId]
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data penjualan', error: err.message })
  }
})

// POST tambah penjualan
router.post('/', async (req, res) => {
  const {
    tanggal,
    jenis_ikan_id,
    kolam_id,
    jumlah_kg,
    harga_per_kg,
    catatan
  } = req.body

  if (!tanggal || !jenis_ikan_id || !jumlah_kg || !harga_per_kg) {
    return res.status(400).json({ message: 'tanggal, jenis_ikan_id, jumlah_kg, harga_per_kg wajib diisi' })
  }

  const total = Number(jumlah_kg) * Number(harga_per_kg)

  try {
    const valid = await referensiValid(req.user.businessId, jenis_ikan_id, kolam_id)
    if (!valid) {
      return res.status(400).json({ message: 'Jenis ikan atau kolam tidak ditemukan' })
    }

    const result = await pool.query(
      `INSERT INTO penjualan
        (business_id, tanggal, jenis_ikan_id, kolam_id, jumlah_kg, harga_per_kg, total, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, to_char(tanggal, 'YYYY-MM-DD') AS tanggal`,
      [
        req.user.businessId,
        tanggal,
        jenis_ikan_id,
        kolam_id || null,
        jumlah_kg,
        harga_per_kg,
        total,
        catatan || null
      ]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    console.error('Error tambah penjualan:', err)
    res.status(500).json({ message: 'Gagal mencatat penjualan', error: err.message })
  }
})

// PUT update penjualan
router.put('/:id', async (req, res) => {
  const {
    tanggal,
    jenis_ikan_id,
    kolam_id,
    jumlah_kg,
    harga_per_kg,
    catatan
  } = req.body

  if (!tanggal || !jenis_ikan_id || !jumlah_kg || !harga_per_kg) {
    return res.status(400).json({ message: 'tanggal, jenis_ikan_id, jumlah_kg, harga_per_kg wajib diisi' })
  }

  const total = Number(jumlah_kg) * Number(harga_per_kg)

  try {
    const valid = await referensiValid(req.user.businessId, jenis_ikan_id, kolam_id)
    if (!valid) {
      return res.status(400).json({ message: 'Jenis ikan atau kolam tidak ditemukan' })
    }

    const result = await pool.query(
      `UPDATE penjualan SET
        tanggal = $1,
        jenis_ikan_id = $2,
        kolam_id = $3,
        jumlah_kg = $4,
        harga_per_kg = $5,
        total = $6,
        catatan = $7
       WHERE id = $8 AND business_id = $9
       RETURNING *, to_char(tanggal, 'YYYY-MM-DD') AS tanggal`,
      [
        tanggal,
        jenis_ikan_id,
        kolam_id || null,
        jumlah_kg,
        harga_per_kg,
        total,
        catatan || null,
        req.params.id,
        req.user.businessId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Penjualan tidak ditemukan' })
    }

    res.json({ data: result.rows[0] })
  } catch (err) {
    console.error('Error update penjualan:', err)
    res.status(500).json({ message: 'Gagal mengupdate penjualan', error: err.message })
  }
})

// DELETE penjualan
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM penjualan WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, req.user.businessId]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Penjualan tidak ditemukan' })
    res.json({ message: 'Penjualan dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus penjualan', error: err.message })
  }
})

export default router