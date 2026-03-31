<template>
  <div class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950">
    <!-- No conversation selected -->
    <div
      v-if="!conv"
      class="flex-1 flex flex-col items-center justify-center gap-4 select-none"
    >
      <div class="relative">
        <div class="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
          <svg class="w-9 h-9 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-accent/20 border-2 border-zinc-50 dark:border-zinc-950 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-brand-accent"></div>
        </div>
      </div>
      <div class="text-center">
        <p class="font-display font-semibold text-zinc-400 dark:text-zinc-600 text-sm">Selecciona una conversación</p>
        <p class="text-xs text-zinc-300 dark:text-zinc-700 mt-1">Los mensajes aparecerán aquí</p>
      </div>
    </div>

    <!-- Conversation view -->
    <template v-else>
      <ConversationHeader :conv="conv" />

      <!-- Messages area -->
      <div
        ref="scrollRef"
        class="flex-1 overflow-y-auto px-3 md:px-5 py-3 md:py-4 space-y-1"
      >
        <!-- Load more older messages -->
        <div v-if="convStore.hasMore" class="flex justify-center pb-2">
          <button
            class="btn-ghost text-xs border border-zinc-200 dark:border-zinc-700"
            :disabled="loadingMore"
            @click="loadOlder"
          >
            <svg v-if="loadingMore" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loadingMore ? 'Cargando...' : 'Mensajes anteriores' }}
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="convStore.loadingMessages" class="space-y-3">
          <div v-for="i in 6" :key="i" class="flex" :class="i % 3 === 0 ? 'justify-end' : 'justify-start'">
            <div
              class="h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              :style="{ width: (40 + Math.random() * 30) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Empty messages -->
        <div
          v-else-if="convStore.messages.length === 0"
          class="flex flex-col items-center justify-center h-40 gap-2"
        >
          <p class="text-sm text-zinc-400 dark:text-zinc-600">Sin mensajes aún</p>
        </div>

        <!-- Message list -->
        <template v-else>
          <template v-for="(msg, idx) in convStore.messages" :key="msg.id">
            <!-- Date separator -->
            <div
              v-if="showDateSeparator(msg, idx)"
              class="flex items-center gap-3 py-2"
            >
              <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
              <span class="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 shrink-0">
                {{ formatDate(msg.createdAt) }}
              </span>
              <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
            </div>

            <MessageBubble :message="msg" />
          </template>
        </template>

        <!-- Scroll anchor -->
        <div ref="bottomRef"></div>
      </div>

      <MessageInput />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useConversationsStore } from '@/stores/conversations.js'
import { formatDate } from '@/utils/userFormatting.js'
import ConversationHeader from './ConversationHeader.vue'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'

const convStore = useConversationsStore()

const scrollRef = ref(null)
const bottomRef = ref(null)
const loadingMore = ref(false)

const conv = computed(() => convStore.activeConversation)

onMounted(() => {
  if (convStore.messages.length > 0) scrollToBottom('instant')
})

function scrollToBottom(behavior = 'smooth') {
  nextTick(() => {
    bottomRef.value?.scrollIntoView({ behavior, block: 'end' })
  })
}

// Scroll to bottom when conversation loads
watch(
  () => convStore.activeConversation?.id,
  () => {
    nextTick(() => scrollToBottom('instant'))
  }
)

// Scroll to bottom when new messages arrive
watch(
  () => convStore.messages.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      if (oldLen === 0) scrollToBottom('instant')
      else if (isNearBottom()) scrollToBottom()
    }
  }
)

function isNearBottom() {
  const el = scrollRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

async function loadOlder() {
  const el = scrollRef.value
  const prevScrollHeight = el?.scrollHeight ?? 0
  loadingMore.value = true
  try {
    await convStore.loadMoreMessages()
    nextTick(() => {
      if (el) {
        el.scrollTop = el.scrollHeight - prevScrollHeight
      }
    })
  } finally {
    loadingMore.value = false
  }
}

function showDateSeparator(msg, idx) {
  if (idx === 0) return true
  const prev = convStore.messages[idx - 1]
  if (!prev?.createdAt || !msg?.createdAt) return false
  const prevDate = new Date(prev.createdAt).toDateString()
  const currDate = new Date(msg.createdAt).toDateString()
  return prevDate !== currDate
}

</script>
