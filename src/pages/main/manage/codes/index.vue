<template>
  <div class="flex-item flex-column">
    <!-- 조회조건 영역 -->
    <search-box 
      v-model="cond"
      :condList="condList"
      :comboList="comboList"
      @search="search"
    >
    </search-box>
    <!-- 조회조건 영역 -->

    <!-- 그리드 영역 -->
    <div class="content">
      <GridArea :selectedCnt="rowData.length">
        <template v-slot:buttons>
          <button type="button" class="btn" @click="openRegister">등록</button>
        </template>
        <ag-grid-vue 
          class="ag-theme-balham"
          :columnDefs="columnDefs"
          :rowData="rowData"
          rowSelection='none'
          @firstDataRendered="comm.sizeColumnsToFit"
          @gridSizeChanged="comm.sizeColumnsToFit"
          @grid-ready="(params) => {
            grdListTable = params.api
          }">
        </ag-grid-vue>
      </GridArea>
    </div>
    <!-- 그리드 영역 -->
  </div>

  <MngSysCodePopup01 ref="dialog" @callback="search"></MngSysCodePopup01>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'
import MngSysCodePopup01 from './CodeManageDialog.vue'
import GridArea from '@/components/common/GridArea.vue'
import comm from '@/utils/comm'
import LinkRenderer from '@/components/cellRenderer/LinkRenderer.vue'
import SearchBox from '@/components/common/SearchBox.vue'

const axios = inject('axios')
const dialog = ref()

const condList = ref([
  [
    {condName: '코드', condCode: 'codeName', type: 'text'},
    {condName: '사용 여부', condCode: 'useYn', type: 'select', labelClass: 'small'},
  ]
])

// 조회 조건
const cond = ref({
  codeName     : '',
  useYn    : ''
})

// 검색조건 콤보 item list
const comboList = ref({
  useYn: [],
  // AUTHOR_CD: []
})

// - 그리드 설정
const grdListTable = ref()
// - 그리드 컬럼 속성 정보
const columnDefs = ref([
  { headerName: '코드'      , field: 'code'     , width: 60  , cellStyle: { 'text-align': 'left' }},
  { headerName: '코드명'    , field: 'codeName'  , width: 60  , cellStyle: { 'text-align': 'left' },
    cellRenderer: LinkRenderer,
    cellRendererParams: {
      click: (params) => {
        openDetail(JSON.parse(JSON.stringify(params.data)))
      }
    },
  },
  { headerName: '순서'      , field: 'srt'    , width: 40   , cellStyle: { 'text-align': 'center' }, },
  { headerName: '사용여부'  , field: 'useYn' , width: 30   , cellStyle: { 'text-align': 'center' } ,},
  { headerName: '경로'      , field: 'path'     , width: 140  , cellStyle: { 'text-align': 'left' } , },
  { headerName: '기타 1'     , field: 'etc1'   , width: 45   , cellStyle: { 'text-align': 'left' }, },
  { headerName: '기타 2'     , field: 'etc2'   , width: 45   , cellStyle: { 'text-align': 'left' }, },
  { headerName: '기타 3'     , field: 'etc3'   , width: 45   , cellStyle: { 'text-align': 'left' }, },
  { headerName: '기타 4'     , field: 'etc4'   , width: 45   , cellStyle: { 'text-align': 'left' }, },
])
// 그리드 데이터
const rowData = ref([])


onMounted(async () => {
  comboList.value.useYn = await comm.selectCodeList({upperCode: 'YN', firstRow: '전체'})
  search()
})

// 검색 기능
async function search() {
  selectList()
}

// [조회] : 그리드 조회
async function selectList() {
  // 1. 조회조건 체크

  rowData.value = []
  let payload = {
    codeName : cond.value.codeName,
    useYn    : ''
  }
  if (cond.value.useYn) payload.useYn = cond.value.useYn === 'Y'

  let response = await axios.get('/api/codes', { payload })
  rowData.value = (response.data || []).map(item => ({
    ...item,
    useYn: item.useYn === true ? 'Y' : item.useYn === false ? 'N' : item.useYn
  }))
}

// 상세보기 : 그리드의 행 클릭
function openDetail(payload) {
  let param = {
    action: 'update',
    id: payload.codeId
  }
  dialog.value.open(param)
}

// [등록] : 등록 팝업창 호출
function openRegister() {
  let param = {
    'action': 'create'
  }
  dialog.value.open(param)
}


</script>
