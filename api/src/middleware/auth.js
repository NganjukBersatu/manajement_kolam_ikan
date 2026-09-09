// src/middleware/auth.js
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/jwt.js'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Belum login. Silakan login terlebih dahulu.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    console.error('Token error:', err.message)
    return res.status(401).json({ message: 'Sesi login tidak valid atau sudah kedaluwarsa.' })
  }
}