<template>
  <!-- Overlay -->
  <Transition name="overlay">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/40 z-40"
      @click="emit('close')"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="panel">
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div class="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">Asistente IA</p>
          <p class="text-xs text-zinc-400 font-mono">Pregunta sobre tus datos</p>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Messages area -->
      <div ref="scrollArea" class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

        <!-- Empty state with suggestion chips -->
        <template v-if="messages.length === 0">
          <div class="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
            <div class="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <svg class="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-1">¿En qué puedo ayudarte?</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500">Haz preguntas sobre tus conversaciones, agentes y clientes</p>
            </div>
            <div class="flex flex-col gap-2 w-full">
              <button
                v-for="chip in suggestions"
                :key="chip"
                @click="sendSuggestion(chip)"
                class="w-full text-left text-xs px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {{ chip }}
              </button>
            </div>
          </div>
        </template>

        <!-- Chat bubbles -->
        <template v-else>
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex flex-col"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <div
              class="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              :class="msg.role === 'user'
                ? 'bg-violet-500 text-white rounded-br-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm'"
            >
              {{ msg.content }}
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="flex justify-start">
            <div class="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex flex-col gap-1.5">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:0ms"/>
                <span class="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:150ms"/>
                <span class="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style="animation-delay:300ms"/>
              </div>
              <p v-if="showColdStartNotice" class="text-xs text-zinc-400 dark:text-zinc-500 max-w-[220px]">
                El servidor IA puede tardar hasta 30 s en arrancar...
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Input -->
      <div class="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
        <div class="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 focus-within:border-violet-400 transition-colors">
          <textarea
            ref="inputRef"
            v-model="inputText"
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResize"
            :disabled="loading"
            rows="1"
            placeholder="Escribe tu pregunta..."
            class="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 resize-none outline-none max-h-32 leading-relaxed disabled:opacity-50"
          />
          <button
            @click="sendMessage"
            :disabled="loading || !inputText.trim()"
            class="shrink-0 w-8 h-8 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-zinc-300 dark:text-zinc-600 mt-1.5 text-center font-mono">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import api from '../../api/axios.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const showColdStartNotice = ref(false)
const scrollArea = ref(null)
const inputRef = ref(null)

const suggestions = [
  '¿Cuántas conversaciones hay abiertas ahora mismo?',
  '¿Cuál es el agente con más conversaciones esta semana?',
  '¿Cuántos mensajes con sentimiento negativo hubo hoy?',
  '¿Cuántas conversaciones se cerraron este mes?',
]

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  inputText.value = ''
  await nextTick()
  autoResize()

  messages.value.push({ role: 'user', content: text })
  await scrollToBottom()

  loading.value = true
  showColdStartNotice.value = false
  const coldTimer = setTimeout(() => { showColdStartNotice.value = true }, 8000)

  try {
    const history = messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content, sql: m.sql ?? null }))
    const res = await api.post('/assistant', { message: text, history })
    messages.value.push({ role: 'assistant', content: res.data.answer, sql: res.data.sql ?? null })
  } catch (err) {
    const msg = err.response?.data?.error || 'Ocurrió un error. Inténtalo de nuevo.'
    messages.value.push({ role: 'assistant', content: msg })
  } finally {
    clearTimeout(coldTimer)
    loading.value = false
    showColdStartNotice.value = false
    await scrollToBottom()
  }
}

async function sendSuggestion(chip) {
  inputText.value = chip
  await sendMessage()
}

async function scrollToBottom() {
  await nextTick()
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = inputRef.value.scrollHeight + 'px'
}
</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.panel-enter-active, .panel-leave-active { transition: transform 0.25s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); }
</style>
