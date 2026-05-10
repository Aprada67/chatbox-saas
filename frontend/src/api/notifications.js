import api from './axios'

export const getNotificationsApi = () => api.get('/notifications')
export const markAsReadApi = (id) => api.patch(`/notifications/${id}/read`)
export const markAllAsReadApi = () => api.patch('/notifications/read-all')
