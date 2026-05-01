import { db } from '../config/db.js'
import { availabilitySlots, chatbots } from '../models/schema.js'
import { eq, and } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'

// GET /api/availability/:chatbotId
export const getAvailability = asyncHandler(async (req, res) => {
  const slots = await db
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.chatbotId, req.params.chatbotId))

  res.json({ success: true, slots })
})

// POST /api/availability/:chatbotId
export const setAvailability = asyncHandler(async (req, res) => {
  const { chatbotId } = req.params
  const { slots } = req.body

  // Verificar que el chatbot pertenece al usuario
  const [chatbot] = await db
    .select({ id: chatbots.id })
    .from(chatbots)
    .where(and(
      eq(chatbots.id, chatbotId),
      eq(chatbots.ownerId, req.user.id)
    ))

  if (!chatbot) throw new AppError('Chatbot not found', 404)

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new AppError('You must send at least one time slot', 400)
  }

  // Validar cada slot
  for (const slot of slots) {
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw new AppError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)', 400)
    }
    if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
      throw new AppError('startTime and endTime must have the format HH:MM', 400)
    }
  }

  // Borrar horarios anteriores y reemplazarlos
  await db
    .delete(availabilitySlots)
    .where(eq(availabilitySlots.chatbotId, chatbotId))

  const inserted = await db
    .insert(availabilitySlots)
    .values(slots.map(s => ({
      chatbotId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: true,
    })))
    .returning()

  res.json({ success: true, message: 'Time slots saved', slots: inserted })
})