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
      sessionChecked.value = true // 이후 라우팅에서 다시 /me를 호출하지 않도록 체크 완료 플래그 유지
    }

    const markSessionChecked = () => {
      sessionChecked.value = true
    }

    function $reset() {
      resetUserFields()
      menuTree.value = []
      accessibleMenus.value = []
      sessionChecked.value = false // persisted 값도 초기화되어 새 탭에서 다시 세션 체크를 수행
    }

    return {
      ...userFieldRefs,
      menuTree,
      accessibleMenus,
      sessionChecked,
      isAuthenticated,
      leafMenus,
      setSession,
      logout,
      markSessionChecked,
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
            'sessionChecked' // 세션 체크 여부도 포함시켜 동일 탭에서는 재요청을 생략
          ]
        }
      ]
    }
  }
)
