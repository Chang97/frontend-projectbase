import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', () => {
  const activeRequests = ref(0)
  const isLoading = computed(() => activeRequests.value > 0)

  const startLoading = () => {
    activeRequests.value += 1
  }

  const stopLoading = () => {
    activeRequests.value = Math.max(0, activeRequests.value - 1)
  }

  function $reset() {
    activeRequests.value = 0
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    $reset
  }
})
