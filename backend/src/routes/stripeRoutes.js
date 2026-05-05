import { Router } from 'express'
import { createCheckout, createPortal, syncPlan } from '../controllers/stripeController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)
router.post('/checkout', createCheckout)
router.post('/portal', createPortal)
router.get('/sync', syncPlan)

export default router