import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/obat?tanggal=2026-09-04 → riwayat obat, bisa difilter per tanggal
router.get('/', async (req, res) => {
  const { tanggal } = req.query
  try {
    const params = []
    let where = ''
    if (tanggal) {
      params.push(tanggal)
      where = 'WHERE o.tanggal = $1'
    }
    const result = await pool.query(
      `SELECT o.*, k.nama_kolam
       FROM obat o JOIN kolam k ON k.id = o.kolam_id
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
  const { kolam_id, tanggal, nama_obat, dosis, biaya, catatan, jadwal_id } = req.body
  if (!kolam_id || !tanggal || !nama_obat) {
    return res.status(400).json({ message: 'kolam_id, tanggal, nama_obat wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (jadwal_id) {
      const jadwalCek = await client.query(
        `SELECT id, kolam_id, jenis FROM jadwal WHERE id = $1 FOR UPDATE`,
        [jadwal_id]
      )
      if (jadwalCek.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: 'Jadwal obat tidak ditemukan' })
      }
      if (jadwalCek.rows[0].jenis !== 'obat' || String(jadwalCek.rows[0].kolam_id) !== String(kolam_id)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Jadwal tidak cocok dengan kolam yang dipilih' })
      }
      await client.query(`UPDATE jadwal SET status = 'sudah' WHERE id = $1`, [jadwal_id])
    }

    const result = await client.query(
      `INSERT INTO obat (kolam_id, tanggal, nama_obat, dosis, biaya, catatan, jadwal_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [kolam_id, tanggal, nama_obat, dosis || null, biaya || 0, catatan || null, jadwal_id || null]
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
  try {
    const result = await pool.query('DELETE FROM obat WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Data obat tidak ditemukan' })
    res.json({ message: 'Data obat dihapus' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus data obat', error: err.message })
  }
})

export default router