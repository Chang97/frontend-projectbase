<template>
  <section class="content">
    <div class="content-box">
      <div class="example">
        시스템으로 이동하는 중입니다...
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import comm from '@/utils/comm'

const router = useRouter()
const userStore = useUserStore()

const resolveInitialMenu = () => {
  const leaves = userStore.leafMenus
  if (!leaves || leaves.length === 0) {
    comm.alert('접근 가능한 메뉴가 존재하지 않습니다. 관리자에게 문의하세요.', '알림')
    return null
  }

  let target = leaves[0]
  let query = {}

  const raw = sessionStorage.getItem('_INIT_PARAM_')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.initMenu) {
        const found = leaves.find((item) => item.menuCode === parsed.initMenu || item.menuId === parsed.initMenu)
        if (found) {
          target = found
          const { initMenu, ...rest } = parsed
          query = rest
        }
      }
    } catch (error) {
      console.warn('Failed to parse _INIT_PARAM_', error)
    }
    sessionStorage.removeItem('_INIT_PARAM_')
  }

  return { target, query }
}

onMounted(() => {
  const resolved = resolveInitialMenu()
  if (!resolved || !resolved.target) {
    return
  }

  const destination = resolved.target?.url || '/main'
  router.replace({ path: destination, query: resolved.query })
})
</script>
