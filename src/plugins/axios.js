import axios from 'axios'
import qs from 'qs'

import router from '@/router'
import { useUserStore } from '@/stores/user'
import comm from '@/utils/comm'

const axiosConfig = {
  // baseURL: '/api',
  baseURL: import.meta.env.VITE_axios_baseURL,
  // timeout: 60 * 1000, // Timeout
  withCredentials: true, // 쿠키 기반 인증 세션을 공유하기 위해 true 설정
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-TOKEN',
  paramsSerializer: {
    // axios 기본 qs 처리에 []이 포함될 때 문제가 있어 직접 직렬화 로직을 붙인다.
    serialize: (params) => {
      /*
       * - { }(일반적인 object) : qs.stringify(params)를 이용해서 처리(String으로 변환됨)
       * - URLSearchParams() : 그대로 반환
       *
       * cf) paramsSerializer을 사용하게 된 사유 : axios의 get방식 통신 중 파라메터값에 "[]"이 들어가면, cors 오류가 발생함(axios v1.6.0에서 []을 url encoding하지 않는 이슈가 존재함. https://github.com/axios/axios/issues/3316)
       */
      let returnVal = null
      if (typeof params === 'object' && params.constructor !== undefined && params.constructor.name === 'URLSearchParams') {
        returnVal = params
      } else if (typeof params === 'object') {
        returnVal = qs.stringify(params)
      } else {
        returnVal = qs.stringify(params)
      }
      // console.log(params, returnVal, 'object name=' + (typeof params == 'object' && params.constructor != undefined ? params.constructor.name : 'N/A'))
      return returnVal
    }
  }
}

const apiClient = axios.create(axiosConfig)

// refresh 토큰 호출은 실패 시에도 재시도하지 않도록 별도 인스턴스를 사용한다.
const refreshClient = axios.create({
  ...axiosConfig,
  withCredentials: true // HttpOnly 쿠키 기반의 리프레시 토큰을 지원하기 위한 설정
})

let csrfTokenCache = undefined

const attachCsrfHeader = (config) => {
  const csrfToken = getCookie('XSRF-TOKEN')
  if (csrfToken) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-CSRF-TOKEN', csrfToken)
    } else {
      config.headers = config.headers ?? {}
      config.headers['X-CSRF-TOKEN'] = csrfToken
    }
    csrfTokenCache = csrfToken
    if (import.meta.env.DEV) {
      console.debug('[axios] attach csrf header from cookie', csrfToken)
    }
  } else if (csrfTokenCache) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-CSRF-TOKEN', csrfTokenCache)
    } else {
      config.headers = config.headers ?? {}
      config.headers['X-CSRF-TOKEN'] = csrfTokenCache
    }
    if (import.meta.env.DEV) {
      console.debug('[axios] reuse cached csrf header', csrfTokenCache)
    }
  } else if (import.meta.env.DEV) {
    console.debug('[axios] XSRF-TOKEN cookie not found. document.cookie=', document.cookie)
  }
  return config
}

apiClient.interceptors.request.use(attachCsrfHeader)
refreshClient.interceptors.request.use(attachCsrfHeader)

const REFRESH_ENDPOINT = '/api/auth/refresh'
const LOGIN_REDIRECT_PATH = '/login'

let refreshPromise = null

const redirectToLogin = () => {
  const currentPath = router.currentRoute?.value?.path
  if (currentPath !== LOGIN_REDIRECT_PATH) {
    router.replace({ path: LOGIN_REDIRECT_PATH })
  }
}

// Refresh 쿠키를 이용해 서버 세션을 연장한다. 동시에 스토어를 최신 사용자 정보로 갱신한다.
const refreshSession = async (userStore) => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(REFRESH_ENDPOINT)
      .then(({ data }) => {
        const userInfo = data?.user ?? {}
        userStore.setSession(data, {
          preserveExistingUser: true,
          user: userInfo,
          fallbackLoginId: userInfo?.loginId ?? '',
          fallbackUserId: userInfo?.userId ?? null
        })
        return true
      })
      .catch((error) => {
        const status = error?.response?.status
        error.__shouldLogout = status === 401 || status === 403
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function recurMakeId(obj) {
  if (Array.isArray(obj)) {
    for (let idx in obj) {
      if (obj[idx] && typeof obj[idx] == 'object') {
        obj[idx]['__id'] = idx
        obj[idx]['__crud'] = 'R'
        for (let key in obj[idx]) {
          if (typeof obj[idx][key] == 'object') recurMakeId(obj[idx][key])
        }
      }
    }
  } else {
    for (let key in obj) {
      if (typeof obj[key] == 'object') recurMakeId(obj[key])
    }
  }
}

function getCookie(name) {
  if (typeof document === 'undefined') {
    return undefined
  }
  const pattern = new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)')
  const match = document.cookie.match(pattern)
  return match ? decodeURIComponent(match[1]) : undefined
}

apiClient.interceptors.response.use(
  async (response) => {
    const csrfHeader =
      response?.headers?.get?.('x-csrf-token') ??
      response?.headers?.get?.('X-CSRF-TOKEN') ??
      response?.headers?.['x-csrf-token'] ??
      response?.headers?.['X-CSRF-TOKEN']
    if (csrfHeader) {
      csrfTokenCache = csrfHeader
      if (import.meta.env.DEV) {
        console.debug('[axios] update csrf cache from response header', csrfHeader)
      }
      document.cookie = `XSRF-TOKEN=${csrfHeader}; path=/; SameSite=Lax`
    }
    const errmsg = response?.data?.__errmsg__
    if (!errmsg) {
      for (let key in response.data) {
        const dataItem = response.data[key]
        recurMakeId(dataItem)
      }
    }

    if (errmsg) {
      const msgVar = response?.data?.msgargs
      alert({ msgKey: errmsg, msgVar: msgVar }, 'Error')

      return Promise.reject(new Error(errmsg))
    }

    return response
  },
  async (error) => {
    console.log("🚀 ~ error:", error)
    const originalRequest = error?.config
    const status = error?.response?.status
    const userStore = useUserStore()

    const isRefreshRequest = originalRequest?.url?.includes(REFRESH_ENDPOINT)

    if (status === 401 && !originalRequest?.__isRetryRequest && !isRefreshRequest) {
      try {
        await refreshSession(userStore)
        originalRequest.__isRetryRequest = true
        return apiClient(originalRequest)
      } catch (refreshError) {
        if (refreshError?.__shouldLogout) {
          userStore.logout()
          csrfTokenCache = undefined
          redirectToLogin()
        } else if (originalRequest) {
          originalRequest.__skipLogout = true
        }
        return Promise.reject(refreshError)
      }
    }

    const errmsg = error?.response?.data?.__errmsg__ ?? 'error'
    comm.alert(errmsg, 'Error')

    if (status === 401 && !isRefreshRequest && !originalRequest?.__skipLogout) {
      userStore.logout()
      csrfTokenCache = undefined
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

// export default import.meta.env.VITE_use_dummyData == "true" ? dummyDataLoader : apiClient
export default apiClient
