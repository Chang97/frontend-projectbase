<template>
  <div class="input-area flex-row" style="justify-content: center; height: 100%; cursor: pointer;" @click="click">
    <span class="hist-icon"></span>
  </div>
</template>

<script setup>
import { useHistoryStore } from '@/stores/history'
import { inject } from "vue"
import comm from "@/utils/comm"

// vue app에 provide 된 axios object, inject로 가져오기
const axios = inject('axios')

const historyStore = useHistoryStore()

const props = defineProps({
  params: Object
})

async function click(event) {
  event.stopPropagation()

  const { url } = props.params

  const result = await axios({
    url,
    method: 'get',
    params: props.params.queryParams || props.params.data
  })

  if (!result?.data?.list?.length) {
    comm.alert(`변경이력이 없습니다.`);
    return;
  }

  historyStore.$patch({
    show: true,
    data: result.data.list
  })
}
</script>
