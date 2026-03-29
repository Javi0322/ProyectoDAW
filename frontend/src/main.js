import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializamos el tema antes de montar la app para evitar parpadeo
import { useThemeStore } from './stores/theme.js'
const themeStore = useThemeStore()
themeStore.init()

app.mount('#app')
