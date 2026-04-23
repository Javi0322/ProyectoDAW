<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:pl-14 pb-14 md:pb-0">
    <AppNavbar />

    <main class="max-w-4xl w-full mx-auto px-4 md:px-6 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z" />
            </svg>
            <h1 class="text-2xl font-black tracking-tight text-zinc-900 dark:text-white" style="font-family: 'DM Sans', 'Sora', sans-serif;">
              Etiquetas
            </h1>
          </div>
          <p class="text-sm text-zinc-400 dark:text-zinc-500 font-mono">Gestión del catálogo de etiquetas</p>
        </div>
        <button class="btn-primary text-sm shrink-0" @click="openCreate">
          + Nueva etiqueta
        </button>
      </div>

      <!-- Skeleton -->
      <div v-if="labelsStore.loading && labelsStore.labels.length === 0" class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="labelsStore.labels.length === 0"
        class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm p-12 text-center"
      >
        <p class="text-zinc-400 dark:text-zinc-500 text-sm">No hay etiquetas creadas aún.</p>
      </div>

      <!-- Tabla -->
      <div v-else class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-zinc-100 dark:border-zinc-800">
              <th class="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono w-12">Color</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Nombre</th>
              <th class="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="label in labelsStore.labels"
              :key="label.id"
              class="border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <td class="px-5 py-3.5">
                <span class="w-5 h-5 rounded-full inline-block" :style="{ backgroundColor: label.color }" />
              </td>
              <td class="px-5 py-3.5 font-medium text-zinc-800 dark:text-zinc-200">{{ label.name }}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    @click="openEdit(label)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                    @click="confirmDelete(label)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <LabelFormModal
      v-if="showModal"
      :label="editingLabel"
      @close="showModal = false"
      @saved="showModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import LabelFormModal from '@/components/labels/LabelFormModal.vue'
import { useLabelsStore } from '@/stores/labels.js'

const labelsStore = useLabelsStore()
const showModal = ref(false)
const editingLabel = ref(null)

function openCreate() {
  editingLabel.value = null
  showModal.value = true
}

function openEdit(label) {
  editingLabel.value = label
  showModal.value = true
}

async function confirmDelete(label) {
  if (!confirm(`¿Eliminar la etiqueta "${label.name}"? Se quitará de todas las conversaciones.`)) return
  await labelsStore.deleteLabel(label.id)
}

onMounted(() => labelsStore.fetchLabels())
</script>
