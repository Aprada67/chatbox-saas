import { Router } from 'express'
import {
  registerUser,
  login,
  getMe,
  changePassword,
  updatePreferences,
  forgotPassword,
  resetPassword,
  verifyCode,
  resendVerification,
  deleteAccount,
} from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas de autenticación
router.post('/register', registerUser)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/verify-code', verifyCode)
router.post('/resend-verification', resendVerification)
router.get('/me', protect, getMe)
router.post('/change-password', protect, changePassword)
router.patch('/preferences', protect, updatePreferences)
router.delete('/account', protect, deleteAccount)

export default router
