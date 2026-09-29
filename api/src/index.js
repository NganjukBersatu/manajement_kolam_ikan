import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { testConnection } from './config/db.js'
import { requireAuth } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import jenisIkanRoutes from './routes/jenisIkan.js'
import kolamRoutes from './routes/kolam.js'
import tebarRoutes from './routes/tebar.js'
import jadwalRoutes from './routes/jadwal.js'
import sortirRoutes from './routes/sortir.js'
import panenRoutes from './routes/panen.js'
import pakanRoutes from './routes/pakan.js'
import obatRoutes from './routes/obat.js'
import penjualanRoutes from './routes/penjualan.js'
import pengeluaranRoutes from './routes/pengeluaran.js'
import laporanRoutes from './routes/laporan.js'
import pengaturanRoutes from './routes/pengaturan.js'
import stokPakanRoutes from './routes/stokPakan.js'
import gantiAirRoutes from './routes/gantiAir.js'

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors())
// Batas dinaikkan dari 100kb karena foto profil & logo dikirim sebagai base64
app.use(express.json({ limit: '6mb' }))

// ---- Route PUBLIK (tidak perlu login) ----
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'kolam-ikan-api' }))
app.use('/api/auth', authRoutes)

// ---- Mulai dari sini, semua route /api/* WAJIB sudah login ----
app.use('/api', requireAuth)

app.use('/api/dashboard', dashboardRoutes)
app.use('/api/jenis-ikan', jenisIkanRoutes)
app.use('/api/kolam', kolamRoutes)
app.use('/api/tebar', tebarRoutes)
app.use('/api/jadwal', jadwalRoutes)
app.use('/api/sortir', sortirRoutes)
app.use('/api/panen', panenRoutes)
app.use('/api/pakan', pakanRoutes)
app.use('/api/obat', obatRoutes)
app.use('/api/penjualan', penjualanRoutes)
app.use('/api/pengeluaran', pengeluaranRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/pengaturan', pengaturanRoutes)
app.use('/api/stok-pakan', stokPakanRoutes)
app.use('/api/ganti-air', gantiAirRoutes)

// ---- Frontend (hasil build Vite) disajikan oleh service yang sama ----
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback: semua GET non-API dikembalikan ke index.html (vue-router history mode)
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Kolam Ikan API berjalan di http://localhost:${PORT}`)
  await testConnection()
})