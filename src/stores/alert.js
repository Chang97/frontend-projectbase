import { ref } from "vue"
import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', () => {
  const show = ref(false)
  const title = ref('')
  const msg = ref('')

  function $reset() {
    show.value = false
    title.value = ''
    msg.value = ''
  }

  return { show, title, msg, $reset }
})