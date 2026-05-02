import { db } from '../config/db.js'
import { users, chatbots, appointments } from '../models/schema.js'
import { eq, ne, count } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'

// GET /api/admin/stats — estadísticas generales
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(ne(users.role, 'admin'))

  const [totalChatbots] = await db
    .select({ count: count() })
    .from(chatbots)

  const [totalAppointments] = await db
    .select({ count: count() })
    .from(appointments)

  const planCounts = await db
    .select({ plan: users.plan, count: count() })
    .from(users)
    .where(ne(users.role, 'admin'))
    .groupBy(users.plan)

  res.json({
    success: true,
    stats: {
      totalUsers: totalUsers.count,
      totalChatbots: totalChatbots.count,
      totalAppointments: totalAppointments.count,
      byPlan: planCounts,
    }
  })
})

// GET /api/admin/users — todos los clientes
export const getAllUsers = asyncHandler(async (req, res) => {
  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: users.plan,
      isActive: users.isActive,
      trialEndsAt: users.trialEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(ne(users.role, 'admin'))

  res.json({ success: true, users: results })
})

// GET /api/admin/users/:id — detalle de un cliente
export const getUserById = asyncHandler(async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: users.plan,
      isActive: users.isActive,
      trialEndsAt: users.trialEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, req.params.id))

  if (!user) throw new AppError('User not found', 404)

  const userChatbots = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.ownerId, req.params.id))

  res.json({ success: true, user, chatbots: userChatbots })
})

// PATCH /api/admin/users/:id/plan — cambiar plan
export const updateUserPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body

  if (!plan || !['trial', 'pro', 'premium'].includes(plan)) {
    throw new AppError('Invalid plan. Must be trial, pro or premium', 400)
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, req.params.id))

  if (!user) throw new AppError('User not found', 404)

  const [updated] = await db
    .update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, req.params.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: users.plan,
    })

  res.json({
    success: true,
    message: `Plan updated to ${plan}`,
    user: updated,
  })
})

// PATCH /api/admin/users/:id/toggle — activar o desactivar cuenta
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const [user] = await db
    .select({ id: users.id, isActive: users.isActive, role: users.role })
    .from(users)
    .where(eq(users.id, req.params.id))

  if (!user) throw new AppError('User not found', 404)

  if (user.role === 'admin') {
    throw new AppError('You cannot deactivate an administrator account', 403)
  }

  const [updated] = await db
    .update(users)
    .set({ isActive: !user.isActive, updatedAt: new Date() })
    .where(eq(users.id, req.params.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
    })

  res.json({
    success: true,
    message: updated.isActive ? 'Account activated' : 'Account deactivated',
    user: updated,
  })
})

// GET /api/admin/chatbots — todos los chatbots
export const getAllChatbots = asyncHandler(async (req, res) => {
  const results = await db
    .select({
      id: chatbots.id,
      name: chatbots.name,
      slug: chatbots.slug,
      isActive: chatbots.isActive,
      ownerId: chatbots.ownerId,
      createdAt: chatbots.createdAt,
    })
    .from(chatbots)

  res.json({ success: true, chatbots: results })
})

// PATCH /api/admin/chatbots/:id — editar cualquier chatbot
export const adminUpdateChatbot = asyncHandler(async (req, res) => {
  const { name, welcomeMessage, color, steps, services, isActive } = req.body

  const [existing] = await db
    .select({ id: chatbots.id })
    .from(chatbots)
    .where(eq(chatbots.id, req.params.id))

  if (!existing) throw new AppError('Chatbot not found', 404)

  const updateData = {
    updatedAt: new Date(),
    ...(name !== undefined && { name: name.trim() }),
    ...(welcomeMessage !== undefined && { welcomeMessage: welcomeMessage.trim() }),
    ...(color !== undefined && { color }),
    ...(steps !== undefined && { steps }),
    ...(services !== undefined && { services }),
    ...(isActive !== undefined && { isActive }),
  }

  const [updated] = await db
    .update(chatbots)
    .set(updateData)
    .where(eq(chatbots.id, req.params.id))
    .returning()

  res.json({ success: true, message: 'Chatbot updated', chatbot: updated })
})