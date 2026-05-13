import { Router } from 'express'
import { getMe, updatePreferences, deleteAccount, activateStripeSession } from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.get('/me', protect, getMe)
router.patch('/preferences', protect, updatePreferences)
router.delete('/account', protect, deleteAccount)
router.post('/activate-session', protect, activateStripeSession)

export default router
