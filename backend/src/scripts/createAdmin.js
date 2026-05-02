import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

// Script para crear un usuario admin
const createAdmin = async () => {
  const email    = 'admin@chatboxsaas.com'
  const password = 'Admin1234!'
  const name     = 'Administrador'

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))

  if (existing) {
    console.log('Admin user already exists')
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const [admin] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role:     'admin',
      plan:     'premium',
      isActive: true,
    })
    .returning({ id: users.id, email: users.email, role: users.role })

  console.log('Admin created:', admin)
  process.exit(0)
}

createAdmin().catch(err => {
  console.error(err)
  process.exit(1)
})