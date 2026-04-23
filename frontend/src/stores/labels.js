import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/axios.js'

export const useLabelsStore = defineStore('labels', () => {
  const labels = ref([])
  const loading = ref(false)

  async function fetchLabels() {
    loading.value = true
    try {
      const res = await api.get('/labels')
      labels.value = res.data.labels ?? []
    } catch (err) {
      console.error('[labels] fetch error:', err.response?.data ?? err.message)
    } finally {
      loading.value = false
    }
  }

  async function createLabel(name, color) {
    const res = await api.post('/labels', { name, color })
    labels.value = [...labels.value, res.data.label].sort((a, b) => a.name.localeCompare(b.name))
    return res.data.label
  }

  async function updateLabel(id, name, color) {
    const res = await api.patch(`/labels/${id}`, { name, color })
    const idx = labels.value.findIndex((l) => l.id === id)
    if (idx !== -1) labels.value[idx] = res.data.label
    labels.value = [...labels.value].sort((a, b) => a.name.localeCompare(b.name))
    return res.data.label
  }

  async function deleteLabel(id) {
    await api.delete(`/labels/${id}`)
    labels.value = labels.value.filter((l) => l.id !== id)
  }

  return { labels, loading, fetchLabels, createLabel, updateLabel, deleteLabel }
})
