// src/scripts/checkUsers.js
// Cara pakai: node src/scripts/checkUsers.js
import 'dotenv/config'
import { db } from '../db/drizzle.js'
import { users } from '../drizzle/schema.js'

async function main() {
  try {
    const result = await db.select().from(users)
    console.log('📋 Daftar user di database:')
    console.table(result.map(u => ({
      id: u.id,
      username: u.username,
      passwordHash: u.passwordHash.substring(0, 20) + '...',
    })))
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal mengambil data users:', err)
    process.exit(1)
  }
}

main()