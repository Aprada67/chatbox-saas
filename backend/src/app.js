import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middlewares/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import chatbotRoutes from './routes/chatbotRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import availabilityRoutes from './routes/availabilityRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import stripeRoutes from './routes/stripeRoutes.js'
import notificationsRoutes from './routes/notificationsRoutes.js'
import { handleWebhook } from './controllers/stripeController.js'
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js'
import { startScheduler } from './services/scheduler.js'

const app = express()
startScheduler()

// Seguridad y logging
app.use(helmet())
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(globalLimiter)

// Stripe webhook ANTES de express.json() — necesita raw body para verificar firma
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// Body parsers — DESPUÉS del webhook
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server Running' })
})

// Rutas
app.use('/api/stripe', stripeRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/chatbots', chatbotRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationsRoutes)

app.use(errorHandler)

export default app