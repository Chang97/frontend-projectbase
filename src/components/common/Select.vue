<template>
  <select v-model="modelValue" 
    style="text-overflow: ellipsis;"
    @change="onChange" 
    @blur="blur" 
    ref="selectObj" 
    @click="$event => {
      $event.stopPropagation()
    }">
    <option v-for="item in items" :key="item" :value="item[code]">
      {{ item[name] }}
    </option>
  </select>
</template>

<script setup>
import { computed, ref } from 'vue'

const selectObj = ref(null)

defineExpose({
  focus
})

const emit = defineEmits([
  'update:modelValue',
  'update:nameValue',
  'blur',
  'update:selectedValue'
])

const props = defineProps({
  modelValue: null,
  nameValue: null,
  items: Array,
  code: {
    type: String,
    default: 'code'
  },
  name: {
    type: String,
    default: 'codeName'
  },
})

const modelValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)

    let options = [...selectObj.value.options]
    let selectedOptions = options.filter(option => option.selected)

    let selectedValue = {}
    selectedValue[props.code] = value
    selectedValue[props.name] = selectedOptions[0].innerText
    emit('update:selectedValue', selectedValue)
  }
})

const nameValue = computed({
  get() {
    return props.nameValue
  },
  set(value) {
    emit('update:nameValue', value)
  }
})

function onChange(event) {
  let options = [...event.target.options]
  let selectedOptions = options.filter(option => option.selected)
  // multi select 아니기 때문에 0번째만 고르면 됨 (수정해야될 수도 있음)
  nameValue.value = selectedOptions[0].innerText
}

function blur(event) {
  emit('blur', event)
}

function focus() {
  selectObj.value?.focus()
}
</script>