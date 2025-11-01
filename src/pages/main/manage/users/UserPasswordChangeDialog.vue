<template>
  <Dialog
    title="비밀번호 변경"
    :width="810"
    v-model="show"
    @close="close"
  >
    <div class="contents">
      <div class="form-wrap">
        <!-- <div class="line">
          <div class="item">
            <div class="name">현재 비밀번호</div>
            <div class="content">
              <input type="password" v-model="popupData.currentPassword" maxlength="20" autocomplete="current-password"/>
            </div>
          </div>
        </div> -->
        <div class="line">
          <div class="item">
            <div class="name">새 비밀번호</div>
            <div class="contents">
              <input type="password" v-model="popupData.newPassword" maxlength="20"/>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">새 비밀번호 확인</div>
            <div class="contents">
              <input type="password" v-model="popupData.checkNewPassword" maxlength="20"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-btn-wrap">
      <button type="button" @click="changePassword" class="btn">변경하기</button>
      <button type="button" @click="close" class="btn sub">닫기</button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, inject } from "vue"
import comm from "@/utils/comm"

const axios = inject('axios')
const popupData = ref({
  userId: '',
  currentPassword: '',
  newPassword: '',
  checkNewPassword: '',
})

defineExpose({
  open
})

const emit = defineEmits([
  'callback'
])

const show = ref(false)   // - Popup창의 Show/Hide

async function open(userId) {
  popupData.value.userId = userId
  show.value = true
}

// Popup Close
async function close() {
  show.value = false
  // - 값 초기화
  for (let data in popupData.value) {
    popupData.value[data] = ''
  }
}

// - [저장] 
async function changePassword() {
  if (!popupData.value.userId) {
    await comm.alert("대상 사용자를 선택하지 못했습니다.")
    return
  }
  if (!popupData.value.newPassword.trim()) {
    await comm.alert("새 비밀번호를 입력하세요.")
    return
  }
  if (!popupData.value.checkNewPassword.trim()) {
    await comm.alert("새 비밀번호 확인을 입력하세요.")
    return
  }
  if (popupData.value.newPassword.trim() !== popupData.value.checkNewPassword.trim()) {
    await comm.alert("새 비밀번호가 일치하지 않습니다.")
    return
  }
  // 유효성 체크 서버에서 함
  try {
    await axios.put(`/api/identity/users/${popupData.value.userId}/password`, {
      currentPassword: popupData.value.currentPassword?.trim() || null,
      newPassword: popupData.value.newPassword.trim()
    })
    await comm.alert('비밀번호가 변경되었습니다.')
    emit('callback')
    await close()
  } catch (err) {
    const message = err?.response?.data?.message ?? '비밀번호 변경 중 오류가 발생했습니다.'
    await comm.alert(message)
  }
}

</script>

<style scoped>
</style>
