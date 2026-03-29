import { defineStore, getActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import { disconnectSocket } from '@/socket/index.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isSupervisor = computed(() => user.value?.role === 'SUPERVISOR')
  const isAgent = computed(() => user.value?.role === 'AGENT')

  async function login(email, password) {
    const { default: api } = await import('@/api/axios.js')
    const res = await api.post('/auth/login', { email, password })
    const { accessToken, user: userData } = res.data
    token.value = accessToken
    user.value = userData
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    return userData
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    disconnectSocket()
    // Reset the conversations store without importing its module (avoids circular dependency).
    // getActivePinia gives access to any registered store by id at runtime.
    getActivePinia()?._s.get('conversations')?.$reset()
  }

  async function loadFromStorage() {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) return
    token.value = storedToken
    try {
      await fetchMe()
    } catch {
      logout()
    }
  }

  async function fetchMe() {
    const { default: api } = await import('@/api/axios.js')
    const res = await api.get('/me')
    user.value = res.data.user
    localStorage.setItem('auth_user', JSON.stringify(res.data.user))
  }

  function setAvatarUrl(url) {
    user.value = { ...user.value, avatarUrl: url }
    localStorage.setItem('auth_user', JSON.stringify(user.value))
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isSupervisor,
    isAgent,
    login,
    logout,
    loadFromStorage,
    fetchMe,
    setAvatarUrl,
  }
})
