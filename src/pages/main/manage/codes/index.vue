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
          <button type="button" class="btn" @click="save">저장</button>
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

  <!-- <MngSysCodePopup01 ref="dialog" @callback="callbackPopup"></MngSysCodePopup01> -->
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'
// import MngSysCodePopup01 from './MngSysCodePopup01.vue'
import GridArea from '@/components/common/GridArea.vue'
import comm from '@/utils/comm'
import LinkRenderer from '@/components/cellRenderer/LinkRenderer.vue'
import SearchBox from '@/components/common/SearchBox.vue'

const axios = inject('axios')

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
        let av_param = {
          data: JSON.parse(JSON.stringify(params.data))
        }
        fn_openDetail(av_param)
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
  { headerName: "수정 일시", field: "updateDt", width: 70, cellStyle: {"text-align": "center" }, },
  { headerName: "수정 ID", field: "updateId", width: 50, cellStyle: {"text-align": "center"}, },
])
// 그리드 데이터
const rowData = ref([])


onMounted(async () => {
  comboList.value.useYn = await comm.selectCodeList({upperCode: 'YN', firstRow: '전체'})
  console.log("🚀 ~ comboList.value.useYn:", comboList.value.useYn)
  
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

  const params = {}
  if (cond.value.codeName && cond.value.codeName.trim().length > 0) {
    params.codeName = cond.value.codeName.trim()
  }
  if (cond.value.useYn) {
    params.useYn = cond.value.useYn
  }

  await axios.get('/api/codes', {
    params
  }).then(res => {
    console.log("🚀 ~ selectList ~ res:", res)
    rowData.value = (res.data || []).map(item => ({
      ...item,
      useYn: item.useYn === true ? 'Y' : item.useYn === false ? 'N' : item.useYn
    }))
  }).catch(res => {
    alert('error')
  })
}

// // 상세보기 : 그리드의 행 클릭
// function fn_openDetail(av_param) {
//   av_param.action = 'edit'
//   dialog.value.open(av_param)
// }

// // [등록] : 등록 팝업창 호출
// function openRegister() {
//   // - Popup Open : @callbackPopup = callbackPopup
//   // let action = 'create'
//   let av_param = {
//     'action': 'create'
//   }
//   dialog.value.open(av_param)
// }

// // Popup의 CallBack 처리 : Popup의 [등록], [저장] 등의 이벤트 처리 후에 창이 닫히면서 호출
// function callbackPopup(params) {
//   let editData = params.data

//   if (params.action === 'C') {
//     comm.agGridAddRows(
//       rowData.value,
//       grdListTable.value,
//       editData,
//       'prepand'
//     )
//   } else {
//     let updateRow = []
    
//     updateRow.push(editData)
    
//     if(updateRow.length > 0) {
//       updateRow.forEach(row => {
//         comm.agGridUpdateRow(
//           rowData.value,
//           grdListTable.value,
//           row
//         )
//       })
//     }
//   }
// }

</script>
