import request from 'supertest'
import app from '../app.js'

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
}

describe('Auth — Register', () => {

  test('register a user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(validUser.email)
    expect(res.body.user.password).toBeUndefined()
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

describe('Auth — Login', () => {

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser)
  })

  test('login a user successfully', async () => {
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

})

describe('Auth — Ruta protegida', () => {

  test('access with valid token', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send(validUser)

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${register.body.token}`)

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