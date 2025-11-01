import { createRouter, createWebHashHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import axios from '@/plugins/axios'
import comm from '@/utils/comm'
import { useUserStore } from '@/stores/user'
import { findFirstNavigableMenu, isRouteAccessible } from '@/utils/menu'

const authExceptionPage = ['/', '/login', '/main']

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

let sessionHydrationPromise = null
let menuHydrationPromise = null

const unwrap = (maybeRef) => (maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef)

const fetchAccessibleMenus = async (userStore, userId) => {
  if (!userStore || !userId) {
    return
  }

  if (!menuHydrationPromise) {
    menuHydrationPromise = axios
      .get(`/api/authr/menus/accessible/${userId}`)
      .then(({ data }) => {
        if (data) {
          userStore.setMenuTree(data)
        }
      })
      .catch((error) => {
        // 메뉴 정보를 가져오지 못해도 라우팅 자체는 진행할 수 있도록 로그만 남긴다.
        console.error('Failed to load accessible menus', error)
      })
      .finally(() => {
        menuHydrationPromise = null
      })
  }

  return menuHydrationPromise
}

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
      .then(async ({ data }) => {
        const userInfo = data?.user ?? {}
        const resolvedLoginId = userInfo?.loginId ?? data?.loginId ?? ''
        const resolvedUserId = userInfo?.userId ?? data?.userId ?? null

        await userStore.setSession(data, {
          user: userInfo,
          fallbackLoginId: resolvedLoginId,
          fallbackUserId: resolvedUserId,
          preserveExistingUser: true
        })

        const menuTree = unwrap(userStore.menuTree)
        const accessibleMenus = unwrap(userStore.accessibleMenus)
        const hasMenus =
          Array.isArray(menuTree) && menuTree.length > 0 &&
          Array.isArray(accessibleMenus) && accessibleMenus.length > 0

        if (!hasMenus && resolvedUserId) {
          await fetchAccessibleMenus(userStore, resolvedUserId)
        }

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

  if (authed) {
    const menuTree = unwrap(userStore.menuTree)
    const accessibleMenus = unwrap(userStore.accessibleMenus)
    const hasMenus = Array.isArray(menuTree) && menuTree.length > 0
    const hasAccessible = Array.isArray(accessibleMenus) && accessibleMenus.length > 0
    const currentUserId = unwrap(userStore.userId)
    if ((!hasMenus || !hasAccessible) && currentUserId) {
      await fetchAccessibleMenus(userStore, currentUserId)
    }
  }

  if (!isException) {
    // 프런트 스토어에 저장된 메뉴 정보만으로도 접근 권한을 판별할 수 있으므로,
    // 별도 서버 호출 없이 허용 경로인지 확인한다.
    const hasAccess =
      isRouteAccessible(userStore, router, to.path) ||
      (to.name && isRouteAccessible(userStore, router, String(to.name)))

    if (!hasAccess) {
      const fallback = findFirstNavigableMenu(userStore, router)
      if (fallback?.destination) {
        comm.alert('페이지에 접근할 권한이 없습니다.', 'Error')
        next({ path: fallback.destination, replace: true })
      } else {
        comm.alert('페이지에 접근할 권한이 없습니다.\n로그인 해주시기 바랍니다.', 'Error')
        next({ path: '/login', replace: true })
      }
      return
    }

    next()
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
