<template>
  <Teleport to="body">
    <div v-if="confirmStore.show" class="modal-mask">
      <div class="modal-container">
        <div class="modal-header">
          <!-- 일단 임시로 nbsp 처리 -->
          <div class="title">{{ confirmStore.title||'Information' }}</div>

          <button class="btn-close" @click="close">X</button>
        </div>

        <div class="modal-body">
          <div v-html="msgStr" class="contents"></div>

          <div style="justify-content: center;" class="bottom-btn-wrap">
            <button class="btn sub" @click="confirm" ref="btnConfirm">확인</button>
            <button class="btn" @click="close">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useConfirmStore } from '@/stores/confirm'
import { ref, nextTick } from 'vue'

const confirmStore = useConfirmStore()
const msgStr = ref('')
const btnConfirm = ref(null)

// store 속성에 대한 watch
confirmStore.$subscribe((mutation, state) => {
  if(mutation && mutation.payload && mutation.payload.msg) {
    let msgArr = mutation.payload.msg.split("\n")
    msgArr.forEach((str) => {
      msgStr.value += `<p class="text">${str}</p>`
    })
  }
  if(mutation && mutation.payload && mutation.payload.show) {
    nextTick().then(() => {
      btnConfirm.value?.focus(); // - [확인]에 Focus
    })
  }
})

function confirm() {
  confirmStore.$patch({
    show: false,
    result: true
  })

  msgStr.value = ''
}

function close() {
  confirmStore.$reset()
  msgStr.value = ''
  btnConfirm.value?.blur(); // - [확인]에 Blur
}
</script>
