import { Router } from 'express'
import { getAvailability, setAvailability } from '../controllers/availabilityController.js'
import { protect } from '../middlewares/auth.js'
import { checkTrial } from '../middlewares/checkTrial.js'

const router = Router()

router.get('/:chatbotId', getAvailability)
router.post('/:chatbotId', protect, checkTrial, setAvailability)

export default router