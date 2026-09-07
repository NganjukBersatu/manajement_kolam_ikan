// Cara pakai (dari folder api/):
//   node src/scripts/createAdmin.js <username> <password>
// Contoh:
//   node src/scripts/createAdmin.js admin rahasia123

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../db/drizzle.js'
import { users } from '../drizzle/schema.js'

const [, , username, password] = process.argv

if (!username || !password) {
  console.log('Cara pakai: node src/scripts/createAdmin.js <username> <password>')
  process.exit(1)
}

try {
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await db.insert(users).values({ username, passwordHash }).returning()
  console.log(`✅ Akun admin "${result[0].username}" berhasil dibuat.`)
} catch (err) {
  console.error('❌ Gagal membuat akun admin:', err.message)
} finally {
  process.exit(0)
}