<template>
  <div>
    <header>
      <router-link to="/home" class="logo-area">
        <div class="text">공통 관리 시스템</div>
      </router-link>
      <div class="login-area">
        <div :title="userStore.id" class="id">
          <span>{{ userStore.userName + " | " + userStore.loginId }}</span>
        </div>
        <button @click="logout" type="button" class="icon logout"></button>
      </div>
    </header>
    <nav :class="{ folded: isFolded }">
      <div class="nav-inner">
        <ul class="menulist">
          <li v-for="lv1 in menuList" :key="lv1.menuCode ?? lv1.menuId ?? lv1" :class="'dep-1' + (isActivate(lv1) ? ' open' : '')">
            <a href="javascript:;" role="button" class="link" @click.prevent="handleMenuClick(lv1)">
              <span :class="'icon ' + lv1.menuCode"></span>
              <span>{{ lv1.menuName }}</span>
            </a>

            <TransitionGroup name="slide">
            <ul v-if="Array.isArray(lv1.children) && lv1.children.length" class="menulist" :style="{display: isActivate(lv1) ? 'block' : 'none'}" :key="lv1.menuCode + isActivate(lv1)">
              <li v-for="lv2 in lv1.children" :key="lv2.menuCode ?? lv2.menuId ?? lv2" :class="'dep-2' + (isActivate(lv2) ? ' open' : '')">
                <a href="javascript:;" role="button" class="link" @click.prevent="handleMenuClick(lv2)">
                  <span>{{ lv2.menuName }}</span>
                </a>

                <TransitionGroup name="slide">
                <ul v-if="Array.isArray(lv2.children) && lv2.children.length" class="menulist" :style="{display: isActivate(lv2) ? 'block' : 'none'}" :key="lv2.menuCode + isActivate(lv2)">
                  <li v-for="lv3 in lv2.children" :key="lv3.menuCode ?? lv3.menuId ?? lv3" :class="'dep-3' + (isActivate(lv3) ? ' open' : '')">
                    <a href="javascript:;" role="button" class="link" @click.prevent="handleMenuClick(lv3)"><span>{{ lv3.menuName }}</span></a>
                  </li>
                </ul>
                </TransitionGroup>
              </li>
            </ul>
            </TransitionGroup>
          </li>
        </ul>
        <div class="bottom-area">
          <button @click="toggleFolded" type="button" class="menu">
            <span class="icon lnb-toggle"></span>
            <span>Close Menu</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, watch, onMounted, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

// vue app에 provide 된 axios object, inject로 가져오기
const axios = inject('axios')
const router = useRouter()

const userStore = useUserStore()
const { menuList, path: storePath } = storeToRefs(userStore)
const path = ref([])
const clickedPath = ref([])

onMounted(() => {
  if (Array.isArray(storePath.value) && storePath.value.length && path.value.length === 0) {
    path.value = [...storePath.value]
  }
})

watch(
  storePath,
  (newPath) => {
    if (Array.isArray(newPath) && newPath.length) {
      path.value = [...newPath]
    } else {
      path.value = []
    }
    clickedPath.value = []
  },
  { deep: true }
)

function isActivate(menu) {
  const activeTrail = clickedPath.value.length ? clickedPath.value : path.value
  if (!Array.isArray(activeTrail) || !activeTrail.length) {
    return false
  }
  return activeTrail.some((pathItem) => pathItem?.menuCode === menu?.menuCode)
}

function resolveMenuPath(targetMenu) {
  if (!targetMenu || !Array.isArray(menuList.value)) {
    return []
  }
  const trail = []
  const dfs = (nodes) => {
    for (const node of nodes) {
      trail.push(node)
      if (node === targetMenu || node?.menuCode === targetMenu?.menuCode) {
        return true
      }
      if (Array.isArray(node?.children) && node.children.length > 0) {
        if (dfs(node.children)) {
          return true
        }
      }
      trail.pop()
    }
    return false
  }

  const found = dfs(menuList.value)
  return found ? [...trail] : []
}

const hasChildren = (menu) => Array.isArray(menu?.children) && menu.children.length > 0

function handleMenuClick(menu) {
  const menuPath = resolveMenuPath(menu)
  if (!menuPath.length) {
    clickedPath.value = []
    return
  }

  if (hasChildren(menu)) {
    const alreadyOpen =
      clickedPath.value.length === menuPath.length &&
      clickedPath.value[clickedPath.value.length - 1]?.menuCode === menuPath[menuPath.length - 1]?.menuCode
    clickedPath.value = alreadyOpen ? [] : menuPath
    return
  }

  clickedPath.value = menuPath

  if (menu?.url && router.currentRoute.value?.path !== menu.url) {
    router.push({ path: menu.url }).catch(() => {})
  }
}

// 로그아웃 처리
async function logout() {
  try {
    await axios.post('/api/auth/logout')
  } finally {
    userStore.logout() // 또는 기존에 쓰던 $reset()
    router.replace({ path: '/login' })
  }
}

// LNB folded 토글
const isFolded = ref(false)

function toggleFolded() {
  isFolded.value = !isFolded.value
}


</script>

<style scoped>

</style>
