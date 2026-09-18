import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  try {
    const sqlPath = path.join(__dirname, 'add_ganti_air.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running migration: membuat tabel ganti_air...')
    await pool.query(sql)
    console.log('✅ Migrasi berhasil! Tabel ganti_air sudah dibuat.')

    const res = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.log('Daftar tabel saat ini:')
    console.table(res.rows)
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message)
  } finally {
    await pool.end()
  }
}

run()