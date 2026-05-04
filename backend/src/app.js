import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import availabilityRoutes from './routes/availabilityRoutes.js'
import { globalLimiter, authLimiter, appointmentLimiter } from './middlewares/rateLimiter.js'
import adminRoutes from './routes/adminRoutes.js'
import { startScheduler } from './services/scheduler.js'

const app = express()
startScheduler()

// Middleware de seguridad HTTPS (Proteje de ataques comunes, ej: Clickjacking, XSS, etc.)
app.use(helmet())
// CORS (Permite que el frontend (5173) en Vite se comunique con el backend(3000))
app.use(cors({
    // Puerto de Vite (React)
    origin: 'http://localhost:5173',
    credentials: true
}))
// Logger (Muestra las peticiones en consola)
app.use(morgan('dev'))
// Body parsers (Permite recibir JSON y datos de formularios)
app.use(express.json())
// Para recibir datos de formularios (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }))
// Limita todas las rutas a 100 peticiones por IP cada 15 minutos
app.use(globalLimiter)

// Verificación de salud del servidor
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server Running' })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/chatbots', chatbotRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/chatbots', chatbotRoutes)
app.use('/api/appointments', appointmentLimiter, appointmentRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/admin', adminRoutes)

// Manejador de errores (debe estar siempre al final)
app.use(errorHandler)

export default app