# Frontend Project Base (Vue 3 + Vite + Pinia)

Spring Security + JWT 백엔드와 연동되는 Vue 3 템플릿입니다. Axios 인터셉터, 전역 로딩 스토어, 자동 라우팅, Pinia persist 등이 기본 구성되어 있습니다.

## Tech Stack

- Vue 3 + Vite 5
- Pinia + pinia-plugin-persistedstate
- Vue Router (unplugin-vue-router)
- Axios 1.7
- ag-grid-vue3

## Quick Start

```bash
npm install
npm run dev
```

- Dev 서버: `http://localhost:5173`
- `.env.local`
  ```ini
  VITE_vue_publicPath=/
  VITE_axios_baseURL=http://localhost:8080
  VITE_first_page=/login
  VITE_home_page=/main
  ```

## Axios & Auth

`src/plugins/axios.js`

- `withCredentials: true`
- 401 응답 시 `/api/auth/refresh` 호출 → 성공 시 원 요청 재시도
- 전역 로딩 스토어(`useLoadingStore`)와 연동 (`startGlobalLoading/stopGlobalLoading`)
- `refreshClient`는 `skipGlobalLoading: true`로 별도 재시도 차단

## Pinia Stores

- `src/stores/user.js`
  - 세션 스냅샷(`setSession`, `logout`, `sessionChecked`)
  - 메뉴/권한 트리 구성, `persist (sessionStorage)`
- `src/stores/loading.js`
  - `activeRequests` 카운터로 `isLoading` computed

## Routing

`src/router/index.js`

- `vue-router/auto` 기반 라우트
- `hydrateSessionIfNeeded()` → `/api/auth/me`
- `beforeEach`로 권한 체크 (`isRouteAccessible`), OPTIONS 전역 허용
- 인증 상태에 따라 `/login` ↔ `/main` 리다이렉트

## App Bootstrap

`src/main.js`

```js
const pinia = createPinia()
pinia.use(piniaPersist)

const app = createApp(App)

app.use(router)
   .use(pinia)
   .component('AgGridVue', AgGridVue)
   .component('Select', SelectCustom)
   .component('FilteredSelect', FilteredSelect)
   .component('Dialog', Dialog)
   .mount('#app')
```

## Scripts & Dependencies

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
"dependencies": {
  "vue": "^3.4.0",
  "vue-router": "^4.3.0",
  "pinia": "^2.1.7",
  "pinia-plugin-persistedstate": "^3.2.0",
  "axios": "^1.7.0",
  "ag-grid-community": "^31.2.0",
  "ag-grid-vue3": "^31.2.0",
  "qs": "^6.12.0",
  "unplugin-vue-router": "^0.9.0"
}
```

## Dev Tips

- Vite proxy를 사용하지 않으므로 axios baseURL을 환경변수로 지정합니다.
- HttpOnly 쿠키 기반 인증이므로 토큰을 로컬 스토리지에 저장할 필요가 없습니다.
- 로딩 스피너는 `useLoadingStore().isLoading`을 참조해 구현하면 됩니다.
