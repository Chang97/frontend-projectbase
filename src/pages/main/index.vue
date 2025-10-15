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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import comm from '@/utils/comm'
import { collectLeafMenus, ensureNavigableMenu, findFirstNavigableMenu } from '@/utils/menu'

const router = useRouter()
const userStore = useUserStore()

const leafMenus = computed(() => collectLeafMenus(userStore))

const resolveInitialMenu = () => {
  const leaves = leafMenus.value
  if (!leaves.length) {
    comm.alert('접근 가능한 메뉴가 존재하지 않습니다. 관리자에게 문의하세요.', '알림')
    return null
  }

  let query = {}
  const priorityMenus = []
  let preferredCodes = []
  let preferredIds = []

  const raw = sessionStorage.getItem('_INIT_PARAM_')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.initMenu) {
        const desired = parsed.initMenu
        preferredCodes = [String(desired)]
        const numeric = Number(desired)
        if (!Number.isNaN(numeric)) {
          preferredIds = [numeric]
        }
        const matchedMenu = leaves.find(
          (item) => item.menuCode === desired || item.menuId === desired || item.menuId === numeric
        )
        if (matchedMenu) {
          priorityMenus.push(matchedMenu)
        }
        const { initMenu, ...rest } = parsed
        query = rest
      }
    } catch (error) {
      console.warn('Failed to parse _INIT_PARAM_', error)
    }
    sessionStorage.removeItem('_INIT_PARAM_')
  }

  const navigable = findFirstNavigableMenu(userStore, router, {
    priorityMenus,
    preferredMenuCodes: preferredCodes,
    preferredMenuIds: preferredIds
  })

  if (!navigable) {
    const fallback = ensureNavigableMenu(leaves[0], router)
    if (!fallback) {
      comm.alert('이동할 수 있는 메뉴를 찾을 수 없습니다.', '알림')
      return null
    }
    return { ...fallback, query }
  }

  return { ...navigable, query }
}

onMounted(() => {
  const resolved = resolveInitialMenu()
  if (!resolved || !resolved.destination) {
    return
  }

  if (
    /^(https?:)?\/\//i.test(resolved.destination) ||
    resolved.destination.startsWith('mailto:') ||
    resolved.destination.startsWith('tel:')
  ) {
    window.location.href = resolved.destination
    return
  }

  router.replace({ path: resolved.destination, query: resolved.query })
})
</script>
