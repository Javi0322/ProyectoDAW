<template>
  <!-- Barra inferior móvil: solo visible en < md -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 h-14 z-20 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center">
    <RouterLink
      to="/"
      class="flex-1 flex items-center justify-center h-full transition-colors"
      :class="$route.path === '/' ? 'text-brand-accent' : 'text-zinc-400 dark:text-zinc-500'"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </RouterLink>

    <RouterLink
      v-if="authStore.isAdmin"
      to="/users"
      class="flex-1 flex items-center justify-center h-full transition-colors"
      :class="$route.path === '/users' ? 'text-brand-accent' : 'text-zinc-400 dark:text-zinc-500'"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </RouterLink>

    <RouterLink
      to="/me"
      class="flex-1 flex items-center justify-center h-full"
    >
      <span
        class="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent overflow-hidden transition-all"
        :class="$route.path === '/me' ? 'ring-2 ring-brand-accent/50' : ''"
      >
        <img
          v-if="safeImageUrl(userAvatar) && !avatarError"
          :src="safeImageUrl(userAvatar)"
          alt=""
          class="w-full h-full object-cover"
          @error="avatarError = true"
        />
        <span v-else class="text-xs font-bold text-brand-primary leading-none">{{ userInitial }}</span>
      </span>
    </RouterLink>
  </nav>

  <!-- Sidebar desktop: solo visible en md+ -->
  <aside class="hidden md:flex fixed left-0 top-0 h-screen w-14 z-20 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col items-center py-3">
    <!-- Logo -->
    <div class="flex items-center justify-center mb-6 shrink-0">
      <img src="/logo.png" alt="Logo" class="w-8 h-8 object-contain" />
    </div>

    <!-- Nav links -->
    <nav class="flex flex-col items-center gap-1 flex-1">
      <RouterLink
        to="/"
        class="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="$route.path === '/' ? 'bg-brand-accent/10 text-brand-accent' : 'text-zinc-500 dark:text-zinc-400'"
        title="Bandeja"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Bandeja
        </span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isAdmin"
        to="/users"
        class="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="$route.path === '/users' ? 'bg-brand-accent/10 text-brand-accent' : 'text-zinc-500 dark:text-zinc-400'"
        title="Usuarios"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Usuarios
        </span>
      </RouterLink>
    </nav>

    <!-- Perfil + cerrar sesión -->
    <div class="flex flex-col items-center gap-2 shrink-0">
      <RouterLink
        to="/me"
        class="group relative flex items-center justify-center w-9 h-9 rounded-full bg-brand-accent hover:ring-2 hover:ring-brand-accent/50 transition-all"
        :class="$route.path === '/me' ? 'ring-2 ring-brand-accent/50' : ''"
        title="Mi perfil"
      >
        <img
          v-if="safeImageUrl(userAvatar) && !avatarError"
          :src="safeImageUrl(userAvatar)"
          alt=""
          class="w-9 h-9 rounded-full object-cover"
          @error="avatarError = true"
        />
        <span v-else class="text-xs font-bold text-brand-primary leading-none">{{ userInitial }}</span>
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {{ [authStore.user?.firstName, authStore.user?.lastName].filter(Boolean).join(' ') || authStore.user?.email }}
        </span>
      </RouterLink>

      <button
        class="group relative flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        title="Cerrar sesión"
        @click="handleLogout"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Cerrar sesión
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const userInitial = computed(() => {
  const { firstName, lastName, email } = authStore.user ?? {}
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const name = fullName || email || '?'
  return name.charAt(0).toUpperCase()
})

function safeImageUrl(url) {
  if (!url) return null
  if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/')) return url
  return null
}

const avatarError = ref(false)
const userAvatar = computed(() => authStore.user?.avatarUrl ?? null)
watch(userAvatar, () => { avatarError.value = false })

function handleLogout() {
  authStore.logout()
  window.location.replace('/login')
}
</script>
