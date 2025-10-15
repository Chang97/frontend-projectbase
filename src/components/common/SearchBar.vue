<template>
  <div class="retrieve-area" @keyup.enter="$emit('search')">
    <slot />
  </div>
</template>

<script setup>
defineEmits(['search'])
</script>
