<template>
  <div :class="['flex-column list-container', className]">
    <div v-if="showHeader" class="flex-row space">
      <div class="content-count" style="gap: 8px;">
        <div v-if="title" class="label font-16">{{ title }}</div>
        <span v-if="cntText">
          Total <span class="bold">{{ selCntText }}{{ splitBar }}{{ cntText }}</span>
        </span>
        <span>{{ comment }}</span>
      </div>
      <div class="flex-row gap-8">
        <slot name="buttons" />
      </div>
    </div>
    <div class="grid-area">
      <slot />
    </div>
    <div class="flex-row space bottom">
      <div class="flex-row gap-8">
        <slot name="bottomButtons" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import comm from '@/utils/comm'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    default: ''
  },
  cnt: {
    type: Number,
    default: null
  },
  selectedCnt: {
    type: Number,
    default: null
  },
  className: {
    type: String,
    default: ''
  }
})

const slots = useSlots()

const cntText = computed(() => {
  if (props.cnt === null || props.cnt === undefined) {
    return ''
  }
  return comm.numberFormatter(props.cnt, {
    nullToZero: true,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })
})

const selCntText = computed(() => {
  if (props.selectedCnt === null || props.selectedCnt === undefined) {
    return ''
  }
  return comm.numberFormatter(props.selectedCnt, {
    nullToZero: true,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })
})

const splitBar = computed(() => (cntText.value && selCntText.value ? ' / ' : ''))

const showHeader = computed(() => {
  return Boolean(props.title || cntText.value || slots.buttons)
})
</script>
