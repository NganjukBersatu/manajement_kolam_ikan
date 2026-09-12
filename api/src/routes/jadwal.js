import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/jadwal?jenis=sortir&status=belum → daftar jadwal, terdekat dulu
// Parameter jenis dan status keduanya opsional dan bisa dipakai sendiri-sendiri atau bersamaan.
router.get('/', async (req, res) => {
  const { jenis, status } = req.query
  try {
    const params = []
    const kondisi = []

    if (jenis) {
      params.push(jenis)
      kondisi.push(`j.jenis = $${params.length}`)
    }
    if (status) {
      params.push(status)
      kondisi.push(`j.status = $${params.length}`)
    }

    const where = kondisi.length > 0 ? `WHERE ${kondisi.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT j.id, j.jenis, j.tanggal_jadwal, j.status, j.tebar_id, j.kolam_id,
              k.nama_kolam, ji.nama AS nama_ikan, t.jumlah_saat_ini,
              COALESCE((
                SELECT COUNT(*)::int
                FROM sortir s
                WHERE s.tebar_id = j.tebar_id AND s.kolam_id = j.kolam_id
              ), 0) AS jumlah_sortir
       FROM jadwal j
       JOIN kolam k ON k.id = j.kolam_id
       JOIN tebar t ON t.id = j.tebar_id
       JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
       ${where}
       ORDER BY j.status ASC, j.tanggal_jadwal ASC`,
      params
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil jadwal', error: err.message })
  }
})

// POST /api/jadwal → buat jadwal baru secara manual
// Dipakai untuk jenis yang tidak otomatis dibuat ulang oleh sistem (misal ganti_air
// setelah jadwal sebelumnya selesai dicatat).
router.post('/', async (req, res) => {
  const { tebar_id, kolam_id, jenis, tanggal_jadwal } = req.body
  if (!tebar_id || !kolam_id || !jenis || !tanggal_jadwal) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, jenis, tanggal_jadwal wajib diisi' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO jadwal (tebar_id, kolam_id, jenis, tanggal_jadwal)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tebar_id, kolam_id, jenis, tanggal_jadwal]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah jadwal', error: err.message })
  }
})

export default router