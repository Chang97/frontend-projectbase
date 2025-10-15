<template>
  <router-view />

  <alert></alert>
  <confirm></confirm>
  <loading></loading>
</template>

<script setup>
import { provide } from 'vue'
import axios from '@/plugins/axios'
import Alert from "@/components/common/Alert.vue"
import Confirm from "@/components/common/Confirm.vue"
import Loading from "@/components/common/Loading.vue"

provide('axios', axios)
</script>
