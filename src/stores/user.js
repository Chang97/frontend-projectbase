import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const DEFAULT_USER_STATE = {
  userId: null,
  email: '',
  loginId: '',
  userName: '',
  orgId: null,
  orgName: '',
  empNo: '',
  pstnName: '',
  tel: '',
  userStatusId: null,
  userStatusName: '',
  useYn: false
}

const createUserFieldRefs = () => {
  return Object.entries(DEFAULT_USER_STATE).reduce((acc, [key, defaultValue]) => {
    acc[key] = ref(defaultValue)
    return acc
  }, {})
}

export const useUserStore = defineStore(
  'user',
  () => {
    const userFieldRefs = createUserFieldRefs()
    const menuTree = ref([])
    const accessibleMenus = ref([])
    const sessionChecked = ref(false) // /api/auth/me 호출을 통해 세션을 확인한 적이 있는지 여부
    const menuList = ref([])
    const leafMenuList = ref([])
    const currentMenu = ref(null)
    const path = ref([])

    const isAuthenticated = computed(() => Boolean(userFieldRefs.loginId.value || userFieldRefs.userId.value))

    // 메뉴 트리에서 최하위 노드만 골라내기 위한 파생 데이터.
    const leafMenus = computed(() => {
      const leaves = []
      const traverse = (nodes) => {
        if (!Array.isArray(nodes)) {
          return
        }
        nodes.forEach((node) => {
          const children = Array.isArray(node?.children) ? node.children : []
          if (!children.length) {
            leaves.push(node)
          } else {
            traverse(children)
          }
        })
      }
      traverse(menuTree.value)
      return leaves
    })

    const resetUserFields = () => {
      Object.entries(DEFAULT_USER_STATE).forEach(([key, defaultValue]) => {
        userFieldRefs[key].value = defaultValue
      })
    }

    const applyUserSnapshot = (userSnapshot = {}) => {
      Object.keys(DEFAULT_USER_STATE).forEach((key) => {
        if (userSnapshot[key] !== undefined) {
          userFieldRefs[key].value = userSnapshot[key]
        }
      })
    }

    /**
     * 서버가 내려준 사용자/메뉴 정보를 스토어에 반영한다.
     * - user 정보가 존재하지 않으면 preserveExistingUser 가 false일 때만 초기화한다.
     * - 메뉴 목록은 응답에 없을 때 preserveExistingUser 옵션에 따라 유지/초기화한다.
     */
    const setSession = (payload = {}, options = {}) => {
      const {
        fallbackLoginId = '',
        fallbackUserId = null,
        preserveExistingUser = false,
        user: forcedUser
      } = options

      const sessionUser = payload.user ?? forcedUser
      if (sessionUser) {
        applyUserSnapshot(sessionUser)
      } else if (!preserveExistingUser) {
        resetUserFields()
      }

      if (payload.menus !== undefined) {
        menuTree.value = Array.isArray(payload.menus) ? payload.menus : []
      } else if (!preserveExistingUser) {
        menuTree.value = []
      }

      if (payload.accessibleMenus !== undefined) {
        accessibleMenus.value = Array.isArray(payload.accessibleMenus) ? payload.accessibleMenus : []
      } else if (!preserveExistingUser) {
        accessibleMenus.value = []
      }

      rebuildLegacyMenus(menuTree.value, accessibleMenus.value)
      resolveCurrentMenu(window?.location?.pathname ?? '')

      if (!userFieldRefs.loginId.value && (payload.loginId || fallbackLoginId)) {
        userFieldRefs.loginId.value = payload.loginId ?? fallbackLoginId ?? ''
      }

      if (
        (userFieldRefs.userId.value === null || userFieldRefs.userId.value === undefined) &&
        (payload.userId !== undefined || fallbackUserId !== null)
      ) {
        const resolvedUserId = payload.userId ?? fallbackUserId
        if (resolvedUserId !== undefined && resolvedUserId !== null) {
          userFieldRefs.userId.value = resolvedUserId
        }
      }

      sessionChecked.value = true
    }

    const logout = () => {
      resetUserFields()
      menuTree.value = []
      accessibleMenus.value = []
      menuList.value = []
      leafMenuList.value = []
      currentMenu.value = null
      path.value = []
      sessionChecked.value = true // 이후 라우팅에서 다시 /me를 호출하지 않도록 체크 완료 플래그 유지
    }

    const markSessionChecked = () => {
      sessionChecked.value = true
    }

    function $reset() {
      resetUserFields()
      menuTree.value = []
      accessibleMenus.value = []
      menuList.value = []
      leafMenuList.value = []
      currentMenu.value = null
      path.value = []
      sessionChecked.value = false // persisted 값도 초기화되어 새 탭에서 다시 세션 체크를 수행
    }

    const rebuildLegacyMenus = (tree, flat) => {
      menuList.value = []
      leafMenuList.value = []

      const assignLegacyAliases = (node) => {
        node.MENU_ID = node.menuId
        node.MENU_CD = node.menuCode
        node.MENU_NM = node.menuName
        node.URL = node.url
        node.SRT = node.srt
        node.USE_YN = node.useYn
        node.LVL = node.lvl
      }

      const buildFromTree = (nodes, parentId = null, depth = 0) => {
        if (!Array.isArray(nodes)) {
          return []
        }
        return nodes.map((node) => {
          const normalized = {
            menuId: node?.menuId ?? null,
            menuCode: node?.menuCode ?? '',
            menuName: node?.menuName ?? '',
            menuCn: node?.menuCn ?? '',
            url: node?.url ?? '',
            srt: node?.srt ?? null,
            useYn: node?.useYn ?? true,
            lvl: node?.lvl ?? depth,
            upperMenuId: parentId,
            children: []
          }
          assignLegacyAliases(normalized)
          normalized.children = buildFromTree(node?.children ?? [], normalized.menuId, depth + 1)
          if (!normalized.children.length && normalized.url) {
            leafMenuList.value.push(normalized)
          }
          return normalized
        })
      }

      if (Array.isArray(tree) && tree.length) {
        menuList.value = buildFromTree(tree)
        return
      }

      if (!Array.isArray(flat) || !flat.length) {
        return
      }

      const map = new Map()
      flat.forEach((item) => {
        if (!item || item.menuId == null) return
        const normalized = {
          menuId: item.menuId,
          menuCode: item.menuCode ?? '',
          menuName: item.menuName ?? '',
          menuCn: item.menuCn ?? '',
          url: item.url ?? '',
          srt: item.srt ?? null,
          useYn: item.useYn ?? true,
          lvl: item.lvl ?? null,
          upperMenuId: item.upperMenuId ?? null,
          children: []
        }
        assignLegacyAliases(normalized)
        map.set(normalized.menuId, normalized)
      })

      const roots = []
      map.forEach((node) => {
        const parentId = node.upperMenuId ?? null
        if (parentId != null && map.has(parentId)) {
          const parent = map.get(parentId)
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      })

      const sortBySrt = (nodes) => {
        nodes.sort((a, b) => (a.srt ?? 0) - (b.srt ?? 0))
        nodes.forEach((child) => sortBySrt(child.children ?? []))
      }

      const assignDepth = (nodes, depth = 0, parentId = null) => {
        nodes.forEach((node) => {
          node.lvl = depth
          node.LVL = depth
          node.upperMenuId = parentId
          node.children = node.children ?? []
          if (!node.children.length && node.url) {
            leafMenuList.value.push(node)
          }
          assignDepth(node.children, depth + 1, node.menuId)
        })
      }

      sortBySrt(roots)
      assignDepth(roots)
      menuList.value = roots
    }

    const resolveCurrentMenu = (targetPath) => {
      if (!targetPath) {
        currentMenu.value = null
        path.value = []
        return
      }

      const search = (nodes, parents = []) => {
        for (const node of nodes) {
          const nextParents = [...parents, node]
          if (node.url === targetPath || node.URL === targetPath) {
            return nextParents
          }
          if (Array.isArray(node.children) && node.children.length > 0) {
            const found = search(node.children, nextParents)
            if (found) return found
          }
        }
        return null
      }

      const chain = search(menuList.value, [])
      if (chain) {
        path.value = chain
        currentMenu.value = chain[chain.length - 1]
      } else {
        path.value = []
        currentMenu.value = null
      }
    }

    return {
      ...userFieldRefs,
      menuTree,
      accessibleMenus,
      sessionChecked,
      menuList,
      leafMenuList,
      currentMenu,
      path,
      isAuthenticated,
      leafMenus,
      setSession,
      logout,
      markSessionChecked,
      resolveCurrentMenu,
      $reset
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'user',
          storage: sessionStorage,
          paths: [
            ...Object.keys(DEFAULT_USER_STATE),
            'menuTree',
            'accessibleMenus',
            'menuList',
            'leafMenuList',
            'currentMenu',
            'path',
            'sessionChecked' // 세션 체크 여부도 포함시켜 동일 탭에서는 재요청을 생략
          ]
        }
      ]
    }
  }
)
