import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// Pastikan tabel `sortir` punya semua kolom yang dipakai kode di bawah.
// Dijalankan otomatis sekali saat server start dan aman diulang (IF NOT EXISTS).
async function pastikanStrukturSortir() {
  const perintah = [
    `CREATE TABLE IF NOT EXISTS sortir (
       id SERIAL PRIMARY KEY,
       tebar_id INTEGER NOT NULL,
       kolam_id INTEGER NOT NULL,
       tanggal DATE NOT NULL,
       jumlah_mati INTEGER NOT NULL DEFAULT 0
     )`,
    `ALTER TABLE sortir ADD COLUMN IF NOT EXISTS jadwal_id INTEGER`,
    `ALTER TABLE sortir ADD COLUMN IF NOT EXISTS catatan TEXT`,
    `ALTER TABLE sortir ADD COLUMN IF NOT EXISTS sortir_ke INTEGER`,
    `ALTER TABLE sortir ADD COLUMN IF NOT EXISTS business_id INTEGER`
  ]

  for (const sql of perintah) {
    await pool.query(sql)
  }
}

pastikanStrukturSortir()
  .then(() => console.log('✅ Struktur tabel sortir siap'))
  .catch((err) => console.error('❌ Gagal menyiapkan tabel sortir:', err.message))

// GET /api/sortir → daftar semua catatan sortir
router.get('/', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      `SELECT s.*, to_char(s.tanggal, 'YYYY-MM-DD') AS tanggal,
              k.nama_kolam, ji.nama AS nama_ikan
       FROM sortir s
       JOIN kolam k ON k.id = s.kolam_id
       JOIN tebar t ON t.id = s.tebar_id
       JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
       WHERE s.business_id = $1
       ORDER BY s.tanggal DESC, s.id DESC`,
      [businessId]
    )
    res.json({ data: result.rows })
  } catch (err) {
    console.error('GET sortir error:', err)
    res.status(500).json({ message: 'Gagal mengambil data sortir', error: err.message })
  }
})

// POST /api/sortir → catat hasil sortir (bisa berkali-kali)
router.post('/', async (req, res) => {
  const businessId = req.user.businessId
  const { jadwal_id, tebar_id, kolam_id, tanggal, jumlah_mati, catatan, sortir_ke } = req.body

  if (
    !tebar_id ||
    !kolam_id ||
    !tanggal ||
    jumlah_mati === undefined ||
    jumlah_mati === null ||
    jumlah_mati === ''
  ) {
    return res.status(400).json({
      message: 'tebar_id, kolam_id, tanggal, jumlah_mati wajib diisi'
    })
  }

  const jumlahMati = Number(jumlah_mati)
  if (!Number.isFinite(jumlahMati) || jumlahMati < 0) {
    return res.status(400).json({ message: 'jumlah_mati harus berupa angka 0 atau lebih' })
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

    // Hitung sortir_ke otomatis kalau tidak dikirim
    let ke = sortir_ke
    if (!ke) {
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM sortir
         WHERE tebar_id = $1 AND kolam_id = $2 AND business_id = $3`,
        [tebar_id, kolam_id, businessId]
      )
      ke = (countRes.rows[0].total || 0) + 1
    }

    // Insert catatan sortir
    const insertResult = await client.query(
      `INSERT INTO sortir
         (jadwal_id, tebar_id, kolam_id, tanggal, jumlah_mati, catatan, sortir_ke, business_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        jadwal_id || null,
        tebar_id,
        kolam_id,
        tanggal,
        jumlahMati,
        catatan || null,
        ke,
        businessId
      ]
    )

    // Kurangi stok di tebar
    await client.query(
      `UPDATE tebar
       SET jumlah_saat_ini = GREATEST(jumlah_saat_ini - $1, 0)
       WHERE id = $2 AND business_id = $3`,
      [jumlahMati, tebar_id, businessId]
    )

    // JANGAN set status jadwal jadi 'selesai'
    // biar jadwal tetap muncul dan bisa dicatat sortir lagi

    await client.query('COMMIT')
    res.status(201).json({ data: insertResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST sortir error:', err)
    res.status(500).json({ message: 'Gagal mencatat sortir', error: err.message })
  } finally {
    client.release()
  }
})

export default router