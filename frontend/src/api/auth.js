import api from './axios'

export const getMeApi = () => api.get('/auth/me')
export const deleteAccountApi = () => api.delete('/auth/account')
export const activateStripeSessionApi = (sessionId) => api.post('/auth/activate-session', { sessionId })
