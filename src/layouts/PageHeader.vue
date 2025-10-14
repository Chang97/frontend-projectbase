<template>
  <div class="page-header">
    <div class="page-title-wrap">
      <div class="title-area">
        <div id="page-title" class="page-title">{{ currentTitle }}</div>
      </div>
      <nav v-if="breadcrumbs.length" class="breadcrumbs">
        <span
          v-for="(item, index) in breadcrumbs"
          :key="item.menuId ?? index"
          class="breadcrumb-item"
        >
          <span>{{ item.menuName }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="divider">›</span>
        </span>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const findBreadcrumbs = (nodes, targetPath, parents = []) => {
  for (const node of nodes) {
    const nextParents = [...parents, node]
    if (node.url && node.url === targetPath) {
      return nextParents
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findBreadcrumbs(node.children, targetPath, nextParents)
      if (found) {
        return found
      }
    }
  }
  return null
}

const breadcrumbs = computed(() => {
  const tree = userStore.menuTree ?? []
  if (!tree.length) {
    return []
  }
  const chain = findBreadcrumbs(tree, route.path)
  return chain ?? []
})

const currentTitle = computed(() => {
  if (!breadcrumbs.value.length) {
    return ''
  }
  return breadcrumbs.value[breadcrumbs.value.length - 1].menuName ?? ''
})
</script>

<style scoped>
.page-header {
  padding: 16px 24px 0;
}

.page-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  color: var(--black-02);
  font-size: 20px;
  font-weight: 700;
}

.breadcrumbs {
  display: flex;
  gap: 8px;
  color: var(--gray-03);
  font-size: 12px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.divider {
  color: var(--border-color);
}
</style>
