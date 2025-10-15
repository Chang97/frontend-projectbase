<template>
  <div class="search-container">
    <div class="search-row">
      <slot />
      <div v-if="buttonsRow" class="btn-wrap">
        <button
          v-if="!hideSearch"
          type="button"
          class="btn"
          @click="$emit('search')"
        >
          조회
        </button>
        <button
          v-if="!hideClear"
          type="button"
          class="btn"
          @click="$emit('clear')"
        >
          Clear
        </button>
        <slot name="extraButtons" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  buttonsRow: {
    type: Boolean,
    default: false
  },
  hideSearch: {
    type: Boolean,
    default: false
  },
  hideClear: {
    type: Boolean,
    default: true
  }
})

defineEmits(['search', 'clear'])
</script>
