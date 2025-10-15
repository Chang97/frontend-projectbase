<template>
  <div style="text-align: center;">
    <select :items="params.comboList.items" v-model="params.data[params.colDef.field]"></select>
  </div>
</template>

<script setup>
import Select from "@/components/common/Select.vue";
const props = defineProps({
  params: Object
})
</script>