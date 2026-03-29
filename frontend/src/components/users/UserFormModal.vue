<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-slide-up">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="font-display font-semibold text-zinc-900 dark:text-zinc-100">
              {{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}
            </h2>
            <button class="btn-ghost p-1.5" @click="close">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label-text">Nombre</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  required
                  class="input-field"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label class="label-text">Apellido</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  required
                  class="input-field"
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div>
              <label class="label-text">Correo electrónico</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="input-field"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label class="label-text">
                Contraseña
                <span v-if="isEdit" class="normal-case font-normal text-zinc-400">(dejar vacío para no cambiar)</span>
              </label>
              <input
                v-model="form.password"
                type="password"
                :required="!isEdit"
                class="input-field"
                placeholder="••••••••"
                autocomplete="new-password"
              />
            </div>

            <div>
              <label class="label-text">Rol</label>
              <select v-model="form.role" required class="input-field">
                <option value="" disabled>Selecciona un rol</option>
                <option value="AGENT">AGENT</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <!-- Error -->
            <Transition name="fade">
              <div v-if="error" class="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <svg class="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>
            </Transition>

            <!-- Footer -->
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-secondary" @click="close">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ loading ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear usuario') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '@/api/axios.js'

const props = defineProps({
  visible: Boolean,
  user: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.user)

const form = reactive({ firstName: '', lastName: '', email: '', password: '', role: '' })
const loading = ref(false)
const error = ref('')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      error.value = ''
      if (props.user) {
        form.firstName = props.user.firstName ?? ''
        form.lastName = props.user.lastName ?? ''
        form.email = props.user.email ?? ''
        form.password = ''
        form.role = props.user.role ?? ''
      } else {
        form.firstName = ''
        form.lastName = ''
        form.email = ''
        form.password = ''
        form.role = ''
      }
    }
  }
)

function close() {
  emit('close')
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role }
    if (form.password) payload.password = form.password

    let res
    if (isEdit.value) {
      res = await api.patch(`/users/${props.user.id}`, payload)
    } else {
      res = await api.post('/users', { ...payload, password: form.password })
    }
    emit('saved', res.data.user)
    close()
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Error al guardar el usuario'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
