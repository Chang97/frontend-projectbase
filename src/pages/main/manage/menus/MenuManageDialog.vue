<template>
  <Dialog
    :title="popupTitle"
    :width="810"
    v-model="show"
    @close="close"
  >
    <!-- Form 영역 -->
    <div class="contents">
      <div class="form-wrap">
        <div class="line">
          <div class="item">
            <div class="name">메뉴명</div>
            <div class="contents">
              <input type="text" v-model="popupData.menuName" maxlength="200" />
            </div>
          </div>
          <div class="item">
            <div class="name">상위메뉴</div>
            <div class="contents">
              <Select v-bind="optionUpMenuCd" v-model="popupData.upperMenuId" />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="name">메뉴설명</div>
          <div class="contents">
            <textarea v-model="popupData.menuCn" maxlength="400"></textarea>
          </div>
        </div>
        <div class="line">
          <div class="name">메뉴 코드</div>
          <div class="contents">
            <input :disabled="!isRegPage" type="text" v-model="popupData.menuCode" maxlength="40" />
          </div>
          <div class="name">URL</div>
          <div class="contents">
            <input type="text" v-model="popupData.url" maxlength="300" />
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select v-bind="optionUseYn" v-model="popupData.useYn" />
            </div>
          </div>
          <div class="item">
            <div class="name">순서</div>
            <div class="contents">
              <input type="number" v-model="popupData.srt" maxlength="20" />
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
      <button type="button" @click="saveMenuInfo" class="btn">저장</button>
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
const isRegPage = ref(true)

const emit = defineEmits(['callback'])
const show = ref(false)

const optionUpMenuCd = ref({
  modelValue: '',
  items: [],
  code: 'menuId',
  name: 'menuName'
})

const optionUseYn = ref({
  modelValue: '',
  items: [],
  code: 'code',
  name: 'codeName'
})

const permissionList = ref([])
const selectedPermissionIds = ref([])
const permissionDialog = ref(null)

const popupData = ref(createEmptyPopup())

function createEmptyPopup() {
  return {
    lvl: null,
    menuCode: null,
    menuCn: null,
    menuName: null,
    path: null,
    srt: null,
    upperMenuId: null,
    url: null,
    useYn: 'Y',
    permissionIds: []
  }
}

const popupTitle = computed(() => (isRegPage.value ? '메뉴 등록' : '메뉴 수정'))

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
  await loadUpperMenus()
  await ensurePermissionList()
  optionUseYn.value.items = await comm.selectCodeList({ upperCode: 'YN', firstRow: '' })
})

async function loadUpperMenus() {
  const response = await axios.get('/api/menu')
  optionUpMenuCd.value.items = response.data ?? []
  optionUpMenuCd.value.items.unshift({ menuId: null, menuName: '미선택'})
  optionUpMenuCd.value.modelValue = optionUpMenuCd.value.items[0].menuId ?? ''
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
  if (avParams && avParams.menuId) {
    isRegPage.value = false
    const response = await axios.get(`/api/menu/${avParams.menuId}`)
    popupData.value = response.data ?? createEmptyPopup()
    popupData.value.useYn = popupData.value.useYn ? 'Y' : 'N'
    optionUpMenuCd.value.modelValue = popupData.value.upperMenuId ?? ''
    selectedPermissionIds.value = [...(popupData.value.permissionIds || [])].map(id => Number(id))
    popupData.value.permissionIds = [...selectedPermissionIds.value]
  } else {
    isRegPage.value = true
    popupData.value = createEmptyPopup()
    popupData.value.upperMenuId = null
    optionUpMenuCd.value.modelValue = ''
    selectedPermissionIds.value = []
    popupData.value.permissionIds = []
  }
  show.value = true
}

defineExpose({ open })

async function close() {
  show.value = false
  popupData.value = createEmptyPopup()
  optionUpMenuCd.value.modelValue = ''
  selectedPermissionIds.value = []
  popupData.value.permissionIds = []
  isRegPage.value = true
}

async function saveMenuInfo() {
  if (!popupData.value.menuCode?.trim()) {
    comm.alert('메뉴 코드는 필수값입니다')
    return
  }
  if (!popupData.value.menuName?.trim()) {
    comm.alert('메뉴 명은 필수값입니다')
    return
  }

  popupData.value.permissionIds = [...selectedPermissionIds.value]
  popupData.value.useYn = popupData.value.useYn === 'Y'
  if (isRegPage.value) {
    await axios.post('/api/menu', popupData.value)
  } else {
    await axios.put(`/api/menu/${popupData.value.menuId}`, popupData.value)
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
