import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios.js'

export const useStatsStore = defineStore('stats', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const from = ref('')
  const to = ref('')
  let _pollInterval = null

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      const res = await api.get('/stats', { params: { from: from.value, to: to.value } })
      data.value = res.data.data ?? res.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar estadísticas'
      if (e.response?.status === 403 || e.response?.status === 401) {
        stopPolling()
      }
    } finally {
      loading.value = false
    }
  }

  function setRange(newFrom, newTo) {
    from.value = newFrom
    to.value = newTo
    fetch()
  }

  function startPolling(ms = 60000) {
    fetch()
    _pollInterval = setInterval(fetch, ms)
  }

  function stopPolling() {
    if (_pollInterval) {
      clearInterval(_pollInterval)
      _pollInterval = null
    }
  }

  return { data, loading, error, from, to, fetch, setRange, startPolling, stopPolling }
})
