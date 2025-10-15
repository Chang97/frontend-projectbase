<template>
  <div class="input-area flex-row">
    <input type="text" placeholder="Comment 작성" v-model="params.data.CN" @input="onInput"/>
    <button type="button" class="btn sub" @click="params.click(params)">저장</button>
  </div>
</template>

<script setup>
const props = defineProps({
  params: Object
})

</script>