import bcrypt from 'bcryptjs'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'
import { AppError, asyncHandler } from '../middlewares/errorHandler.js'
import { generateToken, generateTrialEndDate } from '../services/tokenService.js'

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
  res.json({
    success: true,
    user: req.user,
  })
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