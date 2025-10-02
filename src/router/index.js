import { createRouter, createWebHashHistory } from 'vue-router'

const LOGIN_PATH = '/login'
const UNAUTH_LANDING_PATH = import.meta.env.VITE_first_page || LOGIN_PATH
const AUTH_LANDING_PATH = import.meta.env.VITE_home_page || '/main'

const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/pages/index.vue')
  },
  {
    path: LOGIN_PATH,
    name: 'login',
    component: () => import('@/pages/login.vue')
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('@/pages/main.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

const isAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const persistedUser = sessionStorage.getItem('user')
    if (!persistedUser) {
      return false
    }

    const parsed = JSON.parse(persistedUser)
    return Boolean(parsed?.id)
  } catch (error) {
    console.warn('Failed to read user session data', error)
    return false
  }
}

router.beforeEach((to, from, next) => {
  const authed = isAuthenticated()

  if (to.path === '/' || to.name === 'index') {
    next({ path: authed ? AUTH_LANDING_PATH : UNAUTH_LANDING_PATH, replace: true })
    return
  }

  if (!authed && to.path !== LOGIN_PATH) {
    next({ path: LOGIN_PATH, replace: true })
    return
  }

  if (authed && to.path === LOGIN_PATH) {
    next({ path: AUTH_LANDING_PATH, replace: true })
    return
  }

  next()
})

export default router
