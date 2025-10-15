<template>
  <JSXTemplate :params="params"></JSXTemplate>
</template>

<script setup>
const props = defineProps({
  params: Object
})

const JSXTemplate = props.params.JSXTemplate
</script>