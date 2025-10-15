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
            <a
              v-if="hasChildren(lv1)"
              href="javascript:;"
              role="button"
              class="link"
              @click.prevent="handleBranchClick(lv1)"
            >
              <span :class="'icon ' + lv1.menuCode"></span>
              <span>{{ lv1.menuName }}</span>
            </a>
            <router-link
              v-else
              class="link"
              :to="resolveMenuTarget(lv1)"
              @click="handleLeafClick(lv1)"
            >
              <span :class="'icon ' + lv1.menuCode"></span>
              <span>{{ lv1.menuName }}</span>
            </router-link>

            <TransitionGroup name="slide">
            <ul v-if="Array.isArray(lv1.children) && lv1.children.length" class="menulist" :style="{display: isActivate(lv1) ? 'block' : 'none'}" :key="lv1.menuCode + isActivate(lv1)">
              <li v-for="lv2 in lv1.children" :key="lv2.menuCode ?? lv2.menuId ?? lv2" :class="'dep-2' + (isActivate(lv2) ? ' open' : '')">
                <a
                  v-if="hasChildren(lv2)"
                  href="javascript:;"
                  role="button"
                  class="link"
                  @click.prevent="handleBranchClick(lv2)"
                >
                  <span>{{ lv2.menuName }}</span>
                </a>
                <router-link
                  v-else
                  class="link"
                  :to="resolveMenuTarget(lv2)"
                  @click="handleLeafClick(lv2)"
                >
                  <span>{{ lv2.menuName }}</span>
                </router-link>

                <TransitionGroup name="slide">
                <ul v-if="Array.isArray(lv2.children) && lv2.children.length" class="menulist" :style="{display: isActivate(lv2) ? 'block' : 'none'}" :key="lv2.menuCode + isActivate(lv2)">
                  <li v-for="lv3 in lv2.children" :key="lv3.menuCode ?? lv3.menuId ?? lv3" :class="'dep-3' + (isActivate(lv3) ? ' open' : '')">
                    <router-link
                      v-if="!hasChildren(lv3)"
                      class="link"
                      :to="resolveMenuTarget(lv3)"
                      @click="handleLeafClick(lv3)"
                    >
                      <span>{{ lv3.menuName }}</span>
                    </router-link>
                    <a
                      v-else
                      href="javascript:;"
                      role="button"
                      class="link"
                      @click.prevent="handleBranchClick(lv3)"
                    >
                      <span>{{ lv3.menuName }}</span>
                    </a>
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
import { useRouter, useRoute } from 'vue-router'
import { ref, watch, onMounted, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { resolveMenuTarget as resolveTarget } from '@/utils/menu'

// vue app에 provide 된 axios object, inject로 가져오기
const axios = inject('axios')
const router = useRouter()
const route = useRoute()

const userStore = useUserStore()
const { menuList, path: storePath } = storeToRefs(userStore)
const path = ref([])
const clickedPath = ref([])

const applyStorePath = () => {
  if (Array.isArray(storePath.value) && storePath.value.length) {
    path.value = [...storePath.value]
    clickedPath.value = [...storePath.value]
  }
}

const syncActiveTrail = (targetPath) => {
  if (!targetPath || !Array.isArray(menuList.value) || !menuList.value.length) {
    return
  }
  userStore.resolveCurrentMenu?.(targetPath)
  applyStorePath()
}

onMounted(() => {
  applyStorePath()
  const currentPath = route.fullPath || route.path || ''
  if (currentPath) {
    syncActiveTrail(currentPath)
  }
})

watch(
  storePath,
  (newPath) => {
    if (Array.isArray(newPath) && newPath.length) {
      applyStorePath()
    } else {
      path.value = []
      clickedPath.value = []
    }
  },
  { deep: true }
)

watch(
  () => route.fullPath,
  (newPath) => {
    if (newPath) {
      syncActiveTrail(newPath)
    }
  }
)

watch(
  menuList,
  (list) => {
    if (Array.isArray(list) && list.length) {
      const currentPath = route.fullPath || route.path || ''
      if (currentPath) {
        syncActiveTrail(currentPath)
      } else {
        applyStorePath()
      }
    }
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

const resolveMenuTarget = (menu) => resolveTarget(menu, router)

function handleBranchClick(menu) {
  const menuPath = resolveMenuPath(menu)
  if (!menuPath.length) {
    clickedPath.value = []
    return
  }

  const alreadyOpen =
    clickedPath.value.length === menuPath.length &&
    clickedPath.value[clickedPath.value.length - 1]?.menuCode === menuPath[menuPath.length - 1]?.menuCode
  clickedPath.value = alreadyOpen ? menuPath.slice(0, -1) : menuPath
}

function handleLeafClick(menu) {
  const menuPath = resolveMenuPath(menu)
  clickedPath.value = menuPath.length ? menuPath : []

  const target = resolveMenuTarget(menu)
  if (target) {
    userStore.resolveCurrentMenu?.(target)
  } else if (menuPath.length) {
    storePath.value = menuPath
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
