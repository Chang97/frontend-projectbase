<template>
  <router-view />
</template>

<script setup>
import { provide } from 'vue'
import axios from '@/plugins/axios'

provide('axios', axios)
</script>
