<template>
  <div style="text-align: center;">
    <pt-select :items="params.comboList.items" v-model="params.data[params.colDef.field]"></pt-select>
  </div>
</template>

<script setup>
import PtSelect from "@/components/common/PtSelect.vue";
const props = defineProps({
  params: Object
})
</script>