<template>
  <div class="flex flex-col gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
    <!-- Scope tabs -->
    <div class="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
      <button
        v-for="opt in scopeOptions"
        :key="opt.value"
        class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150"
        :class="
          filters.scope === opt.value
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
        "
        @click="emit('update:scope', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Status pills -->
    <div class="flex gap-1.5">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        class="flex-1 py-1 text-xs font-medium rounded-md transition-all duration-150"
        :class="
          filters.status === opt.value
            ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30'
            : 'bg-transparent text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
        "
        @click="emit('update:status', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:scope', 'update:status'])

const authStore = useAuthStore()

const scopeOptions = computed(() => [
  { value: 'all', label: 'Todas' },
  { value: 'mine', label: 'Mías' },
  { value: 'unassigned', label: 'Sin asignar' },
])

const statusOptions = [
  { value: null, label: 'Todas' },
  { value: 'OPEN', label: 'Abiertas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CLOSED', label: 'Cerradas' },
]
</script>
