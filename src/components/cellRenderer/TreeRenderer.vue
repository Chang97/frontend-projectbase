<template>
  <div :style="'padding-left: calc(' + (params.data.LV - 1) + ' * 20px)'">
    <a v-if="CanClick()" :class="'link' + color" @click="conditionalClick">
      <span :class="params.data.LV > 1 ? 'icon indent' : ''"></span>
      {{ params.value }}
    </a>
    <div v-else class="text-left">
      <span :class="params.data.LV > 1 ? 'icon indent' : ''"></span>
      {{ params.value }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  params: Object
})

const color = props.params.color ? ' ' + props.params.color : ''

function CanClick() {
  let rtn = false
  if(props.params.clickCond) {
    if(props.params.clickCond(props.params)) rtn = true
  } else {
    if(props.params.click) rtn = true
  }
  return rtn
}

function conditionalClick() {
  if(props.params.clickCond) {
    if(props.params.clickCond(props.params)) props.params.click(props.params)
  } else {
    props.params.click(props.params)
  }
}
</script>