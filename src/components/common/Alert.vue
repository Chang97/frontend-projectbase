<template>
  <Teleport to="body">
    <div v-if="alertStore.show" class="modal-mask">
      <div class="modal-container">
        <div class="modal-header">
          <!-- 일단 임시로 nbsp 처리 -->
          <div class="title">{{ alertStore.title||'Information' }}</div>

          <button class="btn-close" @click="close">X</button>
        </div>

        <div class="modal-body">
          <div v-html="msgStr" class="contents"></div>

          <div style="justify-content: center;" class="bottom-btn-wrap">
            <button class="btn" @click="close" ref="btnClose">확인</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useAlertStore } from '@/stores/alert'
import { ref, nextTick } from 'vue'

const alertStore = useAlertStore()
const msgStr = ref('')
const btnClose = ref(null)

// store 속성에 대한 watch
alertStore.$subscribe((mutation, state) => {
  if(mutation && mutation.payload && mutation.payload.msg) {
    let msgArr = mutation.payload.msg.split("\n")
    msgArr.forEach((str) => {
      msgStr.value += `<p class="text">${str}</p>`
    })
  }
  if(mutation && mutation.payload && mutation.payload.show) {
    nextTick().then(() => {
      btnClose.value?.focus(); // - [확인]에 Focus
    })
  }
})

function close() {
  alertStore.$reset()
  msgStr.value = ''
  btnClose.value?.blur(); // - [확인]에 Blur
}
</script>
