import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/jadwal?jenis=sortir&status=belum → daftar jadwal, terdekat dulu
// Parameter jenis dan status keduanya opsional dan bisa dipakai sendiri-sendiri atau bersamaan.
router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  const { jenis, status } = req.query
  try {
    // $1 selalu business_id, filter lain menyusul setelahnya
    const params = [businessId]
    const kondisi = ['j.business_id = $1']

    if (jenis) {
      params.push(jenis)
      kondisi.push(`j.jenis = $${params.length}`)
    }
    if (status) {
      params.push(status)
      kondisi.push(`j.status = $${params.length}`)
    }

    const where = `WHERE ${kondisi.join(' AND ')}`

    const result = await pool.query(
      `SELECT j.id, j.jenis, to_char(j.tanggal_jadwal, 'YYYY-MM-DD') AS tanggal_jadwal,
              j.status, j.tebar_id, j.kolam_id,
              k.nama_kolam, ji.nama AS nama_ikan, t.jumlah_saat_ini,
              COALESCE((
                SELECT COUNT(*)::int
                FROM sortir s
                WHERE s.tebar_id = j.tebar_id AND s.kolam_id = j.kolam_id
                  AND s.business_id = j.business_id
              ), 0) AS jumlah_sortir
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

// POST /api/jadwal → buat jadwal baru secara manual
// Dipakai untuk jenis yang tidak otomatis dibuat ulang oleh sistem (misal ganti_air
// setelah jadwal sebelumnya selesai dicatat).
router.post('/', async (req, res) => {
  const businessId = req.user.businessId
  const { tebar_id, kolam_id, jenis, tanggal_jadwal } = req.body
  if (!tebar_id || !kolam_id || !jenis || !tanggal_jadwal) {
    return res.status(400).json({ message: 'tebar_id, kolam_id, jenis, tanggal_jadwal wajib diisi' })
  }

  try {
    // Pastikan tebar dan kolam yang dikirim memang milik business ini
    const tebarCek = await pool.query(
      `SELECT id FROM tebar WHERE id = $1 AND business_id = $2`,
      [tebar_id, businessId]
    )
    if (tebarCek.rows.length === 0) {
      return res.status(404).json({ message: 'Tebar tidak ditemukan' })
    }
    const kolamCek = await pool.query(
      `SELECT id FROM kolam WHERE id = $1 AND business_id = $2`,
      [kolam_id, businessId]
    )
    if (kolamCek.rows.length === 0) {
      return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    }

    const result = await pool.query(
      `INSERT INTO jadwal (tebar_id, kolam_id, jenis, tanggal_jadwal, business_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tebar_id, kolam_id, jenis, tanggal_jadwal, businessId]
    )
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah jadwal', error: err.message })
  }
})

// PUT /api/jadwal/:id → ubah jadwal yang sudah ada
// Dipakai untuk mengedit tanggal, catatan, atau status jadwal tanpa membuat baris baru.
router.put('/:id', async (req, res) => {
  const businessId = req.user.businessId
  const { id } = req.params
  const { tanggal_jadwal, catatan, status } = req.body

  try {
    const result = await pool.query(
      `UPDATE jadwal
       SET tanggal_jadwal = COALESCE($1, tanggal_jadwal),
           catatan = COALESCE($2, catatan),
           status = COALESCE($3, status)
       WHERE id = $4 AND business_id = $5
       RETURNING *`,
      [tanggal_jadwal, catatan, status, id, businessId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' })
    }

    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah jadwal', error: err.message })
  }
})

// DELETE /api/jadwal/:id → hapus jadwal
router.delete('/:id', async (req, res) => {
  const businessId = req.user.businessId
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM jadwal WHERE id = $1 AND business_id = $2 RETURNING *`,
      [id, businessId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' })
    }

    res.json({ message: 'Jadwal berhasil dihapus', data: result.rows[0] })
  } catch (err) {
    // Kode 23503 = foreign key violation di PostgreSQL
    // Terjadi kalau jadwal ini masih dirujuk oleh data lain (misalnya riwayat obat)
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'Jadwal ini sudah terhubung dengan riwayat pemberian obat, tidak bisa dihapus langsung'
      })
    }
    res.status(500).json({ message: 'Gagal menghapus jadwal', error: err.message })
  }
})

export default router