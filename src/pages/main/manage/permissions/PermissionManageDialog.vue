<template>
  <Dialog
    :title="popupTitle"
    :width="800"
    v-model="show"
    @close="close"
  >
    <div class="contents">
      <div class="form-wrap">
        <div class="line">
          <div class="item">
            <div class="name">권한코드</div>
            <div class="contents">
              <input v-if="isRegPage" type="text" v-model="popupData.permissionCode" maxlength="40" />
              <span v-else>{{ popupData.permissionCode }}</span>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">권한명</div>
            <div class="contents">
              <input type="text" v-model="popupData.permissionName" maxlength="40" />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select :items="useYnList" v-model="popupData.useYn" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-btn-wrap" id="writeBtn">
      <button type="button" @click="saveRole" class="btn">저장</button>
      <button type="button" @click="close" class="btn sub">닫기</button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import comm from '@/utils/comm'
import Dialog from '@/components/common/Dialog.vue'

const axios = inject('axios')

const emit = defineEmits(['callback'])
const show = ref(false)
const isRegPage = ref(true)

const useYnList = ref([])

const popupData = ref(createEmptyPopup())

const popupTitle = computed(() => (isRegPage.value ? '권한 등록' : '권한 수정'))

onMounted(async () => {
  useYnList.value = await comm.selectCodeList({ upperCode: 'YN', firstRow: '' })
})

function createEmptyPopup() {
  return {
    permissionId: null,
    permissionCode: null,
    permissionName: null,
    useYn: 'Y',
  }
}

async function open(avParams) {
  if (avParams && avParams.permissionId) {
    const response = await axios.get(`/api/authr/permissions/${avParams.permissionId}`)
    popupData.value = {
      permissionId: response.data.permissionId,
      permissionCode: response.data.permissionCode,
      permissionName: response.data.permissionName,
      useYn: response.data.useYn ? 'Y' : 'N',
    }
    isRegPage.value = false
  } else {
    popupData.value = createEmptyPopup()
    isRegPage.value = true
  }
  show.value = true
}

defineExpose({ open })

function close() {
  show.value = false
  popupData.value = createEmptyPopup()
  isRegPage.value = true
}

async function saveRole() {
  if (!popupData.value.permissionCode?.trim()) {
    comm.alert('권한코드는 필수 입력값입니다.')
    return
  }
  if (!popupData.value.permissionName?.trim()) {
    comm.alert('권한명은 필수 입력값입니다.')
    return
  }

  const payload = {
    permissionId: popupData.value.permissionId,
    permissionCode: popupData.value.permissionCode.trim(),
    permissionName: popupData.value.permissionName.trim(),
    useYn: popupData.value.useYn === true || popupData.value.useYn === 'Y',
  }

  if (popupData.value.permissionId) {
    await axios.put(`/api/authr/permissions/${popupData.value.permissionId}`, payload)
  } else {
    await axios.post('/api/authr/permissions', payload)
  }

  emit('callback')
  close()
}
</script>

<style scoped>
.permission-select .contents {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permission-summary {
  flex: 1;
  min-height: 32px;
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.4;
}

.permission-summary .placeholder {
  color: #999;
}
</style>
