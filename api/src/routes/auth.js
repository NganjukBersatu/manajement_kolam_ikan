import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { users, businesses, businessCommodities } from '../drizzle/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' })
  }

  try {
    const result = await db.select().from(users).where(eq(users.username, username))
    const user = result[0]

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const cocok = await bcrypt.compare(password, user.passwordHash)
    if (!cocok) {
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  } catch (err) {
    console.error('❌ ERROR LOGIN:', err)
    res.status(500).json({ message: 'Gagal login', error: err.message })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, business, commodities } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' })
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password minimal 8 karakter' })
  }
  if (!business?.name) {
    return res.status(400).json({ message: 'Nama usaha wajib diisi' })
  }
  if (!commodities?.length) {
    return res.status(400).json({ message: 'Pilih minimal satu komoditas' })
  }

  try {
    const existing = await db.select().from(users).where(eq(users.username, username))
    if (existing[0]) {
      return res.status(409).json({ message: 'Username sudah dipakai' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await db.transaction(async (tx) => {
      const [newBusiness] = await tx
        .insert(businesses)
        .values({
          name: business.name,
          address: business.address || null,
          phone: business.phone || null
        })
        .returning()

      await tx.insert(businessCommodities).values(
        commodities.map((c) => ({
          businessId: newBusiness.id,
          commodityKey: c.key,
          label: c.label,
          initialPools: c.initialPools || 0
        }))
      )

      const [createdUser] = await tx
        .insert(users)
        .values({
          username,
          passwordHash,
          businessId: newBusiness.id
        })
        .returning()

      return createdUser
    })

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    })
  } catch (err) {
    console.error('❌ ERROR REGISTER:', err)
    res.status(500).json({ message: 'Gagal membuat akun', error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.select().from(users).where(eq(users.id, req.user.id))
    const user = result[0]

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' })
    }

    let business = null
    let commodities = []

    if (user.businessId) {
      const bizResult = await db.select().from(businesses).where(eq(businesses.id, user.businessId))
      business = bizResult[0] || null

      commodities = await db
        .select()
        .from(businessCommodities)
        .where(eq(businessCommodities.businessId, user.businessId))
    }

    res.json({
      user: { id: user.id, username: user.username },
      business,
      commodities
    })
  } catch (err) {
    console.error('❌ ERROR ME:', err)
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message })
  }
})

export default router