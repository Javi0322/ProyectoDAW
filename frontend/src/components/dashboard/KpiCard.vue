<template>
  <div class="kpi-card relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow duration-300">
    <!-- Decorative accent orb -->
    <div
      class="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl pointer-events-none"
      :class="accentBg"
    />

    <span class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
      {{ label }}
    </span>

    <div class="flex items-end gap-2">
      <span
        class="text-4xl font-black leading-none tabular-nums"
        :class="accentText"
      >
        {{ displayValue }}
      </span>
    </div>

    <span v-if="subtitle" class="text-xs text-zinc-400 dark:text-zinc-500 leading-snug">
      {{ subtitle }}
    </span>

    <!-- Bottom accent bar -->
    <div class="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 rounded-b-2xl" :class="accentBg" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  subtitle: { type: String, default: '' },
  color: { type: String, default: 'blue' },
})

const colorMap = {
  blue:   { text: 'text-sky-500 dark:text-sky-400',    bg: 'bg-sky-500' },
  amber:  { text: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500' },
  green:  { text: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500' },
  violet: { text: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500' },
  rose:   { text: 'text-rose-500 dark:text-rose-400',   bg: 'bg-rose-500' },
  orange: { text: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500' },
  zinc:   { text: 'text-zinc-500 dark:text-zinc-400',   bg: 'bg-zinc-500' },
}

const accentText = computed(() => (colorMap[props.color] ?? colorMap.blue).text)
const accentBg   = computed(() => (colorMap[props.color] ?? colorMap.blue).bg)

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '—'
  return props.value
})
</script>
