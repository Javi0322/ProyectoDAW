<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme.js'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})
</script>
