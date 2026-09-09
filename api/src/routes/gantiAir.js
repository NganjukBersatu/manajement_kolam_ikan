import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, k.nama_kolam, ji.nama AS nama_ikan
      FROM ganti_air g
      JOIN kolam k ON k.id = g.kolam_id
      JOIN tebar t ON t.id = g.tebar_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      ORDER BY g.tanggal DESC
    `)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data ganti air', error: err.message })
  }
})

// POST /api/ganti-air → catat ganti air, lalu tandai jadwal selesai
// Tidak membuat jadwal berikutnya secara otomatis — jadwal ganti air
// selanjutnya perlu dibuat manual.
router.post('/', async (req, res) => {
  const { jadwal_id, tebar_id, kolam_id, tanggal, persentase_air, catatan } = req.body
  if (!tebar_id || !kolam_id || !tanggal || persentase_air === undefined) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, tanggal, persentase_air wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertResult = await client.query(
      `INSERT INTO ganti_air (jadwal_id, tebar_id, kolam_id, tanggal, persentase_air, catatan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [jadwal_id || null, tebar_id, kolam_id, tanggal, persentase_air, catatan || null]
    )

    if (jadwal_id) {
      await client.query(`UPDATE jadwal SET status = 'selesai' WHERE id = $1`, [jadwal_id])
    }

    await client.query('COMMIT')
    res.status(201).json({ data: insertResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Gagal mencatat ganti air', error: err.message })
  } finally {
    client.release()
  }
})

export default router