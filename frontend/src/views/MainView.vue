<template>
  <div class="fixed inset-0 bottom-14 md:bottom-0 md:left-14 flex overflow-hidden bg-zinc-50 dark:bg-brand-primary">
    <AppNavbar />

    <div class="flex-1 flex min-w-0 min-h-0">
      <ConversationList :class="convStore.activeConversation ? 'hidden md:flex' : 'flex'" />
      <MessageThread :class="!convStore.activeConversation ? 'hidden md:flex' : 'flex'" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useConversationsStore, normalizeConversation } from '@/stores/conversations.js'
import { useAuthStore } from '@/stores/auth.js'
import { getSocket } from '@/socket/index.js'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import ConversationList from '@/components/conversations/ConversationList.vue'
import MessageThread from '@/components/messages/MessageThread.vue'

const convStore = useConversationsStore()
const authStore = useAuthStore()

let socket = null
let currentConvId = null

function setupSocket() {
  socket = getSocket()
  if (!socket) return

  socket.on('message:new', ({ message, conversation }) => {
    const conversationId = message?.conversationId ?? conversation?.id
    if (convStore.activeConversation?.id === conversationId) {
      convStore.appendMessage({ ...message, conversationId })
    }
    // Update last message in list
    const conv = convStore.items.find((c) => c.id === conversationId)
    if (conv) {
      conv.lastMessage = message
      if (convStore.activeConversation?.id !== conversationId) {
        conv.isRead = false
      }
    }
  })

  socket.on('message:update', ({ message, conversation }) => {
    const conversationId = message?.conversationId ?? conversation?.id
    if (convStore.activeConversation?.id === conversationId) {
      convStore.updateMessage(message)
    }
  })

  socket.on('conversation:assign', ({ conversation }) => {
    const norm = normalizeConversation(conversation)

    // Siempre actualizar activeConversation si corresponde
    convStore.updateConversationInList(norm)

    // Gestionar visibilidad en la lista según scope
    const userId = authStore.user?.id
    const scope = convStore.filters.scope
    let shouldBeVisible = true
    if (scope === 'mine' && norm.assignedToId !== userId) shouldBeVisible = false
    if (scope === 'unassigned' && norm.assignedToId !== null) shouldBeVisible = false

    const isInList = convStore.items.some((c) => c.id === norm.id)
    if (!shouldBeVisible && isInList) {
      convStore.removeConversationFromList(norm.id)
    } else if (shouldBeVisible && !isInList) {
      convStore.fetchConversations()
    }
  })

  socket.on('conversation:statusUpdate', ({ conversation }) => {
    const statusFilter = convStore.filters.status
    const matchesStatus = !statusFilter || conversation.status === statusFilter

    const isInList = convStore.items.some((c) => c.id === conversation.id)
    if (!matchesStatus && isInList) {
      convStore.removeConversationFromList(conversation.id)
      // Still update activeConversation metadata so the header reflects the change
      convStore.updateConversationInList(conversation)
    } else if (matchesStatus && !isInList) {
      convStore.fetchConversations()
    } else {
      convStore.updateConversationInList(conversation)
    }
  })
}

function joinConversationRoom(id) {
  if (!socket || !id) return
  if (currentConvId && currentConvId !== id) {
    socket.emit('conversation:leave', currentConvId)
  }
  socket.emit('conversation:join', id)
  currentConvId = id
}

// Watch for active conversation changes to join/leave rooms
import { watch } from 'vue'
watch(
  () => convStore.activeConversation?.id,
  (newId) => {
    if (newId) joinConversationRoom(newId)
  }
)

// Set default scope filter based on role
function initFilters() {
  convStore.setFilter('scope', 'all')
}

onMounted(async () => {
  initFilters()
  await convStore.fetchConversations()
  setupSocket()
})

onUnmounted(() => {
  if (socket) {
    if (currentConvId) {
      socket.emit('conversation:leave', currentConvId)
    }
    socket.off('message:new')
    socket.off('message:update')
    socket.off('conversation:assign')
    socket.off('conversation:statusUpdate')
  }
})
</script>
