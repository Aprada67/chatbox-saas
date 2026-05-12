import { db } from '../config/db.js'
import { notifications } from '../models/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { asyncHandler } from '../middlewares/errorHandler.js'

// Crea una notificación para un usuario (fire-and-forget, no lanza)
export const createNotification = async (userId, { type, title, message, data }) => {
  try {
    await db.insert(notifications).values({ userId, type, title, message, data: data || null })
  } catch (err) {
    console.error('Error creating notification:', err.message)
  }
}

// GET /api/notifications — últimas 30 notificaciones del usuario
export const getMyNotifications = asyncHandler(async (req, res) => {
  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, req.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30)

  const unreadCount = results.filter((n) => !n.isRead).length

  res.json({ success: true, notifications: results, unreadCount })
})

// PATCH /api/notifications/:id/read — marcar una como leída
export const markAsRead = asyncHandler(async (req, res) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user.id)))

  res.json({ success: true })
})

// PATCH /api/notifications/read-all — marcar todas como leídas
export const markAllAsRead = asyncHandler(async (req, res) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, req.user.id))

  res.json({ success: true })
})

// DELETE /api/notifications/:id — eliminar una notificación
export const deleteNotification = asyncHandler(async (req, res) => {
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user.id)))

  res.json({ success: true })
})

// DELETE /api/notifications — eliminar todas las notificaciones del usuario
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  await db
    .delete(notifications)
    .where(eq(notifications.userId, req.user.id))

  res.json({ success: true })
})
