import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import Stripe from 'stripe'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { and, eq, gt } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'
import { generateToken, generateTrialEndDate } from '../services/tokenService.js'
import { sendEmail, sendVerificationCode } from '../services/emailService.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Genera un código numérico de 6 dígitos
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

// POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, sessionId } = req.body

  // Validar campos
  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400)
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid email format', 400)
  }

  // Verificar si ya existe
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))

  if (existing) {
    throw new AppError('Email already in use', 409)
  }

  // Si viene un sessionId de Stripe, recupera la sesión y extrae plan/customer
  let plan = 'trial'
  let stripeCustomerId = null
  let stripeSubscriptionId = null

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      // Solo aceptamos sesiones COMPLETADAS por el usuario.
      // payment_status 'no_payment_required' = trial (cobro futuro, pero el usuario sí introdujo la tarjeta).
      // payment_status 'paid' = cobro inmediato completado.
      // Nunca aceptar 'open' (checkout abandonado) ni 'unpaid' (cobro fallido).
      const isAcceptable =
        session.status === 'complete' &&
        (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')

      if (isAcceptable) {
        plan = session.metadata?.plan || 'trial'
        stripeCustomerId = session.customer || null
        stripeSubscriptionId = session.subscription || null
      }
    } catch (err) {
      console.error('Error retrieving Stripe session:', err.message)
      // Si la sesión no se puede recuperar, continuamos como trial
    }
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 12)

  // Genera código de verificación de 6 dígitos (15 min de expiración)
  const verificationCode = generateVerificationCode()
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000)

  // Crear usuario
  const [newUser] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'client',
      plan,
      trialEndsAt: generateTrialEndDate(),
      stripeCustomerId,
      stripeSubscriptionId,
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    })

  // Siempre imprime el código en consola (útil si el email falla en desarrollo)
  console.log(`\n🔑 CÓDIGO DE VERIFICACIÓN para ${newUser.email}: ${verificationCode}\n`)

  try {
    await sendVerificationCode(newUser, verificationCode)
  } catch (err) {
    console.error('Error sending verification code:', err.message)
  }

  res.status(201).json({
    success: true,
    email: newUser.email,
  })
})

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validar campos
  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  // Buscar usuario
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))

  // Mismo mensaje para email y contraseña incorrectos
  // (no revelar si el email existe o no)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Email o contraseña incorrectos', 401)
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact admin or renew your subscription.', 403)
  }

  if (!user.emailVerified) {
    throw new AppError('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.', 403)
  }

  const token = generateToken(user.id)

  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: userWithoutPassword,
  })
})

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

// PATCH /api/auth/password — cambiar contraseña
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  // Validaciones básicas
  if (!currentPassword || !newPassword) {
    throw new AppError('Both current and new password are required', 400)
  }
  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400)
  }

  // Obtiene el usuario con su contraseña actual
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.id))

  // Verifica que la contraseña actual sea correcta
  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401)
  }

  // Hashea y guarda la nueva contraseña
  const hashed = await bcrypt.hash(newPassword, 12)
  await db
    .update(users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(users.id, req.user.id))

  res.json({ success: true, message: 'Password updated successfully' })
})

// POST /api/auth/forgot-password — sends a 6-digit reset code
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const genericResponse = () =>
    res.json({
      success: true,
      message: 'If an account exists for that email, you will receive a reset code.',
    })

  if (!email || typeof email !== 'string') {
    return genericResponse()
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))

  if (!user) {
    return genericResponse()
  }

  const code = generateVerificationCode()
  const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await db
    .update(users)
    .set({
      resetPasswordToken: code,
      resetPasswordExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  console.log(`\n🔑 RESET CODE for ${user.email}: ${code}\n`)

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset code — ServeBot',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">Reset your password</h2>
          <p>Hi <strong>${user.name}</strong>, use the code below to reset your password:</p>
          <div style="text-align:center;margin:32px 0">
            <div style="
              display:inline-block;
              padding:18px 28px;
              background:#f1f5f9;
              border:1px solid #e2e8f0;
              border-radius:12px;
              font-family:'Courier New',Courier,monospace;
              font-size:36px;
              font-weight:700;
              color:#1e293b;
              letter-spacing:12px;
            ">
              ${code}
            </div>
          </div>
          <p style="color:#64748b;font-size:13px;text-align:center">
            This code expires in 15 minutes.
          </p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Error sending password reset email:', err.message)
    throw new AppError('Failed to send the reset code. Please try again.', 500)
  }

  return genericResponse()
})

// POST /api/auth/reset-password — resets password using a 6-digit code
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body

  if (!email || !code || !password) {
    throw new AppError('Email, code and password are required', 400)
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email.toLowerCase().trim()),
        eq(users.resetPasswordToken, String(code).trim()),
        gt(users.resetPasswordExpires, new Date())
      )
    )

  if (!user) {
    throw new AppError('Incorrect or expired code', 400)
  }

  const hashed = await bcrypt.hash(password, 12)

  await db
    .update(users)
    .set({
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  res.json({ success: true, message: 'Password updated successfully' })
})

// POST /api/auth/verify-code — verifica el email con código de 6 dígitos
export const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    throw new AppError('Email y código son requeridos', 400)
  }

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email.toLowerCase().trim()),
        eq(users.emailVerificationCode, String(code).trim()),
        gt(users.emailVerificationExpires, new Date()),
        eq(users.emailVerified, false)
      )
    )

  if (!user) {
    throw new AppError('Código incorrecto o expirado', 400)
  }

  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  // Auto-login: emite JWT
  const token = generateToken(user.id)
  const { password: _, ...userWithoutPassword } = user
  userWithoutPassword.emailVerified = true

  res.json({
    success: true,
    message: 'Email verificado correctamente',
    token,
    user: userWithoutPassword,
  })
})

// POST /api/auth/resend-verification — reenvía el código de verificación
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Respuesta genérica para no revelar si el email existe
  const genericResponse = () =>
    res.json({
      success: true,
      message: 'Si existe una cuenta sin verificar con ese email, recibirás un nuevo código.',
    })

  if (!email || typeof email !== 'string') {
    return genericResponse()
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))

  if (!user) {
    return genericResponse()
  }

  if (user.emailVerified) {
    throw new AppError('Esta cuenta ya está verificada', 400)
  }

  // Genera un nuevo código y reemplaza el anterior
  const verificationCode = generateVerificationCode()
  const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

  await db
    .update(users)
    .set({
      emailVerificationCode: verificationCode,
      emailVerificationExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  console.log(`\n🔑 CÓDIGO DE VERIFICACIÓN para ${user.email}: ${verificationCode}\n`)

  try {
    await sendVerificationCode(user, verificationCode)
  } catch (err) {
    console.error('Error resending verification code:', err.message)
  }

  return genericResponse()
})
