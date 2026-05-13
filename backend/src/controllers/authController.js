import Stripe from 'stripe'
import { createClerkClient } from '@clerk/backend'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user })
})

// PATCH /api/auth/preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const { emailNotifs, reminderNotifs, timezone } = req.body

  const updates = {}
  if (emailNotifs !== undefined) updates.emailNotifs = Boolean(emailNotifs)
  if (reminderNotifs !== undefined) updates.reminderNotifs = Boolean(reminderNotifs)
  if (timezone !== undefined) updates.timezone = timezone
  updates.updatedAt = new Date()

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, req.user.id))
    .returning({
      id: users.id,
      emailNotifs: users.emailNotifs,
      reminderNotifs: users.reminderNotifs,
      timezone: users.timezone,
    })

  res.json({ success: true, user: updated })
})

// DELETE /api/auth/account
export const deleteAccount = asyncHandler(async (req, res) => {
  if (req.user.stripeSubscriptionId) {
    try { await stripe.subscriptions.cancel(req.user.stripeSubscriptionId) } catch {}
  }
  try { await clerkClient.users.deleteUser(req.user.clerkId) } catch {}
  await db.delete(users).where(eq(users.id, req.user.id))
  res.json({ success: true, message: 'Account deleted' })
})

// POST /api/auth/activate-session — links a completed Stripe checkout session to the current user
export const activateStripeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body
  if (!sessionId) throw new AppError('sessionId is required', 400)

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  const isAcceptable =
    session.status === 'complete' &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')

  if (!isAcceptable) throw new AppError('Checkout session not completed', 400)

  const plan = session.metadata?.plan || 'trial'

  await db.update(users).set({
    plan,
    stripeCustomerId: session.customer || null,
    stripeSubscriptionId: session.subscription || null,
    updatedAt: new Date(),
  }).where(eq(users.id, req.user.id))

  const [updatedUser] = await db.select().from(users).where(eq(users.id, req.user.id))
  res.json({ success: true, user: updatedUser })
})
