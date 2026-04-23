<template>
  <button
    class="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all duration-150 border-b border-zinc-100 dark:border-zinc-800/80 relative group"
    :class="[
      isActive
        ? 'bg-brand-accent/10 dark:bg-brand-accent/10 border-l-2 border-l-brand-accent'
        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-2 border-l-transparent',
    ]"
    @click="emit('select', conversation.id)"
  >
    <!-- Avatar -->
    <div class="relative shrink-0 mt-0.5">
      <div
        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
        :class="isActive
          ? 'bg-brand-accent text-brand-primary'
          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'"
      >
        {{ phoneInitial }}
      </div>
      <!-- Unread indicator -->
      <span
        v-if="!conversation.isRead"
        class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-accent border-2 border-white dark:border-zinc-900 animate-pulse-dot"
      ></span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2 mb-0.5">
        <span
          class="text-sm font-semibold truncate"
          :class="
            isActive
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-800 dark:text-zinc-200'
          "
        >
          {{ displayName }}
        </span>
        <div class="flex items-center gap-1 shrink-0">
          <span
            v-for="cl in conversation.labels"
            :key="cl.label.id"
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: cl.label.color }"
            :title="cl.label.name"
          />
          <span class="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {{ formattedTime }}
          </span>
        </div>
      </div>

      <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
        <span v-if="lastMsg" class="flex items-center gap-1">
          <span v-if="lastMsg.direction === 'OUT'" class="text-brand-accent/80">→</span>
          {{ lastMsg.text || '(multimedia)' }}
        </span>
        <span v-else class="italic">Sin mensajes aún</span>
      </p>

      <!-- Assigned badge -->
      <div class="mt-1 flex items-center gap-1.5">
        <span
          class="status-badge text-[10px]"
          :class="statusClass"
        >
          {{ statusLabel }}
        </span>
        <span
          v-if="conversation.assignedTo"
          class="text-[10px] text-zinc-400 dark:text-zinc-500 truncate"
        >
          {{ conversation.assignedTo.name }}
        </span>
      </div>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const displayName = computed(() => {
  return props.conversation.contactName || props.conversation.contact?.name || props.conversation.customerPhone || props.conversation.externalId || 'Desconocido'
})

const phoneInitial = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})

const lastMsg = computed(() => props.conversation.lastMessage)

const formattedTime = computed(() => {
  const date = lastMsg.value?.createdAt
    ? new Date(lastMsg.value.createdAt)
    : new Date(props.conversation.updatedAt || props.conversation.createdAt)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('es-ES', { weekday: 'short' })
  } else {
    return `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`
  }
})

const statusClass = computed(() => {
  switch (props.conversation.status) {
    case 'OPEN':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'CLOSED':
      return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
    default:
      return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
  }
})

const statusLabel = computed(() => {
  const map = { OPEN: 'Abierta', PENDING: 'Pendiente', CLOSED: 'Cerrada' }
  return map[props.conversation.status] ?? props.conversation.status
})
</script>
