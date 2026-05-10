import { Router } from 'express'
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationsController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)

router.get('/', getMyNotifications)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)

export default router
