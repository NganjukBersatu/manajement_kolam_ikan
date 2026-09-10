import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  try {
    const sqlPath = path.join(__dirname, 'add_harga_per_kg.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running migration...')
    await pool.query(sql)
    console.log('✅ Migrasi harga_per_kg berhasil dijalankan!')

    const res = await pool.query('SELECT id, nama, hari_sortir, hari_panen, harga_per_kg FROM jenis_ikan')
    console.log('Data jenis_ikan saat ini:')
    console.table(res.rows)
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message)
  } finally {
    await pool.end()
  }
}

run()
