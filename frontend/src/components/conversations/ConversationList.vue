<template>
  <aside class="w-[340px] shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h2 class="font-display font-semibold text-sm text-zinc-900 dark:text-zinc-100">
        Conversaciones
        <span v-if="convStore.total > 0" class="ml-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500">
          {{ convStore.total }}
        </span>
      </h2>
      <button
        class="btn-ghost p-1.5"
        title="Actualizar"
        :disabled="convStore.loadingConversations"
        @click="convStore.fetchConversations()"
      >
        <svg
          class="w-3.5 h-3.5"
          :class="{ 'animate-spin': convStore.loadingConversations }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Filters -->
    <ConversationFilters
      :filters="convStore.filters"
      @update:scope="onScopeChange"
      @update:status="onStatusChange"
    />

    <!-- List -->
    <div class="flex-1 overflow-y-auto">
      <!-- Loading skeleton -->
      <div v-if="convStore.loadingConversations" class="p-4 space-y-3">
        <div v-for="i in 6" :key="i" class="flex items-start gap-3 animate-pulse">
          <div class="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
            <div class="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div class="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="convStore.items.length === 0"
        class="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg class="w-6 h-6 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Sin conversaciones</p>
      </div>

      <!-- Conversation items -->
      <div v-else>
        <ConversationItem
          v-for="conv in convStore.items"
          :key="conv.id"
          :conversation="conv"
          :is-active="convStore.activeConversation?.id === conv.id"
          @select="onSelect"
        />

        <!-- Load more -->
        <div v-if="hasMorePages" class="p-3">
          <button
            class="btn-secondary w-full text-xs"
            :disabled="loadingMore"
            @click="loadMore"
          >
            <svg v-if="loadingMore" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loadingMore ? 'Cargando...' : 'Cargar más' }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConversationsStore } from '@/stores/conversations.js'
import ConversationFilters from './ConversationFilters.vue'
import ConversationItem from './ConversationItem.vue'

const convStore = useConversationsStore()

const loadingMore = ref(false)

const hasMorePages = computed(() => {
  return convStore.items.length < convStore.total && convStore.total > 0
})

async function onScopeChange(value) {
  convStore.setFilter('scope', value)
  await convStore.fetchConversations()
}

async function onStatusChange(value) {
  convStore.setFilter('status', value)
  await convStore.fetchConversations()
}

async function onSelect(id) {
  await convStore.selectConversation(id)
}

async function loadMore() {
  loadingMore.value = true
  try {
    await convStore.loadMoreConversations()
  } finally {
    loadingMore.value = false
  }
}
</script>
