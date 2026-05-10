import api from './axios'

export const createCheckoutApi  = (plan) => api.post('/stripe/checkout', { plan })
export const createPortalApi    = ()     => api.post('/stripe/portal')
export const syncPlanApi        = ()     => api.get('/stripe/sync')
export const preCheckoutApi     = (plan) => api.post('/stripe/pre-checkout', { plan })
export const upgradePreviewApi  = (plan) => api.get(`/stripe/upgrade-preview?plan=${plan}`)
