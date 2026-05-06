import request from 'supertest'
import app from '../app.js'
import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
}

// Marca al usuario como verificado en la DB para los tests que requieran
// un usuario "ya activado" (login, ruta protegida, etc.)
const markVerified = async (email) => {
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, email.toLowerCase()))
}

describe('Auth — Register', () => {

  test('register a user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    // Nuevo flujo: register no devuelve token; sólo el email
    expect(res.body.email).toBe(validUser.email)
    expect(res.body.token).toBeUndefined()
  })

  test('reject registration without name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('reject email with invalid format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'no-es-email', password: 'password123' })

    expect(res.status).toBe(400)
  })

  test('reject password with less than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: '123' })

    expect(res.status).toBe(400)
  })

  test('reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser)

    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)

    expect(res.status).toBe(409)
  })

})

describe('Auth — Verify code', () => {

  test('verify code → auto-login (token + user)', async () => {
    await request(app).post('/api/auth/register').send(validUser)

    // Lee el código directamente desde la DB (en producción llega por email)
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, validUser.email))

    const res = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: validUser.email, code: row.emailVerificationCode })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(validUser.email)
    expect(res.body.user.password).toBeUndefined()
  })

  test('reject invalid code', async () => {
    await request(app).post('/api/auth/register').send(validUser)

    const res = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: validUser.email, code: '000000' })

    expect(res.status).toBe(400)
  })

})

describe('Auth — Login', () => {

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser)
    await markVerified(validUser.email)
  })

  test('login a verified user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  test('reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  test('reject unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@email.com', password: 'password123' })

    expect(res.status).toBe(401)
  })

  test('reject login if email is not verified', async () => {
    // Crea un segundo usuario sin verificar
    const unverified = { name: 'NV', email: 'nv@example.com', password: 'password123' }
    await request(app).post('/api/auth/register').send(unverified)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: unverified.email, password: unverified.password })

    expect(res.status).toBe(403)
  })

})

describe('Auth — Ruta protegida', () => {

  const obtainToken = async () => {
    await request(app).post('/api/auth/register').send(validUser)
    await markVerified(validUser.email)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password })
    return res.body.token
  }

  test('access with valid token', async () => {
    const token = await obtainToken()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(validUser.email)
  })

  test('reject access without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer tokeninvalido123')

    expect(res.status).toBe(401)
  })

})
