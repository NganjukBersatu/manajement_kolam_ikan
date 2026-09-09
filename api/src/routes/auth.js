import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { users } from '../drizzle/schema.js'
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

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router