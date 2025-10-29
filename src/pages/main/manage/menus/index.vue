<template>
    <div class="flex-item flex-column">

    <search-box 
      v-model="cond" 
      :condList="condList" 
      :comboList="comboList" 
      @search="search">
    </search-box>

    <div class="content">
      <GridArea :cnt="rowData.length">
        <template v-slot:buttons>
          <button type="button" class="btn" @click="openDetail()">등록</button>
        </template>
        <ag-grid-vue 
          style="width: 100%;"
          class="ag-theme-balham" 
          :columnDefs="columnDefs"
          :rowData="rowData"
          rowSelection='none'
          @firstDataRendered="comm.sizeColumnsToFit"
          @gridSizeChanged="comm.sizeColumnsToFit"
          @grid-ready="(params) => {
            grdListTable = params.api
          }"
          >
        </ag-grid-vue>
      </GridArea>
    </div>

  </div>

  <MenuManageDialog ref="dialog" @callback="search"></MenuManageDialog>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue';
import MenuManageDialog from './MenuManageDialog.vue';
import GridArea from '@/components/common/GridArea.vue';
import TreeRenderer from '@/components/cellRenderer/TreeRenderer.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import comm from "@/utils/comm"
const axios = inject('axios')

onMounted(async () => {
  
  comboList.value.useYn = await comm.selectCodeList({ upperCode:'YN' })
  search()
})

const condList = ref([
  [
    {condName: '메뉴명'   , condCode: 'menuName'       , type: 'text'},
    {condName: '사용 여부' , condCode: 'useYn'        , type: 'select', labelClass: 'small'}
  ]
])

// 조회 조건
const cond = ref({
  upperMenuCode : '',
  menuName       : '',
  useYn        : ''
})

// 검색조건 콤보 item list
const comboList = ref({
  upperMenuCode : [],
  useYn        : []
})

// - 그리드 설정
const grdListTable = ref()
const columnDefs = comm.makeTooltipField(ref([
  { headerName: '메뉴명', field: 'menuName', cellStyle: { 'text-align': 'left' }, width: 260, sortable:false,
    cellRenderer: TreeRenderer,
    cellRendererParams: {
      click: (params) => {
        let av_param = comm.objDeepCopy(params.data)
        openDetail(av_param)
      }
    }
  },
  { headerName: '메뉴 코드'    , field: 'menuCode'        , width: 80   , cellStyle: { 'text-align': 'left' } , },
  { headerName: '경로'    , field: 'path'        , width: 260  , cellStyle: { 'text-align': 'left' } },
  { headerName: 'URL'     , field: 'url'            , width: 150  , cellStyle: { 'text-align': 'left' } },
  { headerName: '사용 여부'    , field: 'useYn'         , width: 50   , cellStyle: { 'text-align': 'center' } , },
  { headerName: '순서'        , field: 'srt'            , width: 80   , cellStyle: { 'text-align': 'center' } , },
]))

const rowData = ref([])

// Popup 설정
const dialog = ref(null)


// 검색 기능
async function search() {
  selectList()
}

// [조회] : 그리드 조회
async function selectList() {
  rowData.value = []
  let payload = {
    menuName : cond.value.menuName,
    useYn    : ''
  }
  if (cond.value.useYn) payload.useYn = cond.value.useYn === 'Y'
  let response = await axios.get(`/api/menu`, { payload })
  rowData.value = response.data
}

// 상세보기 : 그리드의 행 클릭
function openDetail(params) {
  dialog.value.open(params)
}

</script>