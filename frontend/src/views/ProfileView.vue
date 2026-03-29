<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-brand-primary pl-14">
    <AppNavbar />

    <main class="max-w-2xl w-full mx-auto px-6 py-10">
      <h1 class="font-display font-bold text-2xl text-zinc-900 dark:text-zinc-100 mb-8">
        Mi perfil
      </h1>

      <!-- Profile card -->
      <div class="card p-6 mb-6">
        <div class="flex items-start gap-5">
          <!-- Avatar con subida -->
          <div class="shrink-0">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
              class="hidden"
              ref="fileInput"
              @change="onFileChange"
            />
            <button
              type="button"
              class="relative group w-16 h-16 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              :disabled="uploading"
              @click="fileInput.click()"
            >
              <!-- Imagen real o preview -->
              <img
                v-if="previewUrl || safeImageUrl(user?.avatarUrl)"
                :src="previewUrl || safeImageUrl(user?.avatarUrl)"
                class="w-full h-full object-cover"
                alt="Avatar"
              />
              <!-- Fallback iniciales -->
              <div
                v-else
                class="w-full h-full bg-brand-accent/20 flex items-center justify-center"
              >
                <span class="font-display font-bold text-2xl text-brand-accent">{{ userInitial }}</span>
              </div>

              <!-- Overlay hover -->
              <div
                class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                :class="{ 'opacity-100': uploading }"
              >
                <svg v-if="!uploading" class="w-5 h-5 text-white mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else class="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span class="text-white text-[10px] font-medium mt-0.5">{{ uploading ? '' : 'Cambiar' }}</span>
              </div>
            </button>

            <!-- Error de subida -->
            <p v-if="uploadError" class="text-xs text-red-500 mt-1 max-w-[4rem] text-center leading-tight">
              {{ uploadError }}
            </p>
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-display font-semibold text-xl text-zinc-900 dark:text-zinc-100">
              {{ fullName }}
            </h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              {{ user?.email }}
            </p>
            <div class="mt-2">
              <span class="status-badge text-xs" :class="roleBadgeClass">
                {{ user?.role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="card divide-y divide-zinc-100 dark:divide-zinc-800 mb-6">
        <div class="flex items-center justify-between px-5 py-4">
          <span class="text-sm text-zinc-500 dark:text-zinc-400">Nombre</span>
          <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ fullName }}</span>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <span class="text-sm text-zinc-500 dark:text-zinc-400">Correo electrónico</span>
          <span class="text-sm font-mono text-zinc-900 dark:text-zinc-100">{{ user?.email }}</span>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <span class="text-sm text-zinc-500 dark:text-zinc-400">Rol</span>
          <span class="status-badge text-xs" :class="roleBadgeClass">{{ user?.role }}</span>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <span class="text-sm text-zinc-500 dark:text-zinc-400">Estado de cuenta</span>
          <span class="status-badge text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Activo
          </span>
        </div>
      </div>

      <!-- Preferences -->
      <div class="card p-5">
        <h3 class="font-display font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-4">
          Preferencias
        </h3>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200">Modo oscuro</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {{ themeStore.dark ? 'Tema oscuro activo' : 'Tema claro activo' }}
            </p>
          </div>

          <!-- Toggle switch -->
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
            :class="themeStore.dark ? 'bg-brand-accent' : 'bg-zinc-200 dark:bg-zinc-700'"
            role="switch"
            :aria-checked="themeStore.dark"
            @click="themeStore.toggle()"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
              :class="themeStore.dark ? 'translate-x-6' : 'translate-x-1'"
            ></span>
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="mt-6">
        <button class="btn-secondary text-sm" @click="handleLogout">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

function safeImageUrl(url) {
  if (!url) return null
  if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/')) return url
  return null
}
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useThemeStore } from '@/stores/theme.js'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import api from '@/api/axios.js'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const fileInput = ref(null)
const previewUrl = ref(null)
const uploading = ref(false)
const uploadError = ref(null)

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true
  uploadError.value = null

  try {
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await api.post('/me/avatar', fd)
    authStore.setAvatarUrl(res.data.user.avatarUrl)
    previewUrl.value = null  // usar la URL de la BD desde ahora
  } catch (err) {
    previewUrl.value = null
    const code = err.response?.data?.error
    if (code === 'file_too_large') uploadError.value = 'Máx. 2 MB'
    else if (code === 'invalid_file_type') uploadError.value = 'Solo JPG, PNG o WebP'
    else uploadError.value = 'Error al subir'
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

const user = computed(() => authStore.user)

const fullName = computed(() =>
  [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' ') ||
  user.value?.email ||
  '?'
)

const userInitial = computed(() =>
  fullName.value.charAt(0).toUpperCase()
)

const roleBadgeClass = computed(() => {
  switch (user.value?.role) {
    case 'ADMIN':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    case 'SUPERVISOR':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
  }
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
