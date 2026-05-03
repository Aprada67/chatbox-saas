import { Router } from 'express'
import {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getChatbotAppointments,
  cancelAppointment,
  getGuestAppointments,
  cancelGuestAppointment,
} from '../controllers/appointmentController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas públicas - No requieren token
router.get('/available/:chatbotId', getAvailableSlots)
router.get('/guest', getGuestAppointments)
router.post('/', createAppointment)
router.patch('/:id/cancel-guest', cancelGuestAppointment)

// Rutas protegidas - Requieren token
router.use(protect)
router.get('/my', getMyAppointments)
router.get('/chatbot/:chatbotId', getChatbotAppointments)
router.patch('/:id/cancel', cancelAppointment)

export default router