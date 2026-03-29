<template>
  <div class="flex items-center justify-between px-5 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
    <!-- Contact info -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
        {{ nameInitial }}
      </div>
      <div>
        <!-- Nombre en modo edición -->
        <div v-if="editingName" class="flex items-center gap-1">
          <input
            ref="nameInputRef"
            v-model="editNameValue"
            type="text"
            class="text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded px-1.5 py-0.5 outline-none border border-brand-accent w-44"
            placeholder="Nombre del contacto"
            :disabled="savingName"
            @keydown="handleNameKeydown"
            @blur="saveName"
          />
          <button @click="cancelEditName" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" title="Cancelar">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Nombre en modo lectura -->
        <div v-else class="flex items-center gap-1 group/name">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
            {{ displayName }}
          </h3>
          <button
            class="opacity-0 group-hover/name:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title="Editar nombre"
            @click="startEditName"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        <p class="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
          {{ conv.customerPhone }}
        </p>
      </div>
      <span class="status-badge text-[10px]" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- Assign dropdown (todos los roles) -->
      <div class="relative" ref="assignDropdownRef">
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
              <!-- Desasignar: solo si está asignada al usuario actual -->
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

      <!-- Status dropdown -->
      <div class="relative" ref="statusDropdownRef">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useConversationsStore } from '@/stores/conversations.js'
import api from '@/api/axios.js'

const props = defineProps({
  conv: {
    type: Object,
    required: true,
  },
})

const authStore = useAuthStore()
const convStore = useConversationsStore()

const actionLoading = ref(false)
const showAssignDropdown = ref(false)
const showStatusDropdown = ref(false)
const users = ref([])
const loadingUsers = ref(false)
const assignDropdownRef = ref(null)
const statusDropdownRef = ref(null)

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

async function unassign() {
  actionLoading.value = true
  showAssignDropdown.value = false
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
  showAssignDropdown.value = !showAssignDropdown.value
  if (showAssignDropdown.value && users.value.length === 0) {
    if (authStore.isAgent) {
      // AGENT: solo se ve a sí mismo
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
}

function toggleStatusDropdown() {
  showAssignDropdown.value = false
  showStatusDropdown.value = !showStatusDropdown.value
}

function handleClickOutside(e) {
  if (assignDropdownRef.value && !assignDropdownRef.value.contains(e.target)) {
    showAssignDropdown.value = false
  }
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(e.target)) {
    showStatusDropdown.value = false
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
