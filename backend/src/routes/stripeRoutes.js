import { Router } from 'express'
import { createCheckout, createPortal, syncPlan, preCheckout, previewUpgrade } from '../controllers/stripeController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

// Endpoint público — usado en el flujo de registro antes de tener cuenta
router.post('/pre-checkout', preCheckout)

router.use(protect)
router.get('/upgrade-preview', previewUpgrade)
router.post('/checkout', createCheckout)
router.post('/portal', createPortal)
router.get('/sync', syncPlan)

export default router
