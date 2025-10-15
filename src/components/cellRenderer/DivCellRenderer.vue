<template>
  <div 
    :class="(params.class == undefined || params.class == null || params.class == '' ? '' : params.class)"
    :style="(params.style == undefined || params.style == null || params.style == '' ? '' : params.style)"
  >
    {{ params.value }}
  </div>
</template>

<script setup>
const props = defineProps({
  params: Object
})

</script>