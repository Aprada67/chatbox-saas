export class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
    }
}

export const errorHandler = (err, req, res, next) => {
    let { statusCode = 500, message } = err

    // Errores de Drizzle / PostgreSQL
    if (err.code === '23505') {
        statusCode = 409
        message = 'Conflict: Duplicate entry'
    }
    if (err.code === '23503') {
        statusCode = 400
        message = 'Bad Request - Foreign key violation'
    }

    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR:', err)
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack})
    })
}

export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}