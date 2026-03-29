import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(false)

  function applyTheme() {
    if (dark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggle() {
    dark.value = !dark.value
    localStorage.setItem('theme', dark.value ? 'dark' : 'light')
    applyTheme()
  }

  function init() {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      dark.value = true
    } else if (stored === 'light') {
      dark.value = false
    } else {
      dark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  return { dark, toggle, init }
})
