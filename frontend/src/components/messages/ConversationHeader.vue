<template>
  <div class="flex items-center justify-between px-3 md:px-5 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 gap-2">
    <!-- Contact info -->
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <!-- Back button: mobile only -->
      <button
        class="md:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        @click="convStore.$patch({ activeConversation: null })"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
        {{ nameInitial }}
      </div>
      <div class="min-w-0">
        <!-- Nombre en modo edición -->
        <div v-if="editingName" class="flex items-center gap-1">
          <input
            ref="nameInputRef"
            v-model="editNameValue"
            type="text"
            class="text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded px-1.5 py-0.5 outline-none border border-brand-accent w-32 sm:w-44"
            placeholder="Nombre del contacto"
            :disabled="savingName"
            @keydown="handleNameKeydown"
            @blur="saveName"
          />
          <button @click="cancelEditName" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0" title="Cancelar">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Nombre en modo lectura -->
        <div v-else class="flex items-center gap-1 group/name">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none truncate">
            {{ displayName }}
          </h3>
          <button
            class="opacity-0 group-hover/name:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
            title="Editar nombre"
            @click="startEditName"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        <p class="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
          {{ conv.customerPhone }}
        </p>
      </div>
      <span class="status-badge text-[10px] shrink-0 hidden sm:inline-flex" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 shrink-0">

      <!-- Desktop (lg+): dos dropdowns separados -->
      <div class="hidden lg:block relative" ref="assignDropdownRef">
        <button
          class="btn-secondary text-xs py-1.5"
          @click="toggleAssignDropdown"
          :disabled="actionLoading"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {{ conv.assignedTo ? conv.assignedTo.name : 'Sin asignar' }}
          <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div
            v-if="showAssignDropdown"
            class="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
          >
            <div v-if="loadingUsers" class="px-3 py-3 text-xs text-zinc-400 text-center">
              Cargando...
            </div>
            <template v-else>
              <button
                v-if="conv.assignedTo?.id === authStore.user?.id"
                class="w-full text-left px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                @click="unassign"
              >
                Desasignar
              </button>
              <div class="border-t border-zinc-100 dark:border-zinc-800 my-1" v-if="conv.assignedTo?.id === authStore.user?.id"></div>
              <button
                v-for="u in users"
                :key="u.id"
                class="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                :class="{ 'text-brand-accent': conv.assignedTo?.id === u.id }"
                :disabled="conv.assignedTo?.id === u.id"
                @click="assignTo(u.id)"
              >
                <img
                  v-if="u.avatarUrl"
                  :src="u.avatarUrl"
                  class="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <div
                  v-else
                  class="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0"
                >
                  <span class="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                    {{ u.name?.charAt(0).toUpperCase() ?? '?' }}
                  </span>
                </div>
                <span class="truncate">{{ u.name }}</span>
                <span v-if="conv.assignedTo?.id === u.id" class="ml-auto text-brand-accent">✓</span>
              </button>
            </template>
          </div>
        </Transition>
      </div>

      <div class="hidden lg:block relative" ref="statusDropdownRef">
        <button
          class="btn-secondary text-xs py-1.5"
          @click="toggleStatusDropdown"
          :disabled="actionLoading"
        >
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="currentStatusOption.dotClass"></span>
          {{ currentStatusOption.label }}
          <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div
            v-if="showStatusDropdown"
            class="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1"
          >
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              :class="conv.status === opt.value ? 'text-brand-accent' : 'text-zinc-700 dark:text-zinc-300'"
              @click="changeStatus(opt.value)"
            >
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="opt.dotClass"></span>
              {{ opt.label }}
              <span v-if="conv.status === opt.value" class="ml-auto text-brand-accent">✓</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Label dropdown (desktop) -->
      <div class="hidden lg:block relative" ref="labelDropdownRef">
        <button
          class="btn-secondary text-xs py-1.5"
          @click="toggleLabelDropdown"
          :disabled="actionLoading"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z" />
          </svg>
          Etiquetas <span class="text-zinc-400">({{ selectedLabelIds.length }}/5)</span>
          <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div
            v-if="showLabelDropdown"
            class="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
          >
            <div v-if="labelsStore.labels.length === 0" class="px-3 py-3 text-xs text-zinc-400 text-center">
              Sin etiquetas creadas
            </div>
            <button
              v-for="label in labelsStore.labels"
              :key="label.id"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="selectedLabelIds.includes(label.id) ? 'text-brand-accent' : 'text-zinc-700 dark:text-zinc-300'"
              :disabled="!selectedLabelIds.includes(label.id) && selectedLabelIds.length >= 5"
              @click="toggleLabel(label)"
            >
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: label.color }" />
              <span class="truncate flex-1">{{ label.name }}</span>
              <span v-if="selectedLabelIds.includes(label.id)" class="ml-auto text-brand-accent">✓</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Móvil/Tablet (<lg): botón hamburguesa con menú combinado -->
      <div class="lg:hidden relative" ref="mobileMenuRef">
        <button
          class="btn-secondary text-xs py-1.5 px-2"
          @click="toggleMobileMenu"
          :disabled="actionLoading"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div
            v-if="showMobileMenu"
            class="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
          >
            <!-- Sección asignar -->
            <div class="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Asignar a
            </div>
            <div v-if="loadingUsers" class="px-3 py-2 text-xs text-zinc-400 text-center">
              Cargando...
            </div>
            <template v-else>
              <button
                v-if="conv.assignedTo?.id === authStore.user?.id"
                class="w-full text-left px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                @click="unassign"
              >
                Desasignar
              </button>
              <div class="border-t border-zinc-100 dark:border-zinc-800 my-0.5" v-if="conv.assignedTo?.id === authStore.user?.id"></div>
              <button
                v-for="u in users"
                :key="u.id"
                class="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                :class="{ 'text-brand-accent': conv.assignedTo?.id === u.id }"
                :disabled="conv.assignedTo?.id === u.id"
                @click="assignTo(u.id)"
              >
                <img
                  v-if="u.avatarUrl"
                  :src="u.avatarUrl"
                  class="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <div
                  v-else
                  class="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0"
                >
                  <span class="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                    {{ u.name?.charAt(0).toUpperCase() ?? '?' }}
                  </span>
                </div>
                <span class="truncate">{{ u.name }}</span>
                <span v-if="conv.assignedTo?.id === u.id" class="ml-auto text-brand-accent">✓</span>
              </button>
            </template>

            <!-- Separador -->
            <div class="border-t border-zinc-200 dark:border-zinc-700 my-1"></div>

            <!-- Sección estado -->
            <div class="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Estado
            </div>
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              :class="conv.status === opt.value ? 'text-brand-accent' : 'text-zinc-700 dark:text-zinc-300'"
              @click="changeStatus(opt.value)"
            >
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="opt.dotClass"></span>
              {{ opt.label }}
              <span v-if="conv.status === opt.value" class="ml-auto text-brand-accent">✓</span>
            </button>

            <!-- Separador -->
            <div class="border-t border-zinc-200 dark:border-zinc-700 my-1"></div>

            <!-- Sección etiquetas -->
            <div class="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Etiquetas ({{ selectedLabelIds.length }}/5)
            </div>
            <div v-if="labelsStore.labels.length === 0" class="px-3 py-2 text-xs text-zinc-400 text-center">
              Sin etiquetas creadas
            </div>
            <button
              v-for="label in labelsStore.labels"
              :key="label.id"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="selectedLabelIds.includes(label.id) ? 'text-brand-accent' : 'text-zinc-700 dark:text-zinc-300'"
              :disabled="!selectedLabelIds.includes(label.id) && selectedLabelIds.length >= 5"
              @click="toggleLabel(label)"
            >
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: label.color }" />
              <span class="truncate flex-1">{{ label.name }}</span>
              <span v-if="selectedLabelIds.includes(label.id)" class="ml-auto text-brand-accent">✓</span>
            </button>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useConversationsStore } from '@/stores/conversations.js'
import { useLabelsStore } from '@/stores/labels.js'
import api from '@/api/axios.js'

const props = defineProps({
  conv: {
    type: Object,
    required: true,
  },
})

const authStore = useAuthStore()
const convStore = useConversationsStore()
const labelsStore = useLabelsStore()

const actionLoading = ref(false)
const showAssignDropdown = ref(false)
const showStatusDropdown = ref(false)
const showLabelDropdown = ref(false)
const showMobileMenu = ref(false)
const users = ref([])
const loadingUsers = ref(false)
const assignDropdownRef = ref(null)
const statusDropdownRef = ref(null)
const labelDropdownRef = ref(null)
const mobileMenuRef = ref(null)

const selectedLabelIds = computed(() =>
  (props.conv.labels ?? []).map((cl) => cl.label.id)
)

const displayName = computed(() => {
  return props.conv.contactName || props.conv.customerPhone || props.conv.externalId || 'Desconocido'
})

const editingName = ref(false)
const editNameValue = ref('')
const savingName = ref(false)
const nameInputRef = ref(null)

function startEditName() {
  editNameValue.value = props.conv.contactName || ''
  editingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function cancelEditName() {
  editingName.value = false
}

async function saveName() {
  if (savingName.value) return
  savingName.value = true
  try {
    const res = await api.patch(`/conversations/${props.conv.id}/contact`, { name: editNameValue.value.trim() })
    convStore.updateConversationInList(res.data.conversation)
    editingName.value = false
  } catch (err) {
    console.error('Error saving contact name:', err)
  } finally {
    savingName.value = false
  }
}

function handleNameKeydown(e) {
  if (e.key === 'Enter') saveName()
  if (e.key === 'Escape') cancelEditName()
}

const nameInitial = computed(() => displayName.value.charAt(0).toUpperCase())

const statusOptions = [
  { value: 'OPEN', label: 'Abierta', dotClass: 'bg-emerald-500' },
  { value: 'PENDING', label: 'Pendiente', dotClass: 'bg-amber-500' },
  { value: 'CLOSED', label: 'Cerrada', dotClass: 'bg-zinc-400' },
]

const currentStatusOption = computed(() =>
  statusOptions.find((o) => o.value === props.conv.status) ?? statusOptions[0]
)

const statusClass = computed(() => {
  switch (props.conv.status) {
    case 'OPEN':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'CLOSED':
      return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
    default:
      return ''
  }
})

const statusLabel = computed(() => {
  const map = { OPEN: 'Abierta', PENDING: 'Pendiente', CLOSED: 'Cerrada' }
  return map[props.conv.status] ?? props.conv.status
})

async function loadUsers() {
  if (users.value.length > 0) return
  if (authStore.isAgent) {
    const u = authStore.user
    users.value = [{ ...u, name: `${u.firstName} ${u.lastName}` }]
  } else {
    loadingUsers.value = true
    try {
      const res = await api.get('/users')
      users.value = (res.data.users ?? [])
        .filter((u) => u.active !== false)
        .map((u) => ({ ...u, name: `${u.firstName} ${u.lastName}` }))
    } catch {
      users.value = []
    } finally {
      loadingUsers.value = false
    }
  }
}

async function unassign() {
  actionLoading.value = true
  showAssignDropdown.value = false
  showMobileMenu.value = false
  try {
    await api.post(`/conversations/${props.conv.id}/unassign`)
  } catch (err) {
    console.error('Error unassigning:', err)
  } finally {
    actionLoading.value = false
  }
}

async function assignTo(userId) {
  if (props.conv.assignedTo?.id === userId) return
  showAssignDropdown.value = false
  showMobileMenu.value = false
  actionLoading.value = true
  try {
    if (authStore.isAgent) {
      await api.post(`/conversations/${props.conv.id}/assign-to-me`)
    } else {
      await api.post(`/conversations/${props.conv.id}/assign`, { userId })
    }
  } catch (err) {
    console.error('Error assigning:', err)
  } finally {
    actionLoading.value = false
  }
}

async function changeStatus(status) {
  showStatusDropdown.value = false
  showMobileMenu.value = false
  actionLoading.value = true
  try {
    const res = await api.patch(`/conversations/${props.conv.id}/status`, { status })
    convStore.updateConversationInList(res.data.conversation)
  } catch (err) {
    console.error('Error changing status:', err)
  } finally {
    actionLoading.value = false
  }
}

async function toggleAssignDropdown() {
  showStatusDropdown.value = false
  showLabelDropdown.value = false
  showMobileMenu.value = false
  showAssignDropdown.value = !showAssignDropdown.value
  if (showAssignDropdown.value) await loadUsers()
}

function toggleStatusDropdown() {
  showAssignDropdown.value = false
  showLabelDropdown.value = false
  showMobileMenu.value = false
  showStatusDropdown.value = !showStatusDropdown.value
}

async function toggleLabelDropdown() {
  showAssignDropdown.value = false
  showStatusDropdown.value = false
  showMobileMenu.value = false
  if (!showLabelDropdown.value && labelsStore.labels.length === 0) {
    await labelsStore.fetchLabels()
  }
  showLabelDropdown.value = !showLabelDropdown.value
}

async function toggleLabel(label) {
  if (selectedLabelIds.value.includes(label.id)) {
    await convStore.removeLabelFromConversation(props.conv.id, label.id)
  } else {
    if (selectedLabelIds.value.length >= 5) return
    await convStore.addLabelToConversation(props.conv.id, label)
  }
}

async function toggleMobileMenu() {
  showAssignDropdown.value = false
  showStatusDropdown.value = false
  showLabelDropdown.value = false
  showMobileMenu.value = !showMobileMenu.value
  if (showMobileMenu.value) {
    await loadUsers()
    if (labelsStore.labels.length === 0) await labelsStore.fetchLabels()
  }
}

function handleClickOutside(e) {
  if (assignDropdownRef.value && !assignDropdownRef.value.contains(e.target)) {
    showAssignDropdown.value = false
  }
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(e.target)) {
    showStatusDropdown.value = false
  }
  if (labelDropdownRef.value && !labelDropdownRef.value.contains(e.target)) {
    showLabelDropdown.value = false
  }
  if (mobileMenuRef.value && !mobileMenuRef.value.contains(e.target)) {
    showMobileMenu.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
