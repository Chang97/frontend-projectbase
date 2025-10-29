<template>
  <div class="flex-item flex-column">
    <search-box 
      v-model="cond" 
      :condList="condList" 
      :comboList="comboList" 
      @search="search"
    >
    </search-box>

    <div class="content">
      <GridArea :selectedCnt="rowData.length">
        <template v-slot:buttons>
          <button type="button" class="btn" @click="openRegister">등록</button>
        </template>
        <ag-grid-vue
          style="width: 100%;"
          class="ag-theme-balham" 
          :columnDefs="columnDefs"
          :rowData="rowData" 
          rowSelection='none' 
          @firstDataRendered="comm.sizeColumnsToFit"
          @gridSizeChanged="comm.sizeColumnsToFit"
          @grid-ready="(params) => { grdListTable = params.api }"
        >
        </ag-grid-vue>
      </GridArea>
    </div>
  </div>
  <RoleManageDialog ref="dialog" @callback="search"></RoleManageDialog>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import GridArea from '@/components/common/GridArea.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import RoleManageDialog from './PermissionManageDialog.vue'
import comm from '@/utils/comm'
import LinkRenderer from '@/components/cellRenderer/LinkRenderer.vue'

const axios = inject('axios')


onMounted(async () => {
  comboList.value.useYn  = await comm.selectCodeList({ upperCode:'YN' })
  selectList()
})

// 조회 조건 설정
const condList = ref([
  [
    {condName: '권한명'   , condCode: 'permissionName'  , type: 'text'},
    {condName: '사용 여부', condCode: 'useYn'     , type: 'select', labelClass: 'small' }
  ]
])

// 조회 조건
const cond = ref({
  permissionName : '',
  useYn    : ''
})

// 검색조건 콤보 item list
const comboList = ref({
  useYn: []
})

// - 그리드 설정
const grdListTable = ref()
// - 그리드 컬럼 속성 정보
const columnDefs = comm.makeTooltipField(ref([
  { headerName: '권한코드', field: 'permissionCode', width: 200, minWidth: 200, cellStyle: { 'text-align': 'left' },
    cellRenderer: LinkRenderer,
    cellRendererParams: {
      click: (params) => {
        let av_param = JSON.parse(JSON.stringify(params.data))
        openDetail(av_param)
      }
    },
  },
  { headerName: '권한명', field: 'permissionName', width: 200, minWidth: 200, cellStyle: { 'text-align': 'left' },
    cellRenderer: LinkRenderer,
    cellRendererParams: {
      click: (params) => {
        let av_param = JSON.parse(JSON.stringify(params.data))
        openDetail(av_param)
      }
    },
  },
  { headerName: '사용 여부', field: 'useYn', width: 80, minWidth: 80, },
  { headerName: '수정 일시', field: 'updatedDt', width: 80, minWidth: 80, },
]))
const rowData = ref([])

// 검색 기능
async function search() {
  selectList()
}

// Popup 설정
const dialog = ref(null)

// 상세보기 : 그리드의 행 클릭
function openDetail(params) {
  dialog.value.open(params)
}

// 등록 : 등록버튼 클릭
function openRegister() {
  dialog.value.open()
}

// [조회] : 그리드 조회
async function selectList() {
  rowData.value = []
  let payload = {
    permissionName : cond.value.permissionName,
    useYn    : ''
  }
  if (cond.value.useYn) payload.useYn = cond.value.useYn === 'Y'
  let response = await axios.get('/api/permission', { payload })
  rowData.value = response.data
}

</script>