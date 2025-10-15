<template>
  <div :class="params.type + '-wrap'" style="justify-content: center;">
    <label>
        <input :type="params.type" @click="params.click(params, $event)" :checked="params.value == 'Y'" :disabled="params.disabled == 'Y' ? true : false" />
        <!-- <span></span> -->
    </label>
  </div>
</template>

<script setup>
const props = defineProps({
  params: Object
})
</script>