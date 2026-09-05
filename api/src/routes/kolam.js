import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/kolam → daftar kolam + info tebar aktif (jenis ikan & jumlah saat ini)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.id, k.nama_kolam, k.luas_m2, k.status,
             t.id AS tebar_id, t.tanggal_tebar, t.jumlah_bibit, t.jumlah_saat_ini,
             ji.id AS jenis_ikan_id, ji.nama AS nama_ikan
      FROM kolam k
      LEFT JOIN tebar t ON t.kolam_id = k.id AND t.status = 'aktif'
      LEFT JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      ORDER BY k.nama_kolam ASC
    `)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data kolam', error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { nama_kolam, luas_m2 } = req.body
  if (!nama_kolam) return res.status(400).json({ message: 'nama_kolam wajib diisi' })
  try {
    const result = await pool.query(
      `INSERT INTO kolam (nama_kolam, luas_m2) VALUES ($1, $2) RETURNING *`,
      [nama_kolam, luas_m2 || null]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah kolam', error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { nama_kolam, luas_m2 } = req.body
  try {
    const result = await pool.query(
      `UPDATE kolam SET nama_kolam = COALESCE($1, nama_kolam), luas_m2 = COALESCE($2, luas_m2),
       updated_at = NOW() WHERE id = $3 RETURNING *`,
      [nama_kolam, luas_m2, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah kolam', error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM kolam WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    res.json({ message: 'Kolam dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus kolam', error: err.message })
  }
})

export default router