import { ref, computed } from "vue"
import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const route = useRoute()

  const id = ref('')
  const name = ref('')
  const authorCd = ref('')
  const orgCd = ref('')
  const orgNm = ref('')
  const menuList = ref([])
  const leafMenuList = ref([])
  const svcMode = ref('')
  const lastLoginDate = ref('')
  const lastLoginIp = ref('')

  function $reset() {
    id.value = ''
    name.value = ''
    authorCd.value = ''
    orgCd.value = ''
    orgNm.value = ''
    menuList.value = []
    leafMenuList.value = []
    svcMode.value = ''
    lastLoginDate.value = ''
    lastLoginIp.value = ''
  }

  return {
    id, 
    name, 
    authorCd, 
    orgCd, 
    orgNm, 
    menuList, 
    leafMenuList,
    svcMode,
    lastLoginDate,
    lastLoginIp,
    
    $reset, 
  
  }
}
, { // - Options 설정
  persist : {
    enabled : true,
    strategies: [
      {
        key: 'user',
        storage: sessionStorage,
      },
    ],
  },
})