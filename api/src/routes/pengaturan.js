import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { pool } from '../config/db.js'
import { db } from '../db/drizzle.js'
import { users } from '../drizzle/schema.js'

const router = Router()

// GET /api/pengaturan/akun → profil milik business yang sedang login
// Kalau nama belum diisi, dipakai username akun.
router.get('/akun', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      'SELECT nama, email, foto FROM pengaturan_akun WHERE business_id = $1 LIMIT 1',
      [businessId]
    )
    const row = result.rows[0] || {}
    res.json({
      data: {
        nama: row.nama || req.user.username,
        email: row.email || null,
        foto: row.foto || null,
        username: req.user.username
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data akun', error: err.message })
  }
})

// PUT /api/pengaturan/akun → ubah nama/email (dibuat otomatis kalau belum ada)
router.put('/akun', async (req, res) => {
  const businessId = req.user.businessId
  const { nama, email } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO pengaturan_akun (nama, email, business_id)
       VALUES (COALESCE($1::text, ''), $2::text, $3)
       ON CONFLICT (business_id) DO UPDATE SET
         nama = COALESCE($1::text, pengaturan_akun.nama),
         email = COALESCE($2::text, pengaturan_akun.email),
         updated_at = NOW()
       RETURNING nama, email, foto`,
      [nama ?? null, email ?? null, businessId]
    )
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah data akun', error: err.message })
  }
})

// PUT /api/pengaturan/akun/foto → simpan atau hapus foto profil
// Body: { foto: 'data:image/...' } atau { foto: null } untuk menghapus
router.put('/akun/foto', async (req, res) => {
  const businessId = req.user.businessId
  const { foto } = req.body

  if (foto !== null) {
    if (typeof foto !== 'string' || !foto.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Foto harus berupa gambar' })
    }
    if (foto.length > 4_000_000) {
      return res.status(400).json({ message: 'Ukuran foto terlalu besar' })
    }
  }

  try {
    await pool.query(
      `INSERT INTO pengaturan_akun (nama, business_id, foto)
       VALUES ('', $1, $2::text)
       ON CONFLICT (business_id) DO UPDATE SET foto = $2::text, updated_at = NOW()`,
      [businessId, foto]
    )
    res.json({ message: 'Foto profil disimpan' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan foto', error: err.message })
  }
})

// GET /api/pengaturan/usaha → pengaturan usaha (logo, nama usaha, dll.)
router.get('/usaha', async (req, res) => {
  const businessId = req.user.businessId
  try {
    const result = await pool.query(
      'SELECT usaha FROM pengaturan_akun WHERE business_id = $1 LIMIT 1',
      [businessId]
    )
    res.json({ data: result.rows[0]?.usaha || {} })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil pengaturan usaha', error: err.message })
  }
})

// PUT /api/pengaturan/usaha → simpan seluruh pengaturan usaha
router.put('/usaha', async (req, res) => {
  const businessId = req.user.businessId
  const data = req.body

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ message: 'Data pengaturan tidak valid' })
  }

  try {
    await pool.query(
      `INSERT INTO pengaturan_akun (nama, business_id, usaha)
       VALUES ('', $1, $2::jsonb)
       ON CONFLICT (business_id) DO UPDATE SET usaha = $2::jsonb, updated_at = NOW()`,
      [businessId, JSON.stringify(data)]
    )
    res.json({ message: 'Pengaturan usaha disimpan' })
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan usaha', error: err.message })
  }
})

// PUT /api/pengaturan/password → ubah sandi akun yang sedang login
// Akun diambil dari token (req.user.id), tidak pernah dari body.
router.put('/password', async (req, res) => {
  const { password_lama, password_baru } = req.body

  if (!password_lama || !password_baru) {
    return res.status(400).json({ message: 'Sandi lama dan sandi baru wajib diisi' })
  }
  if (password_baru.length < 8) {
    return res.status(400).json({ message: 'Sandi baru minimal 8 karakter' })
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id))
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' })
    }

    const cocok = await bcrypt.compare(password_lama, user.passwordHash)
    if (!cocok) {
      // Sengaja 400 (bukan 401) supaya frontend tidak mengira sesi habis
      return res.status(400).json({ message: 'Sandi saat ini salah' })
    }

    const hash = await bcrypt.hash(password_baru, 10)
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, req.user.id))

    res.json({ message: 'Sandi berhasil diubah' })
  } catch (err) {
    console.error('❌ ERROR UBAH SANDI:', err)
    res.status(500).json({ message: 'Gagal mengubah sandi', error: err.message })
  }
})

export default router