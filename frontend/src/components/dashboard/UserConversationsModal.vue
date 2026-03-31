<template>
  <!-- Overlay -->
  <Transition name="overlay">
    <div
      v-if="user"
      class="fixed inset-0 bg-black/40 z-40"
      @click="emit('close')"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="panel">
    <div
      v-if="user"
      class="fixed top-0 right-0 h-full w-full md:w-[420px] bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col"
    >
      <!-- Cabecera -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <!-- Avatar -->
        <div
          class="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          :style="!user.avatarUrl ? `background:${colorFromId(user.userId)}` : ''"
        >
          <img v-if="user.avatarUrl" :src="user.avatarUrl" class="w-full h-full object-cover" />
          <span v-else class="text-xs font-bold text-white">{{ initials(user) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-zinc-800 dark:text-zinc-100 truncate text-sm">{{ userName(user) }}</p>
          <p class="text-xs text-zinc-400 font-mono">{{ user.role }}</p>
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

      <!-- Subtítulo período -->
      <div class="px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <p class="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          Conversaciones con actividad del {{ isoToDisplay(from) }} al {{ isoToDisplay(to) }}
        </p>
      </div>

      <!-- Contenido -->
      <div class="flex-1 overflow-y-auto">
        <!-- Spinner -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <span class="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"/>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="px-5 py-8 text-center text-sm text-red-500">{{ error }}</div>

        <!-- Vacío -->
        <div v-else-if="conversations.length === 0" class="px-5 py-12 text-center">
          <p class="text-sm text-zinc-400 dark:text-zinc-500">
            Este usuario no ha enviado mensajes<br>en el período seleccionado
          </p>
        </div>

        <!-- Lista -->
        <ul v-else class="divide-y divide-zinc-50 dark:divide-zinc-800">
          <li
            v-for="conv in conversations"
            :key="conv.id"
            class="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm text-zinc-800 dark:text-zinc-100 truncate">
                    {{ contactName(conv) }}
                  </span>
                  <span
                    class="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
                    :class="[statusClass(conv.status).bg, statusClass(conv.status).text]"
                  >
                    {{ conv.status }}
                  </span>
                </div>
                <p v-if="conv.lastMessageText" class="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  {{ conv.lastMessageText }}
                </p>
                <p class="text-xs text-zinc-300 dark:text-zinc-600 mt-1">{{ formatDate(conv.lastMessageAt) }}</p>
              </div>
              <button
                @click="openConversation(conv)"
                class="shrink-0 text-xs font-semibold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 font-mono whitespace-nowrap transition-colors"
              >
                Abrir →
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/axios.js'
import { useConversationsStore } from '../../stores/conversations.js'
import { colorFromId, initials, userName, formatDate, isoToDisplay } from '../../utils/userFormatting.js'

const props = defineProps({
  user: { default: null },
  from: String,
  to: String,
})
const emit = defineEmits(['close'])

const router = useRouter()
const convStore = useConversationsStore()

const conversations = ref([])
const loading = ref(false)
const error = ref(null)

watch(() => props.user, async (u) => {
  if (!u || !Number.isInteger(u.userId) || u.userId <= 0) {
    conversations.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/stats/users/${u.userId}/conversations`, {
      params: { from: props.from, to: props.to },
    })
    conversations.value = res.data.conversations ?? []
  } catch (e) {
    error.value = 'Error al cargar las conversaciones'
  } finally {
    loading.value = false
  }
})

async function openConversation(conv) {
  await convStore.selectConversation(conv.id)
  emit('close')
  router.push('/')
}

function contactName(conv) {
  return conv.contactName || conv.customerPhone || 'Sin nombre'
}

const STATUS_COLORS = {
  OPEN:    { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
  PENDING: { bg: 'bg-orange-100 dark:bg-orange-950/40',  text: 'text-orange-700 dark:text-orange-400' },
  CLOSED:  { bg: 'bg-zinc-100 dark:bg-zinc-800',         text: 'text-zinc-500 dark:text-zinc-400' },
}

function statusClass(status) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.CLOSED
}

</script>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.panel-enter-active, .panel-leave-active { transition: transform 0.25s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); }
</style>
