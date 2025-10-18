<template>
  <Dialog
    title="사용자 정보 편집"
    :width="810"
    v-model="show"
    @close="close"
  >
    <div class="contents">
      <div class="form-wrap">
        <div class="line">
          <div class="item">
            <div class="name">사용자 ID</div>
            <div class="contents">
              <div class="flex-row gap-8">
                <input
                  type="text"
                  v-model="popupData.loginId"
                  maxlength="20"
                  :readonly="!isNew"
                  autocomplete="one-time-code"
                  ref="txtUserId"
                />
                <button
                  v-if="isNew"
                  type="button"
                  class="btn sub small"
                  @click="checkUserId"
                >
                  중복확인
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="line" v-if="isNew">
          <div class="item">
            <div class="name">초기 비밀번호</div>
            <div class="contents">
              <input
                type="password"
                v-model="popupData.userPassword"
                maxlength="20"
                autocomplete="one-time-code"
                ref="txtUserPassword"
              />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">부서</div>
            <div class="contents">
              <div class="flex-row space middle">
                <span>{{ popupData.orgName }}</span>
                <button type="button" class="btn func" @click="openOrgPop">
                  선택
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">이름</div>
            <div class="contents">
              <input
                type="text"
                v-model="popupData.userName"
                maxlength="100"
                ref="txtUserName"
              />
            </div>
          </div>
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select :items="useYnOptions" v-model="popupData.useYn" />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">직책</div>
            <div class="contents">
              <input type="text" v-model="popupData.pstnName" maxlength="200" />
            </div>
          </div>
          <div class="item">
            <div class="name">Email</div>
            <div class="contents">
              <input type="text" v-model="popupData.email" maxlength="200" />
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">권한</div>
            <div class="contents">
              <div class="flex-row wrap gap-10">
                <label
                  v-for="role in roleList"
                  :key="role.roleId"
                  class="checkbox-wrap"
                >
                  <input
                    type="checkbox"
                    :value="role.roleId"
                    v-model="selectedRoleIds"
                  />
                  <span>&nbsp;{{ role.roleName }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-btn-wrap">
      <button type="button" @click="openPop" class="btn sub" v-if="!isNew">비밀번호 변경</button>
      <button type="button" @click="saveUserInfo" class="btn">저장</button>
      <button type="button" @click="close" class="btn sub">닫기</button>
    </div>
  </Dialog>
  <UserPasswordChangeDialog ref="dialog"></UserPasswordChangeDialog>
</template>

<script setup>
import { computed, inject, nextTick, onMounted, ref, watch } from "vue"
import Select from "@/components/common/Select.vue"
import comm from "@/utils/comm"
import UserPasswordChangeDialog from "./UserPasswordChangeDialog.vue"

const axios = inject('axios')

const show = ref(false)
const popupData = ref(createEmptyUser())
const roleList = ref([])
const selectedRoleIds = ref([])
const useYnOptions = ref([])
const isIdValid = ref(false)

const txtUserId = ref(null)
const txtUserPassword = ref(null)
const txtUserName = ref(null)

const dialog = ref(null)
const dialogOrg = ref(null)

const isNew = computed(() => !popupData.value.userId)

const emit = defineEmits(['callback'])

defineExpose({
  open
})

onMounted(() => {
  loadRoles()
  loadUseYnOptions()
})

watch(() => popupData.value.loginId, (newVal, oldVal) => {
  if (isNew.value && newVal !== oldVal) {
    isIdValid.value = false
  }
})

function createEmptyUser() {
  return {
    userId: null,
    email: '',
    loginId: '',
    userPassword: '',
    userName: '',
    orgId: null,
    orgName: '',
    empNo: '',
    pstnName: '',
    tel: '',
    userStatusId: null,
    useYn: 'Y'
  }
}

async function loadRoles() {
  try {
    const { data } = await axios.get("/api/role")
    roleList.value = Array.isArray(data) ? data : []
  } catch (err) {
    roleList.value = []
  }
}

async function loadUseYnOptions() {
  try {
    useYnOptions.value = await comm.selectCodeList({ upperCode: 'YN', firstRow: '' })
  } catch (err) {
    useYnOptions.value = []
  }
}

async function open(params = {}) {
  if (!roleList.value.length) {
    await loadRoles()
  }
  if (!useYnOptions.value.length) {
    await loadUseYnOptions()
  }

  try {
    if (params?.data?.userId) {
      await loadUserDetail(params.data.userId)
    } else {
      popupData.value = createEmptyUser()
      selectedRoleIds.value = []
      isIdValid.value = false
    }
  } catch (err) {
    await comm.alert('사용자 정보를 불러오지 못했습니다.')
    return
  }

  show.value = true

  await nextTick(() => {
    if (isNew.value) {
      txtUserId.value?.focus()
    } else {
      txtUserName.value?.focus()
    }
  })
}

async function loadUserDetail(userId) {
  const { data } = await axios.get(`/api/users/${userId}`)
  popupData.value = {
    userId: data.userId,
    email: data.email ?? '',
    loginId: data.loginId ?? '',
    userPassword: '',
    userName: data.userName ?? '',
    orgId: data.orgId ?? null,
    orgName: data.orgName ?? '',
    empNo: data.empNo ?? '',
    pstnName: data.pstnName ?? '',
    tel: data.tel ?? '',
    userStatusId: data.userStatusId ?? null,
    useYn: data.useYn ? 'Y' : 'N'
  }
  selectedRoleIds.value = Array.isArray(data.roleIds) ? data.roleIds.map(id => Number(id)) : []
  isIdValid.value = true
}

async function close() {
  show.value = false
  popupData.value = createEmptyUser()
  selectedRoleIds.value = []
  isIdValid.value = false
}

async function saveUserInfo() {
  const loginId = popupData.value.loginId?.trim()
  if (!loginId) {
    await comm.alert('아이디는 필수값입니다.')
    txtUserId.value?.focus()
    return
  }
  popupData.value.loginId = loginId

  if (isNew.value && !isIdValid.value) {
    await comm.alert('아이디 중복체크를 해주세요.')
    txtUserId.value?.focus()
    return
  }

  const userName = popupData.value.userName?.trim()
  if (!userName) {
    await comm.alert('이름은 필수값입니다.')
    txtUserName.value?.focus()
    return
  }
  popupData.value.userName = userName

  const password = popupData.value.userPassword?.trim()
  if (isNew.value && !password) {
    await comm.alert('초기 비밀번호를 입력하세요.')
    txtUserPassword.value?.focus()
    return
  }

  const roleIds = Array.from(new Set(
    selectedRoleIds.value
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id))
  ))

  const payload = {
    email: popupData.value.email?.trim() || null,
    loginId,
    userName,
    orgId: popupData.value.orgId,
    empNo: popupData.value.empNo?.trim() || null,
    pstnName: popupData.value.pstnName?.trim() || null,
    tel: popupData.value.tel?.trim() || null,
    userStatusId: popupData.value.userStatusId,
    useYn: popupData.value.useYn === 'Y',
    roleIds
  }

  if (password) {
    payload.userPassword = password
  }

  try {
    if (isNew.value) {
      await axios.post('/api/users', payload)
    } else {
      await axios.put(`/api/users/${popupData.value.userId}`, payload)
    }

    await comm.alert('저장되었습니다.')
    emit('callback')
    close()
  } catch (err) {
    const message = err?.response?.data?.message ?? '저장 중 오류가 발생했습니다.'
    await comm.alert(message)
  }
}

async function checkUserId() {
  const loginId = popupData.value.loginId?.trim()
  if (!loginId) {
    await comm.alert('체크할 접속ID를 입력하세요.')
    return
  }

  try {
    const { data } = await axios.get('/api/users/check-login-id', {
      params: { loginId }
    })

    if (!data?.isUserIdValid) {
      await comm.alert('이미 존재하는 아이디입니다.')
      isIdValid.value = false
    } else {
      await comm.alert('사용 가능한 아이디입니다.')
      isIdValid.value = true
    }
  } catch (err) {
    const message = err?.response?.data?.message ?? '아이디 확인 중 오류가 발생했습니다.'
    await comm.alert(message)
  }
}

function openPop() {
  dialog.value.open(popupData.value.userId)
}

function openOrgPop() {
  dialogOrg.value?.open({})
}
</script>
