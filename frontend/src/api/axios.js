import axios from 'axios'
import { getActivePinia } from 'pinia'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      const pinia = getActivePinia()
      if (pinia) {
        const { useAuthStore } = await import('@/stores/auth.js')
        const authStore = useAuthStore(pinia)
        authStore.logout()
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
