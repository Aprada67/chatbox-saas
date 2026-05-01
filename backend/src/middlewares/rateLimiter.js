import rateLimit from 'express-rate-limit'

// Limita a 100 peticiones por IP cada 15 minutos
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
})

// Limita a 10 intentos de login por IP cada 15 minutos
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    }
})

// Limita a 20 solicitudes de creación de citas por IP cada 15 minutos
export const appointmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many appointment requests from this IP, please try again after 15 minutes'
    }
})