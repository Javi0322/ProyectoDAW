<template>
  <div
    class="flex w-full animate-fade-in"
    :class="message.direction === 'OUT' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[88%] md:max-w-[72%] flex flex-col gap-1"
      :class="message.direction === 'OUT' ? 'items-end' : 'items-start'"
    >
      <div
        class="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
        :class="[
          message.direction === 'OUT'
            ? 'bg-brand-accent text-brand-primary rounded-br-sm'
            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm shadow-sm',
        ]"
      >
        {{ message.text }}
      </div>

      <!-- Timestamp + status -->
      <div class="flex items-center gap-1.5 px-1">
        <span class="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          <template v-if="message.direction === 'OUT' && message.sentBy">
            Realizado por {{ message.sentBy.firstName }} {{ message.sentBy.lastName }} a las {{ formattedTime }}
          </template>
          <template v-else>
            {{ formattedTime }}
          </template>
        </span>

        <!-- PENDING: reloj -->
        <svg v-if="message.state === 'PENDING'"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14"
          class="shrink-0 text-zinc-400 dark:text-zinc-500" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 4v4.28l2.97 1.71-.75 1.3L6 9.28V4h1.25z"/>
        </svg>

        <!-- SENT: un tick -->
        <svg v-else-if="message.state === 'SENT'"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15"
          class="shrink-0 text-zinc-400 dark:text-zinc-500" fill="currentColor">
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512z"/>
        </svg>

        <!-- RECEIVED: dos ticks grises -->
        <svg v-else-if="message.state === 'RECEIVED'"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15"
          class="shrink-0 text-zinc-400 dark:text-zinc-500" fill="currentColor">
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.319.319 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.891 7.77a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.511z"/>
        </svg>

        <!-- READ: dos ticks azules -->
        <svg v-else-if="message.state === 'READ'"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15"
          class="shrink-0 text-sky-500" fill="currentColor">
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.319.319 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.891 7.77a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.511z"/>
        </svg>

        <!-- ERROR: X roja -->
        <svg v-else-if="message.state === 'ERROR'"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14"
          class="shrink-0 text-red-500" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm2.854 4.146a.5.5 0 0 1 0 .708L8.707 8l2.147 2.146a.5.5 0 0 1-.708.708L8 8.707l-2.146 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 1 1 .708-.708L8 7.293l2.146-2.147a.5.5 0 0 1 .708 0z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const formattedTime = computed(() => {
  if (!props.message.createdAt) return ''
  return new Date(props.message.createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

</script>
