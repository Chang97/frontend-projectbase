<template>
  <Teleport to="body">
    <div v-if="loadingStore.isLoading" class="loading-mask">
      <img style="width: 40px;" src="/src/assets/images/loading.svg" />
    </div>
  </Teleport>
</template>

<script setup>
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
</script>

<style scoped>
  .loading-mask {
    top: 0;
    left: 0;
    position: fixed;
    z-index: 9900;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>