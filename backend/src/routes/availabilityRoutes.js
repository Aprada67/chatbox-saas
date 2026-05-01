import { Router } from 'express'
import { getAvailability, setAvailability } from '../controllers/availabilityController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.get('/:chatbotId', getAvailability)
router.post('/:chatbotId', protect, setAvailability)

export default router