import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      `SELECT g.*, to_char(g.tanggal, 'YYYY-MM-DD') AS tanggal,
              k.nama_kolam, ji.nama AS nama_ikan
       FROM ganti_air g
       JOIN kolam k ON k.id = g.kolam_id
       JOIN tebar t ON t.id = g.tebar_id
       JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
       WHERE g.business_id = $1
       ORDER BY g.tanggal DESC`,
      [businessId]
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data ganti air', error: err.message })
  }
})

// POST /api/ganti-air → catat ganti air, lalu tandai jadwal selesai
// Tidak membuat jadwal berikutnya secara otomatis — jadwal ganti air
// selanjutnya perlu dibuat manual.
router.post('/', async (req, res) => {
  const businessId = req.user.businessId
  const { jadwal_id, tebar_id, kolam_id, tanggal, persentase_air, catatan } = req.body
  if (!tebar_id || !kolam_id || !tanggal || persentase_air === undefined) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, tanggal, persentase_air wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Pastikan tebar, kolam, dan jadwal (kalau ada) milik business ini
    const tebarCek = await client.query(
      `SELECT id FROM tebar WHERE id = $1 AND business_id = $2`,
      [tebar_id, businessId]
    )
    if (tebarCek.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Tebar tidak ditemukan' })
    }

    const kolamCek = await client.query(
      `SELECT id FROM kolam WHERE id = $1 AND business_id = $2`,
      [kolam_id, businessId]
    )
    if (kolamCek.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    }

    if (jadwal_id) {
      const jadwalCek = await client.query(
        `SELECT id FROM jadwal WHERE id = $1 AND business_id = $2`,
        [jadwal_id, businessId]
      )
      if (jadwalCek.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: 'Jadwal tidak ditemukan' })
      }
    }

    const insertResult = await client.query(
      `INSERT INTO ganti_air (jadwal_id, tebar_id, kolam_id, tanggal, persentase_air, catatan, business_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [jadwal_id || null, tebar_id, kolam_id, tanggal, persentase_air, catatan || null, businessId]
    )

    if (jadwal_id) {
      await client.query(
        `UPDATE jadwal SET status = 'selesai' WHERE id = $1 AND business_id = $2`,
        [jadwal_id, businessId]
      )
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