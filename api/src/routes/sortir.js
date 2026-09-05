import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, k.nama_kolam, ji.nama AS nama_ikan
      FROM sortir s
      JOIN kolam k ON k.id = s.kolam_id
      JOIN tebar t ON t.id = s.tebar_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      ORDER BY s.tanggal DESC
    `)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data sortir', error: err.message })
  }
})

// POST /api/sortir → catat hasil sortir
// Mengurangi jumlah_saat_ini di tebar sebesar jumlah_mati, dan menandai jadwal selesai.
router.post('/', async (req, res) => {
  const { jadwal_id, tebar_id, kolam_id, tanggal, jumlah_mati, catatan } = req.body
  if (!tebar_id || !kolam_id || !tanggal || jumlah_mati === undefined) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, tanggal, jumlah_mati wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertResult = await client.query(
      `INSERT INTO sortir (jadwal_id, tebar_id, kolam_id, tanggal, jumlah_mati, catatan)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [jadwal_id || null, tebar_id, kolam_id, tanggal, jumlah_mati, catatan || null]
    )

    await client.query(
      `UPDATE tebar SET jumlah_saat_ini = GREATEST(jumlah_saat_ini - $1, 0) WHERE id = $2`,
      [jumlah_mati, tebar_id]
    )

    if (jadwal_id) {
      await client.query(`UPDATE jadwal SET status = 'selesai' WHERE id = $1`, [jadwal_id])
    }

    await client.query('COMMIT')
    res.status(201).json({ data: insertResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Gagal mencatat sortir', error: err.message })
  } finally {
    client.release()
  }
})

export default router