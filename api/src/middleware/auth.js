import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_sementara_kolam_ikan_123'

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