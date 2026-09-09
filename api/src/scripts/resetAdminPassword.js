// src/scripts/resetAdminPassword.js
// Cara pakai: node src/scripts/resetAdminPassword.js <username> <password_baru>
// Contoh: node src/scripts/resetAdminPassword.js admin admin123

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { users } from '../drizzle/schema.js'

async function main() {
  const username = process.argv[2]
  const password = process.argv[3]

  if (!username || !password) {
    console.log('Cara pakai: node src/scripts/resetAdminPassword.js <username> <password_baru>')
    process.exit(1)
  }

  try {
    const hash = await bcrypt.hash(password, 10)

    const result = await db
      .update(users)
      .set({ passwordHash: hash })
      .where(eq(users.username, username))
      .returning({ id: users.id, username: users.username })

    if (result.length === 0) {
      console.log(`❌ User '${username}' tidak ditemukan di database.`)
      process.exit(1)
    }

    console.log(`✅ Password user '${username}' berhasil di-reset menjadi '${password}'`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal reset password:', err)
    process.exit(1)
  }
}

main()