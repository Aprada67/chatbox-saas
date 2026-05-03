import { Router } from 'express'
import { registerUser, login, getMe, changePassword } from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas de autenticación
router.post('/register', registerUser)
router.post('/login', login)
router.get('/me', protect, getMe)
router.post('/change-password', protect, changePassword)

export default router