import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// POST /api/tebar → catat tebar bibit baru
// Otomatis: 1) status kolam jadi 'aktif', 2) buat jadwal sortir, panen, & ganti air
// berdasarkan hari_sortir/hari_panen dari jenis ikan, dan interval_ganti_air_hari dari kolam.
router.post('/', async (req, res) => {
  const { kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit } = req.body
  if (!kolam_id || !jenis_ikan_id || !tanggal_tebar || !jumlah_bibit) {
    return res.status(400).json({ message: 'kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Pastikan kolam sedang kosong (tidak ada tebar aktif lain)
    const kolamCek = await client.query(
      `SELECT status, interval_ganti_air_hari FROM kolam WHERE id = $1`, [kolam_id]
    )
    if (kolamCek.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    }
    if (kolamCek.rows[0].status === 'aktif') {
      await client.query('ROLLBACK')
      return res.status(409).json({ message: 'Kolam ini masih ada tebar aktif' })
    }
    const { interval_ganti_air_hari } = kolamCek.rows[0]

    const jenisResult = await client.query('SELECT hari_sortir, hari_panen FROM jenis_ikan WHERE id = $1', [jenis_ikan_id])
    if (jenisResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    }
    const { hari_sortir, hari_panen } = jenisResult.rows[0]

    const tebarResult = await client.query(
      `INSERT INTO tebar (kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit, jumlah_saat_ini)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit]
    )
    const tebarBaru = tebarResult.rows[0]

    await client.query(`UPDATE kolam SET status = 'aktif', updated_at = NOW() WHERE id = $1`, [kolam_id])

    // Jadwal sortir & panen dihitung dari tanggal_tebar + hari yang ditentukan jenis ikan.
    // Jadwal ganti air pertama dihitung dari tanggal_tebar + interval_ganti_air_hari milik kolam.
    await client.query(
      `INSERT INTO jadwal (tebar_id, kolam_id, jenis, tanggal_jadwal)
       VALUES
        ($1, $2, 'sortir', ($3::date + ($4 || ' days')::interval)::date),
        ($1, $2, 'panen',  ($3::date + ($5 || ' days')::interval)::date),
        ($1, $2, 'ganti_air', ($3::date + ($6 || ' days')::interval)::date)`,
      [tebarBaru.id, kolam_id, tanggal_tebar, hari_sortir, hari_panen, interval_ganti_air_hari]
    )

    await client.query('COMMIT')
    res.status(201).json({ data: tebarBaru })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Gagal mencatat tebar', error: err.message })
  } finally {
    client.release()
  }
})

// GET /api/tebar/:id → detail satu tebar (untuk halaman sortir/panen/ganti air)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, k.nama_kolam, ji.nama AS nama_ikan
       FROM tebar t
       JOIN kolam k ON k.id = t.kolam_id
       JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
       WHERE t.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tebar tidak ditemukan' })
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data tebar', error: err.message })
  }
})

export default router