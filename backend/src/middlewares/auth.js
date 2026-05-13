import { createClerkClient } from '@clerk/backend'
import { AppError, asyncHandler } from './errorHandler.js'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const generateTrialEndDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new AppError('Not authorized', 401)

  let clerkUserId
  try {
    const payload = await clerkClient.verifyToken(token)
    clerkUserId = payload.sub
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message)
    throw new AppError('Invalid or expired token', 401)
  }

  let [user] = await db.select().from(users).where(eq(users.clerkId, clerkUserId))

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(clerkUserId)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email

    // Check if a pre-Clerk account exists with the same email and link it
    const [existing] = await db.select().from(users).where(eq(users.email, email))

    if (existing) {
      ;[user] = await db
        .update(users)
        .set({ clerkId: clerkUserId, updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning()
    } else {
      ;[user] = await db.insert(users).values({
        clerkId: clerkUserId,
        name,
        email,
        role: 'client',
        plan: 'trial',
        isActive: true,
        trialEndsAt: generateTrialEndDate(),
      }).returning()
    }
  }

  if (!user.isActive) throw new AppError('Account deactivated', 403)

  req.user = user
  next()
})

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  try {
    const payload = await clerkClient.verifyToken(token)
    const [user] = await db.select().from(users).where(eq(users.clerkId, payload.sub))
    if (user?.isActive) req.user = user
  } catch {
    // invalid token — continue without req.user
  }
  next()
}

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('No tienes permiso para esta acción', 403)
  }
  next()
}
