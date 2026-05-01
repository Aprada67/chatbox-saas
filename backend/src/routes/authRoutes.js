import { Router } from 'express'
import { registerUser, login, getMe } from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas de autenticación
router.post('/register', registerUser)
router.post('/login', login)
router.get('/me', protect, getMe)

export default router