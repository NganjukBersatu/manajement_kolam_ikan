import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/obat?tanggal=2026-09-04 → riwayat obat, bisa difilter per tanggal
router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  const { tanggal } = req.query
  try {
    // $1 selalu business_id, filter tanggal menyusul kalau ada
    const params = [businessId]
    let where = 'WHERE o.business_id = $1'
    if (tanggal) {
      params.push(tanggal)
      where += ` AND o.tanggal = $${params.length}`
    }
    const result = await pool.query(
      `SELECT o.*, to_char(o.tanggal, 'YYYY-MM-DD') AS tanggal, k.nama_kolam
       FROM obat o JOIN kolam k ON k.id = o.kolam_id AND k.business_id = o.business_id
       ${where}
       ORDER BY o.tanggal DESC`,
      params
    )
    res.json({ data: result.rows })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data obat', error: err.message })
  }
})

// POST /api/obat → catat pemberian obat, opsional kaitkan dengan jadwal_id agar jadwal ditandai selesai
router.post('/', async (req, res) => {
  const businessId = req.user.businessId
  const { kolam_id, tanggal, nama_obat, dosis, biaya, catatan, jadwal_id } = req.body
  if (!kolam_id || !tanggal || !nama_obat) {
    return res.status(400).json({ message: 'kolam_id, tanggal, nama_obat wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Kolam harus milik business yang sedang login
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
        `SELECT id, kolam_id, jenis FROM jadwal WHERE id = $1 AND business_id = $2 FOR UPDATE`,
        [jadwal_id, businessId]
      )
      if (jadwalCek.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: 'Jadwal obat tidak ditemukan' })
      }
      if (jadwalCek.rows[0].jenis !== 'obat' || String(jadwalCek.rows[0].kolam_id) !== String(kolam_id)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Jadwal tidak cocok dengan kolam yang dipilih' })
      }
      await client.query(
        `UPDATE jadwal SET status = 'sudah' WHERE id = $1 AND business_id = $2`,
        [jadwal_id, businessId]
      )
    }

    const result = await client.query(
      `INSERT INTO obat (kolam_id, tanggal, nama_obat, dosis, biaya, catatan, jadwal_id, business_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [kolam_id, tanggal, nama_obat, dosis || null, biaya || 0, catatan || null, jadwal_id || null, businessId]
    )

    await client.query('COMMIT')
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ ERROR CATAT OBAT:', err)
    res.status(500).json({ message: 'Gagal mencatat pemberian obat', error: err.message })
  } finally {
    client.release()
  }
})

router.delete('/:id', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      'DELETE FROM obat WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, businessId]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Data obat tidak ditemukan' })
    res.json({ message: 'Data obat dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus data obat', error: err.message })
  }
})

export default router