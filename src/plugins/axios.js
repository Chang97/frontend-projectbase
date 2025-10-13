import axios from 'axios'
import qs from 'qs'

import router from '@/router'
import { useUserStore } from '@/stores/user'

const axiosConfig = {
  // baseURL: '/api',
  baseURL: import.meta.env.VITE_axios_baseURL,
  // timeout: 60 * 1000, // Timeout
  withCredentials: true, // 쿠키 기반 인증 세션을 공유하기 위해 true 설정
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
        userStore.logout()
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

apiClient.interceptors.response.use(
  async (response) => {
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
        userStore.logout()
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }

    const errmsg = error?.response?.data?.__errmsg__ ?? 'error'
    const msgVar = error?.response?.data?.msgargs
    alert({ msgKey: errmsg, msgVar: msgVar }, 'Error')

    if (status === 401 && !isRefreshRequest) {
      userStore.logout()
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

// export default import.meta.env.VITE_use_dummyData == "true" ? dummyDataLoader : apiClient
export default apiClient
