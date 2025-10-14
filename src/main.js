import { createApp, ref } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import '@/assets/css/common.css'

import { AgGridVue } from "ag-grid-vue3";  // the AG Grid Vue Component

import agGrid from '@/plugins/agGrid'

const pinia = createPinia()
pinia.use(piniaPersist)
const app = createApp(App)

AgGridVue.props.gridOptions.default = () => {
  return {...agGrid}
}

app.use(router)
  .use(pinia)
  .component("AgGridVue", AgGridVue)

app.mount('#app')

// input type date min max 입력
window.addEventListener('click', (event) => {
   if (event.target.nodeName === "INPUT") {
      if (event.target.type === "date") {
         if(!event.target.max) {
            event.target.max = '9999-12-31'
         }
      }
      if (event.target.type === "month") {
         if(!event.target.max) {
            event.target.max = '9999-12'
         }
      }
   }
}, true)
