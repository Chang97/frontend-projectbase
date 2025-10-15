import { ref } from "vue"
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false)

  function $reset() {
    isLoading.value = false
  }

  return { isLoading, $reset }
})