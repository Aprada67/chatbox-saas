import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Interceptor de response — maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Unexpected error'
    const status = error.response?.status

    // Redirige al login si el servidor devuelve 401 fuera de rutas de auth
    if (status === 401 && !error.config.url.includes('/auth/')) {
      window.location.href = '/login'
    }

    return Promise.reject({ message, status })
  }
)

export default api
