import { Router } from 'express'
import {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getChatbotAppointments,
  cancelAppointment,
} from '../controllers/appointmentController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas públicas - No requieren token
router.get('/available/:chatbotId', getAvailableSlots)
router.post('/', createAppointment)

// Rutas protegidas - Requieren token
router.use(protect)
router.get('/my', getMyAppointments)
router.get('/chatbot/:chatbotId', getChatbotAppointments)
router.patch('/:id/cancel', cancelAppointment)

export default router