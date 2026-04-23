import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    name: 'Main',
    component: () => import('@/views/MainView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/UsersView.vue'),
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/me',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, requiresRole: ['SUPERVISOR', 'ADMIN'] },
  },
  {
    path: '/labels',
    name: 'Labels',
    component: () => import('@/views/LabelsView.vue'),
    meta: { requiresAuth: true, requiresRole: 'ADMIN' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/')
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  const required = to.meta.requiresRole
  if (required) {
    const roles = Array.isArray(required) ? required : [required]
    if (!roles.includes(authStore.user?.role)) {
      return next('/')
    }
  }

  next()
})

export default router
