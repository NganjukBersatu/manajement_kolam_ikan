import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/panen
// Query opsional: ?bulan=9&tahun=2026
router.get('/', async (req, res) => {
  try {
    const { bulan, tahun } = req.query

    let query = `
      SELECT 
        p.id,
        p.jadwal_id,
        p.tebar_id,
        p.kolam_id,
        p.tanggal,
        p.jumlah_ekor,
        p.berat_kg,
        p.catatan,
        p.created_at,
        k.nama_kolam,
        ji.nama AS jenis_ikan
      FROM panen p
      JOIN kolam k ON k.id = p.kolam_id
      JOIN tebar t ON t.id = p.tebar_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
    `

    const params = []
    const conditions = []

    if (bulan && tahun) {
      conditions.push(`EXTRACT(MONTH FROM p.tanggal) = $1`)
      conditions.push(`EXTRACT(YEAR FROM p.tanggal) = $2`)
      params.push(Number(bulan), Number(tahun))
    } else if (tahun) {
      conditions.push(`EXTRACT(YEAR FROM p.tanggal) = $1`)
      params.push(Number(tahun))
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ')
    }

    query += ` ORDER BY p.tanggal DESC`

    const result = await pool.query(query, params)
    res.json({ data: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil data panen', error: err.message })
  }
})

// POST /api/panen → catat hasil panen
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

    // Tandai jadwal sebagai selesai
    if (jadwal_id) {
      await client.query(`UPDATE jadwal SET status = 'selesai' WHERE id = $1`, [jadwal_id])
    }

    // Kalau stok ikan di kolam sudah habis
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