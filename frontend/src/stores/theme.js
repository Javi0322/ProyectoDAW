import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(false)

  // Aplica o quita la clase 'dark' en el elemento html
  function applyTheme() {
    if (dark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Cambia entre claro y oscuro y guarda la preferencia
  function toggle() {
    dark.value = !dark.value
    localStorage.setItem('theme', dark.value ? 'dark' : 'light')
    applyTheme()
  }

  // Inicializa el tema al arrancar la app
  function init() {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      dark.value = true
    } else if (stored === 'light') {
      dark.value = false
    } else {
      // Si no hay preferencia guardada, dark por defecto
      dark.value = true
    }
    applyTheme()
  }

  return { dark, toggle, init }
})
