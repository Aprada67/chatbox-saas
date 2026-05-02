import { Router } from 'express'
import {
  getStats,
  getAllUsers,
  getUserById,
  updateUserPlan,
  toggleUserStatus,
  getAllChatbots,
  adminUpdateChatbot,
} from '../controllers/adminController.js'
import { protect } from '../middlewares/auth.js'
import { restrictTo } from '../middlewares/auth.js'

const router = Router()

// Todas las rutas del admin requieren token y rol admin
router.use(protect)
router.use(restrictTo('admin'))

router.get('/stats', getStats)
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/plan', updateUserPlan)
router.patch('/users/:id/toggle', toggleUserStatus)
router.get('/chatbots', getAllChatbots)
router.patch('/chatbots/:id', adminUpdateChatbot)

export default router