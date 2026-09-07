import jwt from 'jsonwebtoken'

// Middleware ini mengecek header "Authorization: Bearer <token>".
// Kalau valid, informasi user (id, username) ditaruh di req.user.
// Kalau tidak ada / tidak valid, request ditolak dengan status 401.
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Belum login. Silakan login terlebih dahulu.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Sesi login tidak valid atau sudah kedaluwarsa.' })
  }
}