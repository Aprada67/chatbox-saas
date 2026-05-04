import { Router } from 'express'
import { registerUser, login, getMe, changePassword, updatePreferences } from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas de autenticación
router.post('/register', registerUser)
router.post('/login', login)
router.get('/me', protect, getMe)
router.post('/change-password', protect, changePassword)
router.patch('/preferences', protect, updatePreferences)

export default router