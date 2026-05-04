import cron from 'node-cron'
import { db } from '../config/db.js'
import { appointments, chatbots, users } from '../models/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendAppointmentReminder } from './emailService.js'

// Runs every day at 9 AM — sends reminders for appointments in the next 24h
export const startScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const now      = new Date()
      const in24h    = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const in25h    = new Date(now.getTime() + 25 * 60 * 60 * 1000)

      const upcoming = await db
        .select({
          apt:     appointments,
          ownerId: chatbots.ownerId,
        })
        .from(appointments)
        .innerJoin(chatbots, eq(chatbots.id, appointments.chatbotId))
        .where(and(
          eq(appointments.status, 'confirmed'),
          gte(appointments.date, in24h),
          lte(appointments.date, in25h),
        ))

      for (const { apt, ownerId } of upcoming) {
        const [owner] = await db
          .select({ reminderNotifs: users.reminderNotifs })
          .from(users)
          .where(eq(users.id, ownerId))

        if (owner?.reminderNotifs) {
          await sendAppointmentReminder(apt)
        }
      }

      console.log(`Reminder cron: processed ${upcoming.length} appointment(s)`)
    } catch (err) {
      console.error('Reminder cron error:', err.message)
    }
  })

  console.log('Appointment reminder scheduler started')
}
