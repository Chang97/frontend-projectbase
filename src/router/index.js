import { createRouter, createWebHashHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import axios from '@/plugins/axios'
import comm from '@/utils/comm'
import { useUserStore } from '@/stores/user'

const authExceptionPage = ['/', '/login', '/main']

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

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
  if (from.path === '/' && comm.getObjectLength(to.query) > 0) {
    sessionStorage.setItem('_INIT_PARAM_', JSON.stringify(to.query))
  }

  if (!await comm.confirmDataModified()) {
    next(false)
    return
  }

  comm.resetDataListInView()

  const userStore = useUserStore()
  let authed = userStore.isAuthenticated

  if (!authed) {
    authed = await hydrateSessionIfNeeded()
  }

  const routeExists = Boolean(to?.matched?.length)
  const isException = authExceptionPage.includes(to.path) || authExceptionPage.includes(to.name)

  if (!routeExists || !to.name) {
    comm.alert('존재하지 않는 페이지입니다.', 'Error')
    next(false)
    return
  }

  if (!isException) {
    try {
      const result = await axios({
        url: '/main/main/isMenuAuthExists.do',
        method: 'get',
        params: { url: to.name }
      })

      if (result.data.isMenuAuthExists) {
        next()
      } else {
        comm.alert('페이지에 접근할 권한이 없습니다.\n로그인 해주시기 바랍니다.', 'Error')
        next({ path: '/' })
      }
    } catch (error) {
      comm.alert('권한 확인 중 오류가 발생했습니다.', 'Error')
      next(false)
    }
    return
  }

  if (!authed && to.path !== '/login') {
    next({ path: '/login', replace: true })
    return
  }

  if (authed && to.path === '/login') {
    next({ path: '/main', replace: true })
    return
  }

  const store = useUserStore()
  store.resolveCurrentMenu?.(to.path)

  next()
})

export default router
