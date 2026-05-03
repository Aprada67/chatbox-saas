import api from './axios'

export const getAvailableSlotsApi = (chatbotId, date, durationMins) =>
  api.get(`/appointments/available/${chatbotId}`, { params: { date, durationMins } })

export const createAppointmentApi = (data) => api.post('/appointments', data)
export const getMyAppointmentsApi = () => api.get('/appointments/my')
export const getChatbotAppointmentsApi = (id) => api.get(`/appointments/chatbot/${id}`)
export const cancelAppointmentApi = (id) => api.patch(`/appointments/${id}/cancel`)

// Public endpoints for guest self-service cancellation
export const getGuestAppointmentsApi = (chatbotId, email) =>
  api.get('/appointments/guest', { params: { chatbotId, email } })

export const cancelGuestAppointmentApi = (id, guestEmail) =>
  api.patch(`/appointments/${id}/cancel-guest`, { guestEmail })