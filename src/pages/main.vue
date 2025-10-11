<template>
  <div class="body-wrap">
    <div class="flex-row">
    </div>
  </div>
</template>

<script setup>
import { inject, onBeforeMount, onMounted, ref } from "vue"
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const axios = inject('axios')
const router = useRouter()
const userStore = useUserStore()

</script>

<style scoped>
.flex-row {
  padding-top: 40px;
}
</style>
