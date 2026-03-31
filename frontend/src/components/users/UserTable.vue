<template>
  <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-zinc-100 dark:border-zinc-800">
          <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Usuario
          </th>
          <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Email
          </th>
          <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Rol
          </th>
          <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Estado
          </th>
          <th class="text-right px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-50 dark:divide-zinc-800">
        <!-- Loading rows -->
        <tr v-if="loading" v-for="i in 5" :key="i">
          <td class="px-5 py-3" colspan="5">
            <div class="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="users.length === 0">
          <td colspan="5" class="px-5 py-10 text-center text-sm text-zinc-400 dark:text-zinc-600">
            No hay usuarios
          </td>
        </tr>

        <!-- Rows -->
        <tr
          v-else
          v-for="user in users"
          :key="user.id"
          class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <td class="px-5 py-3.5">
            <div class="flex items-center gap-3">
              <img
                v-if="safeImageUrl(user.avatarUrl) && !avatarErrors[user.id]"
                :src="safeImageUrl(user.avatarUrl)"
                class="w-7 h-7 rounded-full object-cover shrink-0"
                @error="avatarErrors[user.id] = true"
              />
              <div
                v-else
                class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                :style="user.active ? `background:${colorFromId(user.id)}` : ''"
                :class="!user.active ? 'bg-zinc-200 dark:bg-zinc-700' : ''"
              >
                <span class="text-xs font-bold" :class="user.active ? 'text-white' : 'text-zinc-500'">
                  {{ initials(user) }}
                </span>
              </div>
              <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ user.firstName }} {{ user.lastName }}</span>
            </div>
          </td>
          <td class="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
            {{ user.email }}
          </td>
          <td class="px-5 py-3.5">
            <span class="status-badge text-[10px]" :class="roleBadgeClass(user.role)">
              {{ user.role }}
            </span>
          </td>
          <td class="px-5 py-3.5">
            <span
              class="status-badge text-[10px]"
              :class="user.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'"
            >
              {{ user.active ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="px-5 py-3.5">
            <div class="flex items-center justify-end gap-1.5">
              <button
                class="btn-ghost text-xs py-1"
                @click="emit('edit', user)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
              <button
                v-if="user.active"
                class="btn-ghost text-xs py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                :disabled="deactivatingId === user.id"
                @click="emit('deactivate', user)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Desactivar
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { colorFromId, initials, safeImageUrl, roleBadgeClass } from '@/utils/userFormatting.js'

const avatarErrors = ref({})

defineProps({
  users: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  deactivatingId: { type: [String, Number, null], default: null },
})

const emit = defineEmits(['edit', 'deactivate'])
</script>
