import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/jadwal?jenis=sortir → daftar jadwal (sortir atau panen), terdekat dulu
router.get('/', async (req, res) => {
  const { jenis } = req.query
  try {
    const params = []
    let where = ''
    if (jenis) {
      params.push(jenis)
      where = 'WHERE j.jenis = $1'
    }
    const result = await pool.query(
      `SELECT j.id, j.jenis, j.tanggal_jadwal, j.status, j.tebar_id, j.kolam_id,
              k.nama_kolam, ji.nama AS nama_ikan, t.jumlah_saat_ini
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

export default router