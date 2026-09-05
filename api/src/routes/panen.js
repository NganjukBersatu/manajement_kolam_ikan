import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, k.nama_kolam, ji.nama AS nama_ikan
      FROM panen p
      JOIN kolam k ON k.id = p.kolam_id
      JOIN tebar t ON t.id = p.tebar_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      ORDER BY p.tanggal DESC
    `)
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data panen', error: err.message })
  }
})

// POST /api/panen → catat hasil panen
// Mengurangi jumlah_saat_ini; kalau habis (<=0), tebar selesai & kolam kosong lagi.
router.post('/', async (req, res) => {
  const { jadwal_id, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg, catatan } = req.body
  if (!tebar_id || !kolam_id || !tanggal || !jumlah_ekor) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, tanggal, jumlah_ekor wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertResult = await client.query(
      `INSERT INTO panen (jadwal_id, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [jadwal_id || null, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg || null, catatan || null]
    )

    const updateTebar = await client.query(
      `UPDATE tebar SET jumlah_saat_ini = GREATEST(jumlah_saat_ini - $1, 0)
       WHERE id = $2 RETURNING jumlah_saat_ini`,
      [jumlah_ekor, tebar_id]
    )

    if (jadwal_id) {
      await client.query(`UPDATE jadwal SET status = 'selesai' WHERE id = $1`, [jadwal_id])
    }

    // Kalau stok ikan di kolam itu sudah habis, tandai tebar selesai & kolam kosong lagi
    if (updateTebar.rows[0].jumlah_saat_ini <= 0) {
      await client.query(`UPDATE tebar SET status = 'selesai' WHERE id = $1`, [tebar_id])
      await client.query(`UPDATE kolam SET status = 'kosong', updated_at = NOW() WHERE id = $1`, [kolam_id])
    }

    await client.query('COMMIT')
    res.status(201).json({ data: insertResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Gagal mencatat panen', error: err.message })
  } finally {
    client.release()
  }
})

export default router