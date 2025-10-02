<template>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const firstPage = import.meta.env.VITE_first_page || '/login'

onBeforeMount(() => {
  router.replace({ path: firstPage })
})
</script>
