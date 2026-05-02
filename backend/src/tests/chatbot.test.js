import request from 'supertest'
import app from '../app.js'

const validUser = {
  name: 'Test Client',
  email: 'client@example.com',
  password: 'password123'
}

const validChatbot = {
  name: 'Mi Barbería',
  welcomeMessage: 'Hola, ¿en qué te ayudo?',
  color: '#3b82f6',
  services: [
    { name: 'Corte', price: 15, durationMins: 30 }
  ],
  steps: [
    { order: 1, question: '¿Qué servicio?', type: 'service' }
  ]
}

let token

beforeEach(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send(validUser)
  token = res.body.token
})

describe('Chatbots — Create', () => {

  test('create a chatbot successfully', async () => {
    const res = await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send(validChatbot)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.chatbot.slug).toBeDefined()
    expect(res.body.chatbot.name).toBe(validChatbot.name)
  })

  test('reject creation without name', async () => {
    const res = await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send({ welcomeMessage: 'Hola' })

    expect(res.status).toBe(400)
  })

  test('reject creating second chatbot in trial plan', async () => {
    await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send(validChatbot)

    const res = await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validChatbot, name: 'Segundo Bot' })

    expect(res.status).toBe(403)
  })

  test('reject creation without token', async () => {
    const res = await request(app)
      .post('/api/chatbots')
      .send(validChatbot)

    expect(res.status).toBe(401)
  })

})

describe('Chatbots — Read', () => {

  test('get a list of the client\'s chatbots', async () => {
    await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send(validChatbot)

    const res = await request(app)
      .get('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.chatbots).toHaveLength(1)
  })

  test('get a public chatbot by slug', async () => {
    await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send(validChatbot)

    const res = await request(app)
      .get('/api/chatbots/public/mi-barberia')

    expect(res.status).toBe(200)
    expect(res.body.chatbot.name).toBe(validChatbot.name)
  })

  test('return 404 for non-existent slug', async () => {
    const res = await request(app)
      .get('/api/chatbots/public/no-existe')

    expect(res.status).toBe(404)
  })

})

describe('Chatbots — Edit and Delete', () => {

  let chatbotId

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${token}`)
      .send(validChatbot)
    chatbotId = res.body.chatbot.id
  })

  test('edit a chatbot successfully', async () => {
    const res = await request(app)
      .patch(`/api/chatbots/${chatbotId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre Actualizado' })

    expect(res.status).toBe(200)
    expect(res.body.chatbot.name).toBe('Nombre Actualizado')
  })

  test('delete a chatbot successfully', async () => {
    const res = await request(app)
      .delete(`/api/chatbots/${chatbotId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  test('reject editing chatbot of another user', async () => {
    const otherUser = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'other@example.com', password: 'password123' })

    const res = await request(app)
      .patch(`/api/chatbots/${chatbotId}`)
      .set('Authorization', `Bearer ${otherUser.body.token}`)
      .send({ name: 'Hack' })

    expect(res.status).toBe(404)
  })

})