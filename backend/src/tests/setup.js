import request from 'supertest'
import { db } from '../config/db.js'
import { appointments, availabilitySlots, chatbots, users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

// Limpia las tablas en orden correcto antes de cada test
// El orden importa por las foreign keys
beforeEach(async () => {
  await db.delete(appointments)
  await db.delete(availabilitySlots)
  await db.delete(chatbots)
  await db.delete(users)
})

// Cierra la conexión al terminar todos los tests
afterAll(async () => {
  console.log('Tests completed')
})

// Helper: crea un usuario, marca su email como verificado
// y devuelve un token JWT válido haciendo login.
// Sustituye al antiguo flujo en el que register devolvía token directamente.
export const registerAndLogin = async (app, user) => {
  await request(app).post('/api/auth/register').send(user)
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, user.email.toLowerCase()))
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password })
  return res.body.token
}