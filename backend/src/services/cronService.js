import cron from 'node-cron'
import { db } from '../config/db.js'
import { appointments } from '../models/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendAppointmentReminder } from './emailService.js'

// Se encarga de ejecutar tareas programadas, como enviar recordatorios de citas a los clientes.
export const startCronJobs = () => {

  // Corre todos los días a las 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Cron: verifying reminders...')

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfter = new Date(tomorrow)
      dayAfter.setHours(23, 59, 59, 999)

      const upcoming = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.status, 'confirmed'),
          gte(appointments.date, tomorrow),
          lte(appointments.date, dayAfter)
        ))

      console.log(`Cron: ${upcoming.length} reminder(s) to send`)

      for (const appointment of upcoming) {
        await sendAppointmentReminder(appointment)
      }

    } catch (error) {
      console.error('Cron error:', error.message)
    }
  })

  console.log('Cron jobs started')
}