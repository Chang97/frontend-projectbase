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

const REFRESH_THRESHOLD_MS = 60 * 1000 // 토큰 만료 1분 전에는 갱신을 시도한다.

const normalizeExpiresAt = (value) => {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
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
    const accessToken = ref('')
    const tokenType = ref('Bearer')
    const tokenExpiresAt = ref(null) // ISO-8601 문자열 또는 null
    const menuTree = ref([])
    const accessibleMenus = ref([])

    const tokenExpiresAtMs = computed(() => {
      if (!tokenExpiresAt.value) {
        return null
      }

      const timestamp = new Date(tokenExpiresAt.value).getTime()
      return Number.isNaN(timestamp) ? null : timestamp
    })

    const isAuthenticated = computed(() => {
      const hasToken = Boolean(accessToken.value)
      const hasIdentity = Boolean(userFieldRefs.loginId.value || userFieldRefs.userId.value)
      return hasToken && hasIdentity
    })

    const isAccessTokenExpired = computed(() => {
      const expiresAt = tokenExpiresAtMs.value
      if (!expiresAt) {
        return false
      }

      return Date.now() >= expiresAt
    })

    const shouldRefreshToken = computed(() => {
      const expiresAt = tokenExpiresAtMs.value
      if (!expiresAt) {
        return false
      }

      return expiresAt - Date.now() <= REFRESH_THRESHOLD_MS
    })

    const secondsUntilExpiry = computed(() => {
      const expiresAt = tokenExpiresAtMs.value
      if (!expiresAt) {
        return null
      }

      return Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0)
    })

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
     * 로그인·토큰 재발급 응답을 공통으로 처리한다.
     * - accessToken, expiresAt, tokenType, user 필드를 반영한다.
     * - user 정보가 존재하지 않으면 preserveExistingUser가 false일 때만 사용자 정보를 초기화한다.
     */
    const setSession = (payload = {}, options = {}) => {
      const {
        fallbackLoginId = '',
        fallbackUserId = null,
        preserveExistingUser = false,
        user: forcedUser
      } = options

      if (payload.accessToken !== undefined) {
        accessToken.value = payload.accessToken ?? ''
      }

      if (payload.tokenType) {
        tokenType.value = payload.tokenType
      } else if (!tokenType.value) {
        tokenType.value = 'Bearer'
      }

      if (payload.expiresAt !== undefined) {
        tokenExpiresAt.value = normalizeExpiresAt(payload.expiresAt)
      }

      const userSnapshot = payload.user ?? forcedUser
      if (userSnapshot) {
        applyUserSnapshot(userSnapshot)
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
    }

    const updateTokenOnly = (payload = {}) => {
      setSession(payload, { preserveExistingUser: true })
    }

    const logout = () => {
      accessToken.value = ''
      tokenType.value = 'Bearer'
      tokenExpiresAt.value = null
      resetUserFields()
      menuTree.value = []
      accessibleMenus.value = []
    }

    function $reset() {
      logout()
    }

    return {
      ...userFieldRefs,
      accessToken,
      tokenType,
      tokenExpiresAt,
      menuTree,
      accessibleMenus,
      leafMenus,
      tokenExpiresAtMs,
      isAuthenticated,
      isAccessTokenExpired,
      shouldRefreshToken,
      secondsUntilExpiry,
      setSession,
      updateTokenOnly,
      logout,
      $reset
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'user',
          storage: sessionStorage
        }
      ]
    }
  }
)
