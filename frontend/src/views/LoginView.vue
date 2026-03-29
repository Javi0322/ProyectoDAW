<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

// Agrupamos los campos del formulario en un objeto reactivo
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    router.push('/')
  } catch (err) {
    // Mostramos el error del servidor o un mensaje genérico
    error.value = err.response?.data?.error || 'Credenciales incorrectas. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-brand-primary">
    <div class="w-full max-w-sm px-6">

      <div class="text-center mb-8">
        <img src='/logo.jpg' class="w-24 h-24 rounded-2xl object-cover mx-auto mb-8">
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-zinc-100">PowerChat</h1>
        <p class="text-base text-zinc-500 dark:text-zinc-400 mt-1">Bandeja de entrada multiagente</p>
      </div>

      <!-- Tarjeta del formulario -->
      <div class="card p-8">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Iniciar sesión</h2>

        <!-- Formulario de login -->
        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">

          <!-- Campo email -->
          <div>
            <label for="email" class="label-text">Correo electrónico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="usuario@empresa.com"
              :disabled="loading"
              class="input-field"
            />
          </div>

          <!-- Campo contraseña -->
          <div>
            <label for="password" class="label-text">Contraseña</label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                :disabled="loading"
                class="input-field pr-10"
              />
              <!-- Botón para mostrar/ocultar contraseña -->
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Mensaje de error si el login falla -->
          <div v-if="error" class="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <svg class="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <!-- Botón de submit -->
          <button type="submit" :disabled="loading" class="btn-primary w-full py-3">
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
          </button>

        </form>
      </div>

      <p class="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">PowerChat — v0.1</p>
    </div>
  </div>
</template>
