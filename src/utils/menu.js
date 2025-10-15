/**
 * 메뉴 URL을 라우터 경로와 매칭하고 탐색하기 위한 유틸 모듈.
 * - 백엔드에서 내려온 menu.url 형태는 `.do`, 확장자, 구분자 등이 섞일 수 있다.
 * - 여기서는 라우터 정보와 메뉴 데이터를 조합해 실제 탐색 가능한 경로를 찾아낸다.
 */

const routerLookupCache = new WeakMap()

const buildRouterLookup = (router) => {
  // 라우터가 아직 주입되지 않았다면 빈 매핑만 반환한다.
  if (!router) {
    return new Map()
  }

  if (routerLookupCache.has(router)) {
    return routerLookupCache.get(router)
  }

  const map = new Map()
  const register = (key, record) => {
    if (!key) return
    const lowered = key.toLowerCase()
    if (!map.has(lowered)) {
      map.set(lowered, record)
    }
  }

  router.getRoutes().forEach((route) => {
    const record = { path: route.path, name: route.name }
    const variants = new Set()
    variants.add(route.path)
    variants.add(route.path.replace(/^\//, ''))

    if (route.name) {
      variants.add(String(route.name))
    }

    const compactPath = route.path.replace(/^\//, '')
    if (compactPath) {
      const bySlash = compactPath.replace(/\//g, '/')
      variants.add(bySlash)
      variants.add(compactPath.replace(/\//g, '.'))
      variants.add(compactPath.replace(/\//g, '-'))
      variants.add(compactPath.replace(/\//g, '_'))
    }

    variants.forEach((variant) => register(variant, record))
  })

  routerLookupCache.set(router, map)
  return map
}

export const resolveMenuTarget = (menu, router) => {
  // menu.url(URL) 값이 없다면 기본 홈 경로(`/`)를 반환한다.
  const rawTarget = menu?.url ?? menu?.URL ?? ''
  const target = typeof rawTarget === 'string' ? rawTarget.trim() : ''
  if (!target) {
    return '/'
  }

  if (/^(https?:)?\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('tel:')) {
    return target
  }
  if (target.startsWith('#')) {
    return target
  }

  const normalize = (value) => value.replace(/^\//, '')
  const withoutExt = target.replace(/\.[a-z0-9]+$/i, '')
  const withoutDo = target.replace(/\.do$/i, '')

  const candidates = new Set([
    // 원본 그대로
    target,
    // 선행 슬래시 제거
    normalize(target),
    // 확장자 제거 버전
    withoutExt,
    normalize(withoutExt),
    // .do 제거 버전
    withoutDo,
    normalize(withoutDo),
    // 구분자를 슬래시로 치환한 버전들
    normalize(target).replace(/\./g, '/'),
    normalize(target).replace(/_/g, '/'),
    normalize(target).replace(/-/g, '/')
  ])

  if (router) {
    const lookup = buildRouterLookup(router)
    for (const candidate of candidates) {
      if (!candidate) continue
      // 라우트 이름/경로와 대소문자 무관하게 비교한다.
      const record = lookup.get(candidate.toLowerCase())
      if (record?.path) {
        return record.path
      }
    }

    for (const candidate of candidates) {
      if (!candidate) continue
      const pathCandidate = candidate.startsWith('#') ? candidate : `/${candidate.replace(/^\/+/, '')}`
      const resolved = router.resolve(pathCandidate)
      if (resolved.matched?.length) {
        return resolved.path
      }
    }
  }

  // 위에서 매칭되지 않았다면 가능한 값 중 하나에 슬래시만 붙여 반환한다.
  const prefix = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return '/'
    const normalized = normalize(trimmed)
    return trimmed.startsWith('/') ? trimmed : `/${normalized}`
  }

  if (withoutDo && withoutDo !== target) {
    return prefix(withoutDo)
  }
  if (withoutExt && withoutExt !== target) {
    return prefix(withoutExt)
  }

  for (const candidate of candidates) {
    if (!candidate) continue
    return prefix(candidate)
  }

  return '/'
}

export const collectLeafMenus = (userStore) => {
  if (!userStore) {
    return []
  }
  const candidates =
    // Pinia 스토어에서 사용 중인 복합 메뉴 구조를 우선 사용한다.
    (Array.isArray(userStore.leafMenuList) && userStore.leafMenuList.length
      ? userStore.leafMenuList
      // 폴백: 백엔드에서 내려준 flat 구조
      : userStore.leafMenus) ?? []

  if (!Array.isArray(candidates)) {
    return []
  }

  // 정렬 순서를 기준으로 오름차순 정렬한다.
  return [...candidates].sort((a, b) => (a.srt ?? 9999) - (b.srt ?? 9999))
}

export const ensureNavigableMenu = (menu, router) => {
  if (!menu) {
    return null
  }

  const destination = resolveMenuTarget(menu, router)
  // URL이 없으면 탐색 불가로 처리한다.
  if (!destination) {
    return null
  }

  // 외부 링크, 메일, 전화 링크는 그대로 사용한다.
  if (/^(https?:)?\/\//i.test(destination) || destination.startsWith('mailto:') || destination.startsWith('tel:')) {
    return { menu, destination }
  }

  // 라우터 정보가 없다면 조심스럽게 그대로 반환한다.
  if (!router || typeof router.resolve !== 'function') {
    return { menu, destination }
  }

  const resolved = router.resolve(destination)
  if (resolved?.matched?.length) {
    const lastRecord = resolved.matched[resolved.matched.length - 1]
    if (lastRecord?.components?.default) {
      return { menu, destination: resolved.path }
    }
  }

  return null
}

export const findFirstNavigableMenu = (userStore, router, options = {}) => {
  const leaves = collectLeafMenus(userStore)
  if (!leaves.length) {
    return null
  }

  const {
    // 우선 탐색할 메뉴 목록
    priorityMenus = [],
    // 단일 선호 menuId / menuCode
    preferredMenuId,
    preferredMenuCode,
    // 복수 선호 menuId / menuCode 컬렉션
    preferredMenuIds = [],
    preferredMenuCodes = []
  } = options

  const candidates = []
  const pushCandidate = (menu) => {
    if (!menu) return
    if (candidates.includes(menu)) return
    candidates.push(menu)
  }

  priorityMenus.forEach(pushCandidate)

  if (preferredMenuId != null) {
    pushCandidate(leaves.find((item) => item.menuId === preferredMenuId))
  }

  if (preferredMenuCode) {
    pushCandidate(leaves.find((item) => item.menuCode === preferredMenuCode))
  }

  preferredMenuIds.forEach((id) => {
    pushCandidate(leaves.find((item) => item.menuId === id))
  })

  preferredMenuCodes.forEach((code) => {
    pushCandidate(leaves.find((item) => item.menuCode === code))
  })

  for (const candidate of candidates) {
    const navigable = ensureNavigableMenu(candidate, router)
    if (navigable) {
      return navigable
    }
  }

  // 아무 선호 메뉴가 없으면 전체 목록을 순차 탐색한다.
  for (const leaf of leaves) {
    const navigable = ensureNavigableMenu(leaf, router)
    if (navigable) {
      return navigable
    }
  }

  return null
}

/**
 * 현재 라우트 path가 접근 가능한 메뉴인지 여부를 확인한다.
 * - 메뉴 URL 규칙이 실제 라우터와 다를 수 있으므로 resolveMenuTarget 결과를 비교한다.
 */
export const isRouteAccessible = (userStore, router, targetPath) => {
  if (!userStore || !targetPath) {
    return false
  }

  const normalized = typeof targetPath === 'string'
    ? (targetPath.startsWith('/') ? targetPath : `/${targetPath.replace(/^\/+/, '')}`)
    : ''
  if (!normalized) {
    return false
  }

  const accessibleMenus = Array.isArray(userStore.accessibleMenus)
    ? userStore.accessibleMenus
    : []

  return accessibleMenus.some((menu) => {
    const destination = resolveMenuTarget(menu, router)
    if (!destination) {
      return false
    }
    if (destination === normalized) {
      return true
    }
    const normalizedDestination = destination.startsWith('/')
      ? destination
      : `/${destination.replace(/^\/+/, '')}`
    if (normalizedDestination === normalized) {
      return true
    }
    const withoutDo = normalizedDestination.replace(/\.do$/i, '')
    return withoutDo === normalized
  })
}
