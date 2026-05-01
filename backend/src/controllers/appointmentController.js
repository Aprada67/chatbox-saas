import { db } from '../config/db.js'
import { appointments, chatbots, availabilitySlots } from '../models/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'
import {
  sendAppointmentConfirmation,
  sendCancellationEmail
} from '../services/emailService.js'

// Genera los slots disponibles de un día dado los horarios del negocio
const generateTimeSlots = (startTime, endTime, durationMins) => {
  const slots = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current + durationMins <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, '0')
    const m = String(current % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    current += durationMins
  }

  return slots
}

// GET /api/appointments/available/:chatbotId?date=YYYY-MM-DD&durationMins=30
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { chatbotId } = req.params
  const { date, durationMins } = req.query

  if (!date || !durationMins) {
    throw new AppError('date and durationMins are required', 400)
  }

  const duration = parseInt(durationMins)
  const selected = new Date(date)

  if (isNaN(selected.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400)
  }

  // Verificar que el chatbot existe y está activo
  const [chatbot] = await db
    .select({ id: chatbots.id })
    .from(chatbots)
    .where(and(
      eq(chatbots.id, chatbotId),
      eq(chatbots.isActive, true)
    ))

  if (!chatbot) throw new AppError('Chatbot not found', 404)

  // 0 = domingo, 1 = lunes ... 6 = sábado
  const dayOfWeek = selected.getDay()

  // Obtener horarios del negocio para ese día
  const slots = await db
    .select()
    .from(availabilitySlots)
    .where(and(
      eq(availabilitySlots.chatbotId, chatbotId),
      eq(availabilitySlots.dayOfWeek, dayOfWeek),
      eq(availabilitySlots.isActive, true)
    ))

  if (slots.length === 0) {
    return res.json({
      success: true,
      available: [],
      message: 'There is no availability for this day'
    })
  }

  // Generar todos los slots posibles del día
  let allSlots = []
  for (const slot of slots) {
    const generated = generateTimeSlots(slot.startTime, slot.endTime, duration)
    allSlots = [...allSlots, ...generated]
  }

  // Obtener citas ya reservadas ese día
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookedAppointments = await db
    .select({ date: appointments.date, durationMins: appointments.durationMins })
    .from(appointments)
    .where(and(
      eq(appointments.chatbotId, chatbotId),
      gte(appointments.date, startOfDay),
      lte(appointments.date, endOfDay),
      eq(appointments.status, 'confirmed')
    ))

  // Filtrar slots ocupados
  const bookedTimes = bookedAppointments.map(a => {
    const d = new Date(a.date)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const available = allSlots.filter(slot => !bookedTimes.includes(slot))

  res.json({ success: true, date, available })
})

// POST /api/appointments — crear cita
export const createAppointment = asyncHandler(async (req, res) => {
  const {
    chatbotId, guestName, guestEmail,
    guestPhone, service, price,
    durationMins, date
  } = req.body

  // Validaciones
  if (!chatbotId || !guestName || !service || !price || !durationMins || !date) {
    throw new AppError('Missing required fields', 400)
  }

  if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    throw new AppError('Invalid email format', 400)
  }

  const appointmentDate = new Date(date)
  if (isNaN(appointmentDate.getTime())) {
    throw new AppError('Invalid date format', 400)
  }

  if (appointmentDate < new Date()) {
    throw new AppError('You cannot schedule an appointment in the past', 400)
  }

  // Verificar que el chatbot existe
  const [chatbot] = await db
    .select({ id: chatbots.id, ownerId: chatbots.ownerId })
    .from(chatbots)
    .where(and(
      eq(chatbots.id, chatbotId),
      eq(chatbots.isActive, true)
    ))

  if (!chatbot) throw new AppError('Chatbot not found or inactive', 404)

  // Verificar que el slot no está ocupado
  const slotStart = new Date(date)
  const slotEnd = new Date(date)
  slotEnd.setMinutes(slotEnd.getMinutes() + parseInt(durationMins))

  const conflict = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(
      eq(appointments.chatbotId, chatbotId),
      eq(appointments.status, 'confirmed'),
      gte(appointments.date, slotStart),
      lte(appointments.date, slotEnd)
    ))

  if (conflict.length > 0) {
    throw new AppError('This time slot is no longer available. Please choose another.', 409)
  }

  // Crear la cita
  const [newAppointment] = await db
    .insert(appointments)
    .values({
      chatbotId,
      clientId: req.user?.id || null,
      guestName: guestName.trim(),
      guestEmail: guestEmail?.trim() || null,
      guestPhone: guestPhone?.trim() || null,
      service: service.trim(),
      price: parseInt(price),
      durationMins: parseInt(durationMins),
      date: appointmentDate,
      status: 'confirmed',
    })
    .returning()

  // Enviar email de confirmación (no bloquea la respuesta)
  sendAppointmentConfirmation(newAppointment)

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    appointment: newAppointment,
  })
})

// GET /api/appointments/my — citas del usuario autenticado
export const getMyAppointments = asyncHandler(async (req, res) => {
  const results = await db
    .select({
      id: appointments.id,
      service: appointments.service,
      price: appointments.price,
      durationMins: appointments.durationMins,
      date: appointments.date,
      status: appointments.status,
      guestName: appointments.guestName,
      chatbotId: appointments.chatbotId,
    })
    .from(appointments)
    .where(eq(appointments.clientId, req.user.id))

  res.json({ success: true, appointments: results })
})

// GET /api/appointments/chatbot/:chatbotId — citas de un chatbot (para el negocio)
export const getChatbotAppointments = asyncHandler(async (req, res) => {
  const { chatbotId } = req.params

  // Verificar que el chatbot pertenece al usuario
  const [chatbot] = await db
    .select({ id: chatbots.id })
    .from(chatbots)
    .where(and(
      eq(chatbots.id, chatbotId),
      eq(chatbots.ownerId, req.user.id)
    ))

  if (!chatbot) throw new AppError('Chatbot not found', 404)

  const results = await db
    .select()
    .from(appointments)
    .where(eq(appointments.chatbotId, chatbotId))

  res.json({ success: true, appointments: results })
})

// PATCH /api/appointments/:id/cancel — cancelar cita
export const cancelAppointment = asyncHandler(async (req, res) => {
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, req.params.id))

  if (!appointment) throw new AppError('Appointment not found', 404)

  // Solo el dueño de la cita o el dueño del chatbot pueden cancelar
  const [chatbot] = await db
    .select({ ownerId: chatbots.ownerId })
    .from(chatbots)
    .where(eq(chatbots.id, appointment.chatbotId))

  const isOwner = appointment.clientId === req.user.id
  const isBusiness = chatbot.ownerId === req.user.id

  if (!isOwner && !isBusiness) {
    throw new AppError('You do not have permission to cancel this appointment', 403)
  }

  if (appointment.status === 'cancelled') {
    throw new AppError('This appointment is already cancelled', 400)
  }

  if (appointment.status === 'completed') {
    throw new AppError('You cannot cancel a completed appointment', 400)
  }

  const [updated] = await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(appointments.id, req.params.id))
    .returning()

  // Enviar email de cancelación
  sendCancellationEmail(updated)

  res.json({ success: true, message: 'Appointment cancelled successfully', appointment: updated })
})