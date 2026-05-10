import { Router } from 'express'
import {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getChatbotAppointments,
  cancelAppointment,
  getGuestAppointments,
  cancelGuestAppointment,
  getAppointmentStats,
} from '../controllers/appointmentController.js'
import { protect, optionalAuth } from '../middlewares/auth.js'
import { checkTrial } from '../middlewares/checkTrial.js'
import { appointmentLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

// Rutas públicas - No requieren token
// GET endpoints sin rate limit estricto (lecturas inocuas, 14 peticiones paralelas en el picker)
router.get('/available/:chatbotId', getAvailableSlots)
router.get('/guest', getGuestAppointments)
// Escrituras sí llevan rate limit
router.post('/', appointmentLimiter, optionalAuth, createAppointment)
router.patch('/:id/cancel-guest', appointmentLimiter, cancelGuestAppointment)

// Rutas protegidas - Requieren token
router.use(protect)
router.use(checkTrial)
router.get('/my', getMyAppointments)
router.get('/chatbot/:chatbotId', getChatbotAppointments)
router.get('/stats/:chatbotId', getAppointmentStats)
router.patch('/:id/cancel', cancelAppointment)

export default router