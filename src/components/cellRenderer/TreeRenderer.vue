<template>
  <div :style="indentStyle">
    <a v-if="CanClick()" :class="'link' + color" @click="conditionalClick">
      <span :class="lvl > 0 ? 'icon indent' : ''"></span>
      {{ params.value }}
    </a>
    <div v-else class="text-left">
      <span :class="lvl > 0 ? 'icon indent' : ''"></span>
      {{ params.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  params: Object
})

const lvl = computed(() => {
  const raw = props.params?.data?.lvl
  return Number.isFinite(raw) ? raw : 0
})

const indentStyle = computed(() => `padding-left: calc(${lvl.value} * 20px)`) // lvl=0 → 0px
const color = props.params.color ? ' ' + props.params.color : ''

function CanClick() {
  if (props.params.clickCond) {
    return Boolean(props.params.clickCond(props.params))
  }
  return Boolean(props.params.click)
}

function conditionalClick() {
  if (props.params.clickCond) {
    if (props.params.clickCond(props.params)) {
      props.params.click(props.params)
    }
    return
  }
  props.params.click?.(props.params)
}
</script>
