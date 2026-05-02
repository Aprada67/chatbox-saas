import jwt from 'jsonwebtoken'
import { AppError, asyncHandler } from './errorHandler.js'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

export const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    throw new AppError('Not authorized - Token required', 401)
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401)
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: users.plan,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, decoded.id))

  if (!user) {
    throw new AppError('El usuario de este token ya no existe', 401)
  }

  if (!user.isActive) {
    throw new AppError('Cuenta desactivada — contacta al administrador', 403)
  }

  req.user = user
  next()
})

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('No tienes permiso para esta acción', 403)
  }
  next()
}