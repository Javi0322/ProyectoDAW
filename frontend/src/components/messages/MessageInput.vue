<template>
  <div class="px-3 md:px-4 py-2 md:py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
    <div
      class="flex items-end gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border transition-all duration-150"
      :class="isFocused
        ? 'border-brand-accent/50 shadow-[0_0_0_3px_rgba(99,226,185,0.15)]'
        : 'border-zinc-200 dark:border-zinc-700'"
    >
      <textarea
        ref="textareaRef"
        v-model="text"
        class="flex-1 bg-transparent resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-3.5 py-3 max-h-40 outline-none leading-relaxed"
        placeholder="Escribe un mensaje..."
        rows="1"
        :disabled="!canSend || sending"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @input="autoResize"
      ></textarea>
      <button
        class="mb-2 mr-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
        :class="
          canSend && text.trim()
            ? 'bg-brand-accent text-brand-primary hover:bg-brand-accent/90 active:scale-95'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
        "
        :disabled="!canSend || !text.trim() || sending"
        @click="handleSend"
        title="Enviar (Enter)"
      >
        <svg v-if="!sending" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </button>
    </div>
    <p v-if="!canSend" class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 px-1">
      {{ disabledReason }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useConversationsStore } from '@/stores/conversations.js'

const authStore = useAuthStore()
const convStore = useConversationsStore()

const text = ref('')
const sending = ref(false)
const isFocused = ref(false)
const textareaRef = ref(null)

const conv = computed(() => convStore.activeConversation)

const canSend = computed(() => {
  if (!conv.value) return false
  if (authStore.isAdmin || authStore.isSupervisor) return true
  // Agent: only if assigned to them
  return conv.value.assignedTo?.id === authStore.user?.id
})

const disabledReason = computed(() => {
  if (!conv.value) return 'Selecciona una conversación'
  if (!canSend.value) return 'Solo puedes responder si la conversación está asignada a ti'
  return ''
})

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

async function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed || !canSend.value || sending.value) return

  sending.value = true
  const savedText = trimmed
  text.value = ''
  await nextTick()
  autoResize()

  try {
    const msg = await convStore.sendMessage(conv.value.id, savedText)
    if (msg) convStore.appendMessage(msg)
  } catch (err) {
    console.error('Error sending message:', err.message ?? err)
    text.value = savedText
    await nextTick()
    autoResize()
  } finally {
    sending.value = false
    await nextTick()
    textareaRef.value?.focus()
  }
}
</script>
