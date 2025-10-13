import { createRouter, createWebHashHistory } from 'vue-router'
import axios from '@/plugins/axios'
import { useUserStore } from '@/stores/user'

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

// 중복 호출을 막기 위해 글로벌 프로미스를 사용한다.
let sessionHydrationPromise = null

const hydrateSessionIfNeeded = async () => {
  const userStore = useUserStore()

  if (userStore.isAuthenticated) {
    return true
  }

  if (userStore.sessionChecked) {
    return false
  }

  if (!sessionHydrationPromise) {
    sessionHydrationPromise = axios
      .get('/api/auth/me')
      .then(({ data }) => {
        const userInfo = data?.user ?? {}
        userStore.setSession(data, {
          user: userInfo,
          fallbackLoginId: userInfo?.loginId ?? '',
          fallbackUserId: userInfo?.userId ?? null
        })
        return true
      })
      .catch(() => {
        userStore.logout()
        return false
      })
      .finally(() => {
        sessionHydrationPromise = null
      })
  }

  return sessionHydrationPromise
}

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  let authed = userStore.isAuthenticated

  if (!authed) {
    authed = await hydrateSessionIfNeeded()
  }

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
