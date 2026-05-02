import request from 'supertest'
import app from '../app.js'

let token
let chatbotId

beforeEach(async () => {
  const user = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'test@example.com', password: 'password123' })
  token = user.body.token

  const chatbot = await request(app)
    .post('/api/chatbots')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Bot',
      welcomeMessage: 'Hola',
      services: [{ name: 'Corte', price: 15, durationMins: 30 }],
      steps: [{ order: 1, question: '¿Servicio?', type: 'service' }]
    })
  chatbotId = chatbot.body.chatbot.id

  await request(app)
    .post(`/api/availability/${chatbotId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
      ]
    })
})

const futureDate = '2027-01-05T10:00:00.000Z'

describe('Citas — Crear', () => {

  test('agenda una cita correctamente', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({
        chatbotId,
        guestName: 'Carlos Pérez',
        guestEmail: 'carlos@email.com',
        service: 'Corte',
        price: 15,
        durationMins: 30,
        date: futureDate,
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.appointment.status).toBe('confirmed')
  })

  test('rechaza cita en el pasado', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({
        chatbotId,
        guestName: 'Carlos',
        service: 'Corte',
        price: 15,
        durationMins: 30,
        date: '2020-01-01T10:00:00.000Z',
      })

    expect(res.status).toBe(400)
  })

  test('rechaza cita duplicada en el mismo horario', async () => {
    const body = {
      chatbotId,
      guestName: 'Carlos',
      service: 'Corte',
      price: 15,
      durationMins: 30,
      date: futureDate,
    }

    await request(app).post('/api/appointments').send(body)

    const res = await request(app)
      .post('/api/appointments')
      .send(body)

    expect(res.status).toBe(409)
  })

  test('rechaza campos obligatorios faltantes', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ chatbotId, guestName: 'Carlos' })

    expect(res.status).toBe(400)
  })

})

describe('Citas — Cancelar', () => {

  test('cancela una cita correctamente', async () => {
    const create = await request(app)
      .post('/api/appointments')
      .send({
        chatbotId,
        guestName: 'Carlos',
        guestEmail: 'carlos@email.com',
        service: 'Corte',
        price: 15,
        durationMins: 30,
        date: futureDate,
      })

    const res = await request(app)
      .patch(`/api/appointments/${create.body.appointment.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.appointment.status).toBe('cancelled')
  })

  test('rechaza cancelar una cita ya cancelada', async () => {
    const create = await request(app)
      .post('/api/appointments')
      .send({
        chatbotId,
        guestName: 'Carlos',
        service: 'Corte',
        price: 15,
        durationMins: 30,
        date: futureDate,
      })

    await request(app)
      .patch(`/api/appointments/${create.body.appointment.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    const res = await request(app)
      .patch(`/api/appointments/${create.body.appointment.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

})