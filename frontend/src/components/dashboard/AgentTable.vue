<template>
  <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
    <div class="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
      <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-widest font-mono">
        Rendimiento por usuario
      </h3>
    </div>

    <div v-if="!users || users.length === 0" class="px-5 py-10 text-center">
      <p class="text-sm text-zinc-400 dark:text-zinc-500">Sin datos de usuarios</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-zinc-100 dark:border-zinc-800">
            <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Usuario</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Abiertas</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Pendientes</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Resueltas</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Mensajes env.</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-50 dark:divide-zinc-800">
          <tr
            v-for="user in users"
            :key="user.userId ?? 'unassigned'"
            class="transition-colors"
            :class="user.userId !== null ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer' : 'bg-zinc-50/50 dark:bg-zinc-800/20'"
            @click="user.userId !== null && emit('selectUser', user)"
          >
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div
                  class="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                  :style="user.userId !== null && !user.avatarUrl ? `background:${colorFromId(user.userId)}` : ''"
                  :class="user.userId === null ? 'bg-zinc-200 dark:bg-zinc-700' : ''"
                >
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    :alt="userName(user)"
                    class="w-full h-full object-cover"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <svg v-else-if="user.userId === null" class="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span v-else class="text-xs font-bold text-white leading-none">
                    {{ initials(user) }}
                  </span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-medium truncate max-w-[140px]" :class="user.userId === null ? 'text-zinc-500 dark:text-zinc-400 italic' : 'text-zinc-700 dark:text-zinc-200'">
                    {{ userName(user) }}
                  </span>
                  <span v-if="user.role" class="text-xs font-mono px-1.5 py-0.5 rounded w-fit mt-0.5" :class="roleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-right tabular-nums font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {{ user.currentlyOpen ?? 0 }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums font-mono text-orange-500 dark:text-orange-400 font-semibold">
              {{ user.currentlyPending ?? 0 }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums font-mono text-zinc-600 dark:text-zinc-300">
              {{ user.resolvedInPeriod ?? 0 }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums font-mono text-zinc-600 dark:text-zinc-300">
              {{ user.messagesSent ?? 0 }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { colorFromId, initials, userName, roleBadgeClass } from '@/utils/userFormatting.js'

defineProps({
  users: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['selectUser'])
</script>
