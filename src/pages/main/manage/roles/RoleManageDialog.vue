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
            <div class="name">역할명</div>
            <div class="contents">
              <input type="text" v-model="popupData.roleName" maxlength="40" />
            </div>
          </div>
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select :items="useYnList" v-model="popupData.useYn" />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item permission-select">
            <div class="name">권한</div>
            <div class="contents">
              <div class="permission-summary">
                <span v-if="selectedPermissionNames">{{ selectedPermissionNames }}</span>
                <span v-else class="placeholder">선택된 권한이 없습니다.</span>
              </div>
              <button type="button" class="btn sub" @click="openPermissionDialog">권한 선택</button>
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

  <PermissionSelectDialog
    ref="permissionDialog"
    @confirm="handlePermissionConfirm"
  />
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import comm from '@/utils/comm'
import Dialog from '@/components/common/Dialog.vue'
import PermissionSelectDialog from '@/components/common/PermissionSelectDialog.vue'

const axios = inject('axios')

const emit = defineEmits(['callback'])
const show = ref(false)
const isRegPage = ref(true)

const useYnList = ref([])
const permissionList = ref([])
const selectedPermissionIds = ref([])
const permissionDialog = ref(null)

const popupData = ref(createEmptyPopup())

const popupTitle = computed(() => (isRegPage.value ? '역할 등록' : '역할 수정'))
const selectedPermissionNames = computed(() => {
  if (!selectedPermissionIds.value.length) {
    return ''
  }
  const map = new Map(permissionList.value.map(p => [p.permissionId, p.permissionName]))
  return selectedPermissionIds.value
    .map(id => map.get(id))
    .filter(Boolean)
    .join(', ')
})

onMounted(async () => {
  useYnList.value = await comm.selectCodeList({ upperCode: 'YN', firstRow: '' })
  await ensurePermissionList()
})

function createEmptyPopup() {
  return {
    roleId: null,
    roleName: null,
    useYn: 'Y',
    permissionIds: []
  }
}

async function ensurePermissionList() {
  if (permissionList.value.length) {
    return
  }
  const response = await axios.get('/api/permission')
  permissionList.value = response.data ?? []
}

async function openPermissionDialog() {
  await ensurePermissionList()
  permissionDialog.value?.open({
    permissions: permissionList.value,
    selectedIds: selectedPermissionIds.value
  })
}

function handlePermissionConfirm(ids) {
  selectedPermissionIds.value = ids.map(id => Number(id))
  popupData.value.permissionIds = [...selectedPermissionIds.value]
}

async function open(avParams) {
  await ensurePermissionList()
  if (avParams && avParams.roleId) {
    const response = await axios.get(`/api/role/${avParams.roleId}`)
    popupData.value = {
      roleId: response.data.roleId,
      roleName: response.data.roleName,
      useYn: response.data.useYn ? 'Y' : 'N',
      permissionIds: (response.data.permissionIds ?? []).map(id => Number(id))
    }
    selectedPermissionIds.value = [...(popupData.value.permissionIds || [])]
    isRegPage.value = false
  } else {
    popupData.value = createEmptyPopup()
    selectedPermissionIds.value = []
    isRegPage.value = true
  }
  show.value = true
}

defineExpose({ open })

function close() {
  show.value = false
  popupData.value = createEmptyPopup()
  selectedPermissionIds.value = []
  isRegPage.value = true
}

async function saveRole() {
  if (!popupData.value.roleName?.trim()) {
    comm.alert('역할명은 필수 입력값입니다.')
    return
  }

  const payload = {
    roleName: popupData.value.roleName.trim(),
    useYn: popupData.value.useYn === true || popupData.value.useYn === 'Y',
    permissionIds: selectedPermissionIds.value.map(id => Number(id))
  }

  if (popupData.value.roleId) {
    await axios.put(`/api/role/${popupData.value.roleId}`, payload)
  } else {
    await axios.post('/api/role', payload)
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
