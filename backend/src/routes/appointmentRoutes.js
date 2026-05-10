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

const router = Router()

// Rutas públicas - No requieren token
router.get('/available/:chatbotId', getAvailableSlots)
router.get('/guest', getGuestAppointments)
router.post('/', optionalAuth, createAppointment)
router.patch('/:id/cancel-guest', cancelGuestAppointment)

// Rutas protegidas - Requieren token
router.use(protect)
router.use(checkTrial)
router.get('/my', getMyAppointments)
router.get('/chatbot/:chatbotId', getChatbotAppointments)
router.get('/stats/:chatbotId', getAppointmentStats)
router.patch('/:id/cancel', cancelAppointment)

export default router