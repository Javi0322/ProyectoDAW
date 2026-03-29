<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-brand-primary md:pl-14 pb-14 md:pb-0">
    <AppNavbar />

    <main class="max-w-6xl w-full mx-auto px-4 md:px-6 py-8">
      <!-- Page header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-8">
        <div>
          <h1 class="font-display font-bold text-2xl text-zinc-900 dark:text-zinc-100">
            Gestión de usuarios
          </h1>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {{ users.length }} usuario{{ users.length !== 1 ? 's' : '' }} en total
          </p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      <!-- Error banner -->
      <Transition name="fade">
        <div
          v-if="fetchError"
          class="mb-4 flex items-start gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
        >
          <svg class="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-600 dark:text-red-400">{{ fetchError }}</p>
        </div>
      </Transition>

      <!-- Success toast -->
      <Transition name="fade">
        <div
          v-if="successMsg"
          class="mb-4 flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50"
        >
          <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-emerald-600 dark:text-emerald-400">{{ successMsg }}</p>
        </div>
      </Transition>

      <UserTable
        :users="users"
        :loading="loading"
        :deactivating-id="deactivatingId"
        @edit="openEdit"
        @deactivate="handleDeactivate"
      />
    </main>

    <UserFormModal
      :visible="modalVisible"
      :user="editingUser"
      @close="modalVisible = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import UserTable from '@/components/users/UserTable.vue'
import UserFormModal from '@/components/users/UserFormModal.vue'
import api from '@/api/axios.js'

const users = ref([])
const loading = ref(false)
const fetchError = ref('')
const successMsg = ref('')
const modalVisible = ref(false)
const editingUser = ref(null)
const deactivatingId = ref(null)

async function fetchUsers() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await api.get('/users')
    users.value = res.data.users ?? []
  } catch (err) {
    fetchError.value = err.response?.data?.error ?? 'Error al cargar usuarios'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingUser.value = null
  modalVisible.value = true
}

function openEdit(user) {
  editingUser.value = user
  modalVisible.value = true
}

async function handleDeactivate(user) {
  if (!confirm(`¿Desactivar a ${user.firstName} ${user.lastName}?`)) return
  deactivatingId.value = user.id
  try {
    await api.delete(`/users/${user.id}`)
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], active: false }
    showSuccess('Usuario desactivado')
  } catch (err) {
    fetchError.value = err.response?.data?.error ?? 'Error al desactivar'
  } finally {
    deactivatingId.value = null
  }
}

function onSaved(savedUser) {
  const idx = users.value.findIndex((u) => u.id === savedUser.id)
  if (idx !== -1) {
    users.value[idx] = savedUser
  } else {
    users.value = [savedUser, ...users.value]
  }
  showSuccess(editingUser.value ? 'Usuario actualizado' : 'Usuario creado')
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

onMounted(fetchUsers)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
