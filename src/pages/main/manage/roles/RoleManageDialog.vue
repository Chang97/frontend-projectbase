<template>
  <Dialog
    :title="popupTitle"
    :width="800"
    v-model="show"
    @close="close"
  >
    <!-- Table 영역 -->
    <div class="contents">
      <div class="form-wrap">
        <div class="line">
          <div class="item">
            <div class="name">역할명</div>
            <div class="contents">
              <input type="text" v-model="popupData.roleName" maxlength="40"/>
            </div>
          </div>
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select :items="useYnList" v-model="popupData.useYn"></Select>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Table 영역 -->
    <div class="bottom-btn-wrap" id="writeBtn">
      <button type="button" @click="saveAuthInfo" class="btn">저장</button>
      <button type="button" @click="close" class="btn sub">닫기</button>
    </div>

  </Dialog>
</template>

<script setup>
import { ref, onMounted, inject, nextTick } from "vue"
import comm from "@/utils/comm"
import Dialog from "@/components/common/Dialog.vue";
const axios = inject('axios')

defineExpose({
  open
})

const emit = defineEmits([
  'callback'
])

// - Popup창의 Show/Hide
const show = ref(false)   

// 사용여부 selectbox
const useYnList = ref([])

const popupData = ref({
  roleId   : null,
  roleName : null,
  useYn    : null,
})

onMounted(async () => {
  useYnList.value = await comm.selectCodeList({ upperCode:'YN', firstRow: '' })
})

const popupTitle = ref('')

// Popup Open
async function open(av_params) {
  if (av_params) {
    const response = await axios.get(`/api/role/${av_params.roleId}`, {
      params: av_params
    })

    response.data.useYn = response.data.useYn ? 'Y' : 'N'
    popupData.value = response.data
  } else {
    popupData.value.useYn = 'Y'
  }

  show.value = true
}

// Popup Close
async function close() {
  show.value = false
  // - 값 초기화
  for (let key in popupData.value) {
    popupData.value[key] = null
  }
}

async function saveAuthInfo() {
  // 1. 파라메터 체크
  if (!popupData.value.roleName) {
    comm.alert('역할명은 필수 입력값입니다.') 
    return  
  }

  const payload = {
    roleName: popupData.value.roleName?.trim() ?? '',
    useYn: popupData.value.useYn === true || popupData.value.useYn === 'Y'
  }
  console.log(payload)
  if (popupData.value.roleId) {
    await axios.put(`/api/role/${popupData.value.roleId}`, payload)
  } else {
    await axios.post(`/api/role`, payload)
  }
  
  emit('callback')
  close()

}


</script>

<style scoped>
.selected{
  background-image: url("/src/assets/images/selected.png") !important;
  /* background-color: rgb(255, 255, 220) !important;*/
}

.user-select {
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}

.require-input {
  background-color: rgba(230, 255, 255);
}
</style>

