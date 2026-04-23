<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @mousedown.self="emit('close')">
    <div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-5">
        {{ label ? 'Editar etiqueta' : 'Nueva etiqueta' }}
      </h2>

      <div class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Nombre</label>
          <input
            v-model="name"
            type="text"
            maxlength="40"
            class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-accent/50"
            placeholder="Ej. Urgente"
            @keydown.enter="save"
          />
        </div>

        <!-- Paleta de color -->
        <div>
          <label class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Color</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in PALETTE"
              :key="c"
              type="button"
              class="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
              :class="selectedColor === c ? 'ring-2 ring-offset-2 ring-brand-accent scale-110' : ''"
              :style="{ backgroundColor: c }"
              @click="selectedColor = c"
            />
          </div>
        </div>

        <!-- Preview -->
        <div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: selectedColor }" />
          <span class="truncate">{{ name || 'Nombre de la etiqueta' }}</span>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="mt-3 text-xs text-red-500">{{ error }}</p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 mt-6">
        <button class="btn-secondary text-sm" @click="emit('close')">Cancelar</button>
        <button
          class="btn-primary text-sm"
          :disabled="saving || !name.trim()"
          @click="save"
        >
          {{ saving ? 'Guardando...' : (label ? 'Guardar cambios' : 'Crear') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLabelsStore } from '@/stores/labels.js'

const props = defineProps({
  label: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#6b7280', '#1e293b', '#78350f',
]

const labelsStore = useLabelsStore()
const name = ref('')
const selectedColor = ref(PALETTE[0])
const saving = ref(false)
const error = ref('')

watch(
  () => props.label,
  (val) => {
    name.value = val?.name ?? ''
    selectedColor.value = val?.color ?? PALETTE[0]
    error.value = ''
  },
  { immediate: true }
)

async function save() {
  if (!name.value.trim() || saving.value) return
  saving.value = true
  error.value = ''
  try {
    if (props.label) {
      await labelsStore.updateLabel(props.label.id, name.value.trim(), selectedColor.value)
    } else {
      await labelsStore.createLabel(name.value.trim(), selectedColor.value)
    }
    emit('saved')
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>
