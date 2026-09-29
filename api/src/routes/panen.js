import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/panen
// Query opsional: ?bulan=9&tahun=2026
router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const { bulan, tahun } = req.query

    let query = `
      SELECT 
        p.id,
        p.jadwal_id,
        p.tebar_id,
        p.kolam_id,
        to_char(p.tanggal, 'YYYY-MM-DD') AS tanggal,
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

    // $1 selalu business_id, filter bulan/tahun menyusul setelahnya
    const params = [businessId]
    const conditions = ['p.business_id = $1']

    if (bulan && tahun) {
      params.push(Number(bulan))
      conditions.push(`EXTRACT(MONTH FROM p.tanggal) = $${params.length}`)
      params.push(Number(tahun))
      conditions.push(`EXTRACT(YEAR FROM p.tanggal) = $${params.length}`)
    } else if (tahun) {
      params.push(Number(tahun))
      conditions.push(`EXTRACT(YEAR FROM p.tanggal) = $${params.length}`)
    }

    query += ` WHERE ` + conditions.join(' AND ')
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
  const businessId = req.user.businessId
  const { jadwal_id, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg, catatan } = req.body
  if (!tebar_id || !kolam_id || !tanggal || !jumlah_ekor) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, tanggal, jumlah_ekor wajib diisi' })
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
      `INSERT INTO panen (jadwal_id, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg, catatan, business_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [jadwal_id || null, tebar_id, kolam_id, tanggal, jumlah_ekor, berat_kg || null, catatan || null, businessId]
    )

    const updateTebar = await client.query(
      `UPDATE tebar SET jumlah_saat_ini = GREATEST(jumlah_saat_ini - $1, 0)
       WHERE id = $2 AND business_id = $3 RETURNING jumlah_saat_ini`,
      [jumlah_ekor, tebar_id, businessId]
    )

    // Tandai jadwal sebagai selesai
    if (jadwal_id) {
      await client.query(
        `UPDATE jadwal SET status = 'selesai' WHERE id = $1 AND business_id = $2`,
        [jadwal_id, businessId]
      )
    }

    // Kalau stok ikan di kolam sudah habis
    if (updateTebar.rows[0].jumlah_saat_ini <= 0) {
      await client.query(
        `UPDATE tebar SET status = 'selesai' WHERE id = $1 AND business_id = $2`,
        [tebar_id, businessId]
      )
      await client.query(
        `UPDATE kolam SET status = 'kosong', updated_at = NOW() WHERE id = $1 AND business_id = $2`,
        [kolam_id, businessId]
      )
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