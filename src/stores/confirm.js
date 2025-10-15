import { ref } from "vue"
import { defineStore } from 'pinia'

export const useConfirmStore = defineStore('confirm', () => {
  const show = ref(false)
  const title = ref('')
  const msg = ref('')
  const result = ref(false)

  function $reset() {
    show.value = false
    title.value = ''
    msg.value = ''
    result.value = false
  }

  return { show, title, msg, result, $reset }
})