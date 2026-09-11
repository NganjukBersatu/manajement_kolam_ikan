import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  try {
    const sqlPath = path.join(__dirname, 'add_jadwal_id_obat.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running migration: tambah kolom jadwal_id ke tabel obat...')
    await pool.query(sql)
    console.log('✅ Migrasi berhasil! Kolom jadwal_id sudah ada di tabel obat.')

    const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'obat'
      ORDER BY ordinal_position
    `)
    console.log('Struktur tabel obat saat ini:')
    console.table(res.rows)
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message)
  } finally {
    await pool.end()
  }
}

run()