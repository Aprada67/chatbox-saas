import { db } from '../config/db.js'
import { chatbots } from '../models/schema.js'
import { eq, and } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'
import { generateUniqueSlug } from '../services/slugService.js'

// GET /api/chatbots — obtener chatbots del cliente
export const getMyChatbots = asyncHandler(async (req, res) => {
  const results = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.ownerId, req.user.id))

  res.json(results)
})

// GET /api/chatbots/:id — obtener un chatbot
export const getChatbot = asyncHandler(async (req, res) => {
  const [chatbot] = await db
    .select()
    .from(chatbots)
    .where(and(
      eq(chatbots.id, req.params.id),
      eq(chatbots.ownerId, req.user.id)
    ))

  if (!chatbot) throw new AppError('Chatbot not found', 404)

  res.json({ success: true, chatbot })
})

// GET /api/chatbots/public/:slug — vista pública (sin auth)
export const getPublicChatbot = asyncHandler(async (req, res) => {
  const [chatbot] = await db
    .select({
      id: chatbots.id,
      name: chatbots.name,
      welcomeMessage: chatbots.welcomeMessage,
      color: chatbots.color,
      bgImage: chatbots.bgImage,
      steps: chatbots.steps,
      services: chatbots.services,
    })
    .from(chatbots)
    .where(and(
      eq(chatbots.slug, req.params.slug),
      eq(chatbots.isActive, true)
    ))

  if (!chatbot) throw new AppError('Chatbot not found or inactive', 404)

  res.json({ success: true, chatbot })
})

// POST /api/chatbots — crear chatbot
export const createChatbot = asyncHandler(async (req, res) => {
  const { name, welcomeMessage, color, steps, services } = req.body

  if (!name || !welcomeMessage) {
    throw new AppError('Name and welcome message are required', 400)
  }

  // Validar límite según plan
  const existing = await db
    .select({ id: chatbots.id })
    .from(chatbots)
    .where(eq(chatbots.ownerId, req.user.id))

  const limits = { trial: 1, pro: 1, premium: 3 }
  const limit = limits[req.user.plan] ?? 1

  if (existing.length >= limit) {
    throw new AppError(
      `Your plan ${req.user.plan} allows a maximum of ${limit} chatbot(s)`, 403
    )
  }

  const slug = await generateUniqueSlug(name)

  const [newChatbot] = await db
    .insert(chatbots)
    .values({
      ownerId:        req.user.id,
      name:           name.trim(),
      welcomeMessage: welcomeMessage.trim(),
      color:          color || '#3b82f6',
      steps:          steps || [],
      services:       services || [],
      slug,
    })
    .returning()

  res.status(201).json({
    success: true,
    message: 'Chatbot creado exitosamente',
    chatbot: newChatbot,
  })
})

// PATCH /api/chatbots/:id — editar chatbot
export const updateChatbot = asyncHandler(async (req, res) => {
  const { name, welcomeMessage, color, bgImage, steps, services, isActive } = req.body

  const [existing] = await db
    .select()
    .from(chatbots)
    .where(and(
      eq(chatbots.id, req.params.id),
      eq(chatbots.ownerId, req.user.id)
    ))

  if (!existing) throw new AppError('Chatbot not found', 404)

  const updatedData = {
    updatedAt: new Date(),
    ...(name !== undefined && { name: name.trim() }),
    ...(welcomeMessage !== undefined && { welcomeMessage: welcomeMessage.trim() }),
    ...(color !== undefined && { color }),
    ...(bgImage !== undefined && { bgImage }),
    ...(steps !== undefined && { steps }),
    ...(services !== undefined && { services }),
    ...(isActive !== undefined && { isActive }),
  }

  const [updated] = await db
    .update(chatbots)
    .set(updatedData)
    .where(eq(chatbots.id, req.params.id))
    .returning()

  res.json({ success: true, message: 'Chatbot updated successfully', chatbot: updated })
})

// DELETE /api/chatbots/:id — eliminar chatbot
export const deleteChatbot = asyncHandler(async (req, res) => {
  const [existing] = await db
    .select()
    .from(chatbots)
    .where(and(
      eq(chatbots.id, req.params.id),
      eq(chatbots.ownerId, req.user.id)
    ))

  if (!existing) throw new AppError('Chatbot not found', 404)
    
  await db.delete(chatbots).where(eq(chatbots.id, req.params.id))

  res.json({ success: true, message: 'Chatbot deleted successfully' })
})