// src/config/jwt.js
// File ini adalah SATU-SATUNYA sumber JWT_SECRET di seluruh project.
// Semua file lain (login, register, middleware) WAJIB import dari sini,
// supaya tidak ada lagi masalah "invalid signature" akibat secret berbeda.

export const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_sementara_kolam_ikan_123'
export const JWT_EXPIRES_IN = '1d'