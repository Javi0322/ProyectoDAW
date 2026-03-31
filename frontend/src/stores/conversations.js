import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import api from '@/api/axios.js'

export function normalizeConversation(conv) {
  if (!conv.lastMessage && conv.lastMessageText) {
    conv.lastMessage = { text: conv.lastMessageText, createdAt: conv.lastMessageAt }
  }
  if (conv.assignedTo) {
    conv.assignedTo.name = `${conv.assignedTo.firstName} ${conv.assignedTo.lastName}`
  }
  return conv
}

export const useConversationsStore = defineStore('conversations', () => {
  const items = ref([])
  const total = ref(0)
  const page = ref(0)
  const filters = reactive({ scope: 'mine', status: null })
  const activeConversation = ref(null)
  const messages = ref([])
  const hasMore = ref(false)
  const nextCursor = ref(null)
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)

  async function fetchConversations() {
    loadingConversations.value = true
    try {
      page.value = 1
      const params = { scope: filters.scope, page: 1, pageSize: 20 }
      if (filters.status) params.status = filters.status
      const res = await api.get('/conversations', { params })
      items.value = (res.data.items ?? []).map(normalizeConversation)
      total.value = res.data.total ?? items.value.length
    } catch (err) {
      console.error('[conversations] fetch error:', err.response?.data ?? err.message)
    } finally {
      loadingConversations.value = false
    }
  }

  async function loadMoreConversations() {
    const nextPage = page.value + 1
    const params = { scope: filters.scope, page: nextPage, pageSize: 20 }
    if (filters.status) params.status = filters.status
    const res = await api.get('/conversations', { params })
    const newItems = res.data.items ?? []
    items.value = [...items.value, ...newItems.map(normalizeConversation)]
    page.value = nextPage
  }

  async function selectConversation(id) {
    const res = await api.get(`/conversations/${id}`)
    activeConversation.value = normalizeConversation(res.data.conversation)
    messages.value = []
    nextCursor.value = null
    hasMore.value = false
    await fetchMessages(id)

    try {
      await api.post(`/conversations/${id}/read`)
      const conv = items.value.find((c) => c.id === id)
      if (conv) conv.isRead = true
    } catch {
      // non-critical
    }
  }

  async function fetchMessages(id) {
    loadingMessages.value = true
    try {
      const res = await api.get(`/conversations/${id}/messages`, {
        params: { limit: 50 },
      })
      messages.value = res.data.messages ?? []
      nextCursor.value = res.data.nextCursor ?? null
      hasMore.value = !!nextCursor.value
    } finally {
      loadingMessages.value = false
    }
  }

  async function loadMoreMessages() {
    if (!activeConversation.value || !nextCursor.value) return
    const res = await api.get(`/conversations/${activeConversation.value.id}/messages`, {
      params: { limit: 50, cursor: nextCursor.value },
    })
    const older = res.data.messages ?? []
    messages.value = [...older, ...messages.value]
    nextCursor.value = res.data.nextCursor ?? null
    hasMore.value = !!nextCursor.value
  }

  async function sendMessage(id, text) {
    const res = await api.post(`/conversations/${id}/messages`, { text })
    return res.data.message
  }

  function appendMessage(msg) {
    const exists = messages.value.some((m) => m.id === msg.id)
    if (!exists) {
      messages.value = [...messages.value, msg]
    }

    const conv = items.value.find(
      (c) => c.id === msg.conversationId || c.id === activeConversation.value?.id
    )
    if (conv) {
      conv.lastMessage = msg
    }
  }

  function updateMessage(msg) {
    const idx = messages.value.findIndex((m) => m.id === msg.id)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], ...msg }
    }
  }

  function updateConversationInList(conv) {
    const idx = items.value.findIndex((c) => c.id === conv.id)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], ...conv }
    }
    if (activeConversation.value?.id === conv.id) {
      activeConversation.value = { ...activeConversation.value, ...conv }
    }
  }

  function removeConversationFromList(id) {
    const idx = items.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      items.value.splice(idx, 1)
      total.value = Math.max(0, total.value - 1)
    }
  }

  function setFilter(key, value) {
    filters[key] = value
  }

  return {
    items,
    total,
    page,
    filters,
    activeConversation,
    messages,
    hasMore,
    nextCursor,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    loadMoreConversations,
    selectConversation,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    appendMessage,
    updateMessage,
    updateConversationInList,
    removeConversationFromList,
    setFilter,
  }
})
