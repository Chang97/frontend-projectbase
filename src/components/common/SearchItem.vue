<template>
  <div :class="wrapperClasses">
    <div class="label">{{ label || '' }}</div>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  wrapperClass: {
    type: String,
    default: ''
  }
})

const wrapperClasses = computed(() => {
  const classes = ['input-area']
  if (props.wrapperClass) {
    classes.push(props.wrapperClass)
  }
  return classes
})
</script>
