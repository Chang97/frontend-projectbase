<template>
  <div v-if="params.renderCond ? params.renderCond(params) : true" 
    :style="
      'padding-left: calc(' + (params.data.LV - 1) + ' * 20px);'
      + ' flex-column: row; display: flex; gap: 4px;'
    ">
    <button @click="toggleChildren" :class="['icon', _isOpen ? 'open' : 'fold']">{{ _isOpen ? "접기" : "펴기" }}</button>
    <a v-if="CanClick()" :class="'link' + color" @click="conditionalClick">
      {{ params.value }}
    </a>
    <div v-else class="text-left">
      {{ params.value }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
const props = defineProps({
  params: Object
})

const color = props.params.color ? ' ' + props.params.color : ''
const _isOpen = ref(false)

function CanClick() {
  let rtn = false
  if(props.params.clickCond) {
    if(props.params.clickCond(props.params)) rtn = true
  } else {
    if(props.params.click) rtn = true
  }
  return rtn
}

function conditionalClick(event) {
  event.stopPropagation()
  if(props.params.clickCond) {
    if(props.params.clickCond(props.params)) props.params.click(props.params)
  } else {
    props.params.click(props.params)
  }
}

function toggleChildren(event) {
  event.stopPropagation()
  if(!props.params.data.isOpen) {
    props.params.data.isOpen = true
    _isOpen.value = true
  } else {
    props.params.data.isOpen = false
    _isOpen.value = false
  }
  
  props.params.api.onFilterChanged()
}
</script>