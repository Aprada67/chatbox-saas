import Stripe from 'stripe'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'
import { asyncHandler } from '../middlewares/errorHandler.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_PRO]: 'pro',
  [process.env.STRIPE_PRICE_PREMIUM]: 'premium',
}

const PLAN_TIER = { trial: 0, pro: 1, premium: 2 }

// Resuelve (o crea) el customer de Stripe asociado al usuario,
// reutilizando uno existente si lo hay para evitar duplicados.
const resolveCustomerId = async (user) => {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId)
      if (existing && !existing.deleted) {
        return user.stripeCustomerId
      }
    } catch (err) {
      // El customer guardado no existe en Stripe — caemos al fallback.
    }
  }

  // Busca por email antes de crear uno nuevo
  const search = await stripe.customers.list({ email: user.email, limit: 1 })
  let customerId = search.data[0]?.id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    })
    customerId = customer.id
  }

  await db
    .update(users)
    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return customerId
}

// Cancela todas las suscripciones del customer excepto la indicada (keepId)
const cancelOtherSubscriptions = async (customerId, keepId) => {
  const all = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })

  const cancellable = all.data.filter(
    (s) => s.id !== keepId && !['canceled', 'incomplete_expired'].includes(s.status)
  )

  for (const sub of cancellable) {
    try {
      await stripe.subscriptions.cancel(sub.id)
    } catch (err) {
      console.error('Error cancelling duplicate subscription:', sub.id, err.message)
    }
  }
}

// POST /api/stripe/checkout — crea sesión de pago en Stripe
export const createCheckout = asyncHandler(async (req, res) => {
  const { plan } = req.body

  if (!['pro', 'premium'].includes(plan)) {
    return res.status(400).json({ success: false, message: 'Invalid plan' })
  }

  const priceId = plan === 'pro'
    ? process.env.STRIPE_PRICE_PRO
    : process.env.STRIPE_PRICE_PREMIUM

  if (!priceId) {
    return res.status(500).json({ success: false, message: 'Price ID not configured' })
  }

  // Obtiene o crea el customer en Stripe (sin duplicar)
  const customerId = await resolveCustomerId(req.user)

  // ─── Caso 1: el usuario ya tiene una suscripción → upgrade/downgrade con prorrateo
  if (req.user.stripeSubscriptionId) {
    let existingSub = null
    try {
      existingSub = await stripe.subscriptions.retrieve(req.user.stripeSubscriptionId)
    } catch (err) {
      // La suscripción guardada ya no existe en Stripe — limpiamos en DB y caemos a checkout.
      existingSub = null
      await db
        .update(users)
        .set({ stripeSubscriptionId: null, updatedAt: new Date() })
        .where(eq(users.id, req.user.id))
    }

    if (
      existingSub &&
      !['canceled', 'incomplete_expired'].includes(existingSub.status)
    ) {
      // Si ya está en el mismo precio, no hay nada que hacer
      const currentPriceId = existingSub.items.data[0]?.price?.id
      if (currentPriceId === priceId) {
        return res.json({ success: true, upgraded: true, message: 'Ya tienes este plan' })
      }

      // Determina si es upgrade o downgrade
      const currentPlan = PRICE_TO_PLAN[currentPriceId] || req.user.plan
      const isUpgrade = PLAN_TIER[plan] >= PLAN_TIER[currentPlan]

      if (isUpgrade) {
        // ─── UPGRADE: aplica cambio inmediato con prorrateo y actualiza DB
        const itemId = existingSub.items.data[0].id

        const updated = await stripe.subscriptions.update(req.user.stripeSubscriptionId, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: 'create_prorations',
          metadata: { userId: req.user.id, plan },
        })

        // Cancela cualquier otra suscripción duplicada del customer
        await cancelOtherSubscriptions(customerId, updated.id)

        // Sincroniza el plan en DB inmediatamente (el webhook también lo hará, pero adelantamos UX)
        await db
          .update(users)
          .set({
            plan,
            stripeSubscriptionId: updated.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user.id))

        return res.json({ success: true, upgraded: true })
      }

      // ─── DOWNGRADE: programa el cambio para el final del período actual
      // Usamos Subscription Schedules. Phase 1 mantiene el plan actual hasta
      // current_period_end, Phase 2 aplica el nuevo plan después.
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: req.user.stripeSubscriptionId,
      })

      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: [{ price: currentPriceId, quantity: 1 }],
            start_date: existingSub.current_period_start,
            end_date: existingSub.current_period_end,
            proration_behavior: 'none',
          },
          {
            items: [{ price: priceId, quantity: 1 }],
            proration_behavior: 'none',
            metadata: { userId: req.user.id, plan },
          },
        ],
        metadata: { userId: req.user.id, plan },
      })

      // No actualizamos DB — el webhook customer.subscription.updated lo hará
      // cuando arranque la nueva fase al final del período.
      return res.json({
        success: true,
        upgraded: true,
        scheduled: true,
        periodEnd: existingSub.current_period_end * 1000,
        message: `Tu plan cambiará a ${plan} al final del período actual`,
      })
    }
  }

  // ─── Caso 2: usuario sin suscripción activa → checkout con trial de 7 días
  // Antes de crear la sesión, cancelamos cualquier suscripción residual del customer
  await cancelOtherSubscriptions(customerId, null)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    payment_method_collection: 'always',
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.CLIENT_URL + '/dashboard/billing?payment=success',
    cancel_url: process.env.CLIENT_URL + '/dashboard/billing?payment=cancelled',
    metadata: { userId: req.user.id, plan },
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: req.user.id, plan },
    },
  })

  res.json({ success: true, url: session.url })
})

// POST /api/stripe/webhook — recibe eventos de Stripe
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  // Verifica que el evento viene realmente de Stripe
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Stripe webhook error:', err.message)
    return res.status(400).send('Webhook error: ' + err.message)
  }

  try {
    switch (event.type) {

      // Pago/checkout completado → activa el plan del usuario y elimina duplicados
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        if (userId && plan) {
          await db
            .update(users)
            .set({
              plan,
              stripeSubscriptionId: session.subscription,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))

          if (session.customer && session.subscription) {
            await cancelOtherSubscriptions(session.customer, session.subscription)
          }

          console.log('Plan activated — user:', userId, 'plan:', plan)
        }
        break
      }

      // Suscripción actualizada desde el portal de Stripe o vía API
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId]
        if (plan && sub.customer) {
          await db
            .update(users)
            .set({
              plan,
              stripeSubscriptionId: sub.id,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, sub.customer))
          console.log('Plan updated — customer:', sub.customer, 'plan:', plan)
        }
        break
      }

      // Suscripción cancelada → vuelve a trial expirado
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        if (sub.customer) {
          await db
            .update(users)
            .set({
              plan: 'trial',
              stripeSubscriptionId: null,
              trialEndsAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, sub.customer))
          console.log('Subscription cancelled — customer:', sub.customer)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  res.json({ received: true })
}

// GET /api/stripe/sync — sincroniza el plan leyendo la suscripción activa desde Stripe
// y elimina suscripciones duplicadas si las hubiera.
export const syncPlan = asyncHandler(async (req, res) => {
  const customerId = req.user.stripeCustomerId
  if (!customerId) {
    return res.json({ success: true, plan: req.user.plan })
  }

  // Listamos TODAS las suscripciones (no solo active) para detectar trialing y duplicados
  const all = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })

  const live = all.data.filter((s) =>
    ['active', 'trialing', 'past_due'].includes(s.status)
  )

  if (live.length === 0) {
    return res.json({ success: true, plan: req.user.plan })
  }

  // La más reciente gana — cancelamos el resto
  live.sort((a, b) => b.created - a.created)
  const winner = live[0]
  const losers = live.slice(1)

  for (const loser of losers) {
    try {
      await stripe.subscriptions.cancel(loser.id)
      console.log('Cancelled duplicate subscription:', loser.id)
    } catch (err) {
      console.error('Error cancelling duplicate:', loser.id, err.message)
    }
  }

  const priceId = winner.items.data[0]?.price?.id
  const plan = PRICE_TO_PLAN[priceId]

  if (plan) {
    await db.update(users).set({
      plan,
      stripeSubscriptionId: winner.id,
      updatedAt: new Date(),
    }).where(eq(users.id, req.user.id))
  }

  res.json({ success: true, plan: plan || req.user.plan })
})

// POST /api/stripe/portal — abre el portal de facturación de Stripe
export const createPortal = asyncHandler(async (req, res) => {
  if (!req.user.stripeCustomerId) {
    return res.status(400).json({
      success: false,
      message: 'No active subscription found'
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: process.env.CLIENT_URL + '/dashboard/billing',
  })

  res.json({ success: true, url: session.url })
})
