<template>
  <div class="body-wrap">
    <div class="flex-row">
      <LNB/>
      <div class="flex-item content-box">
        <PageHeader></PageHeader>
        <router-view/>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/layouts/PageHeader.vue'
import LNB from '@/layouts/LNB.vue'
import { inject, onBeforeMount, onMounted, ref } from "vue"
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

</script>

<style scoped>
.flex-row {
  padding-top: 40px;
}
</style>
