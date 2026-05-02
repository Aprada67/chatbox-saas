import { db } from '../config/db.js'
import { appointments, availabilitySlots, chatbots, users } from '../models/schema.js'

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