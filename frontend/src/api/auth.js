import api from './axios'

export const registerApi = (data) =>
  api.post('/auth/register', data)

export const loginApi = (data) =>
  api.post('/auth/login', data)

export const getMeApi = () =>
  api.get('/auth/me')

export const forgotPasswordApi = (email) =>
  api.post('/auth/forgot-password', { email })

export const resetPasswordApi = ({ email, code, password }) =>
  api.post('/auth/reset-password', { email, code, password })

export const resendVerificationApi = (email) =>
  api.post('/auth/resend-verification', { email })

export const verifyCodeApi = ({ email, code }) =>
  api.post('/auth/verify-code', { email, code })
