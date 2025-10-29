<template>
  <div class="login-page">
    <section class="login-card">
      <header class="login-header">
        <h1 class="login-title">Project Base</h1>
        <p class="login-subtitle">Sign in to start managing the system.</p>
      </header>
      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="field-label">User ID</span>
          <input
            v-model.trim="id"
            type="text"
            placeholder="Enter your user id"
            autocomplete="username"
            autofocus
          />
        </label>
        <label class="field">
          <span class="field-label">Password</span>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            autocomplete="current-password"
          />
        </label>
        <p v-if="errorMessage" class="login-error">{{ errorMessage }}</p>
        <button type="submit" class="login-button" :disabled="!canSubmit">
          <span v-if="!loading">Sign In</span>
          <span v-else>Signing in...</span>
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { findFirstNavigableMenu } from '@/utils/menu'

const axios = inject('axios')
const router = useRouter()
const userStore = useUserStore()

const id = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const canSubmit = computed(() => Boolean(id.value) && Boolean(password.value) && !loading.value)
const postLoginPath = import.meta.env.VITE_home_page || '/main'

/**
 * 세션에 등록된 메뉴 목록 중 가장 먼저 접근 가능한 화면으로 이동한다.
 * - 메뉴가 하나도 없으면 환경변수로 지정된 postLoginPath 로 폴백한다.
 */
const navigateToHome = () => {
  const navigable = findFirstNavigableMenu(userStore, router)
  if (navigable?.destination) {
    if (
      /^(https?:)?\/\//i.test(navigable.destination) ||
      navigable.destination.startsWith('mailto:') ||
      navigable.destination.startsWith('tel:')
    ) {
      window.location.href = navigable.destination
    } else {
      router.replace({ path: navigable.destination })
    }
    return true
  }

  if (postLoginPath) {
    router.replace({ path: postLoginPath })
    return true
  }

  return false
}

onBeforeMount(() => {
  if (userStore.isAuthenticated) {
    navigateToHome()
  }
})

const onSubmit = async () => {
  if (!canSubmit.value) {
    return
  }

  if (!axios) {
    errorMessage.value = 'Login client is unavailable.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await axios.post('/api/auth/login', {
      loginId: id.value,
      password: password.value
    })

    // 공통 세션 관리 로직은 store로 위임한다.
    const userInfo = data?.user ?? data ?? {}
    const resolvedLoginId = userInfo.loginId ?? data?.loginId ?? id.value
    const resolvedUserId = userInfo.userId ?? data?.userId ?? null

    if (!resolvedLoginId) {
      throw new Error('Unable to resolve user identity.')
    }

    await userStore.setSession(
      data,
      {
        fallbackLoginId: resolvedLoginId,
        fallbackUserId: resolvedUserId,
        user: userInfo
      }
    )
    
    const response = await axios.get(`/api/authr/resolveMenus/${resolvedUserId}`)
    userStore.setMenuTree(response.data)

    navigateToHome()
  } catch (error) {
    const fallback = error?.response?.data?.message || error.message || 'Failed to sign in. Please try again.'
    errorMessage.value = fallback
    userStore.logout()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.login-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.login-form {
  display: grid;
  gap: 20px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #4b5563;
  letter-spacing: 0.05em;
}

.field input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  color: #111827;
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  background-color: #ffffff;
}

.login-error {
  margin: -8px 0 0;
  color: #dc2626;
  font-size: 13px;
}

.login-button {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 22px;
  }
}
</style>
