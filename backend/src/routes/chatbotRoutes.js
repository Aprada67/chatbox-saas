import { Router } from 'express'
import {
  getMyChatbots,
  getChatbot,
  getPublicChatbot,
  createChatbot,
  updateChatbot,
  deleteChatbot,
} from '../controllers/chatbotController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Rutas públicas - No requieren token
router.get('/public/:slug', getPublicChatbot)

// Rutas protegidas - Requieren token
router.use(protect)
router.get('/',      getMyChatbots)
router.get('/:id',   getChatbot)
router.post('/',     createChatbot)
router.patch('/:id', updateChatbot)
router.delete('/:id', deleteChatbot)

export default router