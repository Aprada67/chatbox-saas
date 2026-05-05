import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { and, eq, gt } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'
import { generateToken, generateTrialEndDate } from '../services/tokenService.js'
import { sendEmail } from '../services/emailService.js'

// POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

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

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 12)

  // Crear usuario con trial de 7 días
  const [newUser] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'client',
      plan: 'trial',
      trialEndsAt: generateTrialEndDate(),
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: users.plan,
      trialEndsAt: users.trialEndsAt,
    })

  const token = generateToken(newUser.id)

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: newUser,
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

// POST /api/auth/forgot-password — solicita un enlace de recuperación
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Respuesta genérica para no revelar si el email existe
  const genericResponse = () =>
    res.json({
      success: true,
      message: 'Si existe una cuenta con ese email, recibirás un enlace de recuperación.',
    })

  if (!email || typeof email !== 'string') {
    return genericResponse()
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))

  // Aunque no exista, devolvemos la misma respuesta
  if (!user) {
    return genericResponse()
  }

  // Genera token (32 bytes hex) y guarda su SHA-256 en DB
  const rawToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await db
    .update(users)
    .set({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`

  // Envía email — si falla, no revelamos el error al cliente
  try {
    await sendEmail({
      to: user.email,
      subject: 'Recupera tu contraseña — Chatbox SaaS',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">Recupera tu contraseña</h2>
          <p>Hola <strong>${user.name}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Pulsa el botón de abajo para crear una nueva. Este enlace expira en 1 hora.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#64748b;font-size:13px">
            Si no solicitaste este cambio, puedes ignorar este email.
          </p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">
            O copia este enlace en tu navegador:<br>${resetUrl}
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Error sending password reset email:', err.message)
  }

  return genericResponse()
})

// POST /api/auth/reset-password — establece la nueva contraseña con un token válido
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    throw new AppError('Token and password are required', 400)
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetPasswordToken, hashedToken),
        gt(users.resetPasswordExpires, new Date())
      )
    )

  if (!user) {
    throw new AppError('Token inválido o expirado', 400)
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

  res.json({ success: true, message: 'Contraseña actualizada correctamente' })
})