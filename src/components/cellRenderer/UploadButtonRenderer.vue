<template>
  <div class="input-area flex-row">
    <button type="button" class="btn sub" @click="params.click(params)">업로드</button>
  </div>
</template>

<script setup>
const props = defineProps({
  params: Object
})

</script>