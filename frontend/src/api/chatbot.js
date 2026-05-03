import api from './axios'

export const getMyChatbotsApi = () => api.get('/chatbots')
export const getChatbotApi = (id) => api.get(`/chatbots/${id}`)
export const getPublicChatbotApi = (slug) => api.get(`/chatbots/public/${slug}`)
export const createChatbotApi = (data) => api.post('/chatbots', data)
export const updateChatbotApi = (id, data) => api.patch(`/chatbots/${id}`, data)
export const deleteChatbotApi = (id) => api.delete(`/chatbots/${id}`)