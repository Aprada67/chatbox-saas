import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

const app = express()

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

// Verificación de salud del servidor
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server Running' })
})

// Rutas
app.use('/api/auth', authRoutes)

// Manejador de errores (debe estar siempre al final)
app.use(errorHandler)

export default app