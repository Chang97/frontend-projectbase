<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-mask" @click="close($event, 'mask-area')"
      :style="{ zIndex: 9800 + (zIndex || 0) }"
      @dragover="(event) => event.preventDefault()"
    >
      <!-- TODO modal container div는 dialog tag로 변경 검토해봐야 함 -->
      <div class="modal-container" :style="containerStyle" ref="modalContainer">
        <div class="modal-header"
          @dragstart="($event) => {if(draggable) dragstart($event)}"
          @drag="($event) => {if(draggable) drag($event)}"
          @dragend="($event) => {if(draggable) dragend($event)}"
          :draggable="draggable"
        >
          <div class="title">{{ title + ' (Pop-up)' }}</div>
          <button class="btn-close" @click="close($event, 'close-btn')">X</button>
        </div>

        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

defineExpose({
  open,
  close,
})

const emit = defineEmits([
  'update:modelValue',
  'close'
])

const props = defineProps({
  title: {
    type: String,
    default: 'Title'
  },
  width: Number,
  modelValue: Boolean,
  top: Number,
  left: Number,
  backgroundClose: String,
  zIndex: Number,
  draggable: {
    type: Boolean,
    default: true
  },
})

const x = ref()
const y = ref()
const modalContainer = ref()

const modelValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    if(value) {
      x.value = props.left
      y.value = props.top
    }
    emit('update:modelValue', value)
  }
})

const containerStyle = computed(() => {
  let rtn = {
    position: 'relative',
    zIndex: 9801 + (props.zIndex || 0)
  }
  if(props.width != null) rtn.width = props.width + 'px'
  if(y.value != null) {
    rtn.top = y.value + 'px'
    rtn.position = 'absolute'
  }
  if(x.value != null) {
    rtn.left = x.value + 'px'
    rtn.position = 'absolute'
  }
  return rtn
})

function close(event, eventFrom) {
  if(event != null) event.stopPropagation() // event 버블링 방지

  if(eventFrom == 'mask-area') {
    if(props.backgroundClose) {
      closeFunc()
    }
  } else if (eventFrom == 'close-btn') {
    // TODO 혹시 다른 동작이 있을까봐 분기처리 해둠
    closeFunc()
  } else {
    closeFunc()
  }
}

function closeFunc() {
  x.value = null
  y.value = null
  emit('close')
}

let xMod = 0;
let yMod = 0;
function dragstart(event) {
  xMod = event.offsetX
  yMod = event.offsetY
  event.dataTransfer.effectAllowed = "move"
}

function drag(event) {
  // nothing to do
}

function dragend(event) {
  x.value = Math.min(Math.max(0, event.clientX - xMod), window.innerWidth - event.target.clientWidth)
  y.value = Math.min(Math.max(0, event.clientY - yMod), window.innerHeight - modalContainer.value.clientHeight)
}
</script>