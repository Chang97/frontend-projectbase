<template>
  <div class="flex-item flex-column">

    <search-box
        v-model="cond"
        :condList="condList"
        :comboList="comboList"
        @search="search">
    </search-box>

    <div class="content">
      <GridArea :selectedCnt="rowData.length">
        <template v-slot:buttons>
<!--          <button type="button" class="btn excel" @click="downloadTemplate"><span class="icon excel"></span>템플릿</button>-->
<!--          <button type="button" class="btn excel" @click="uploadExcel"><span class="icon excel"></span>업로드</button>-->
<!--          <button type="button" class="btn excel" @click="downloadExcel"><span class="icon excel"></span>다운로드</button>-->
<!--          <button type="button" class="btn" @click="sendMail">메일발송</button>-->
          <!-- <button type="button" class="btn" @click="openChangePasswordPopup">전체 비밀번호 변경</button> -->
          <button type="button" class="btn" @click="openRegister">등록</button>
          <!-- <button type="button" class="btn" @click="save">저장</button> -->
        </template>
        <ag-grid-vue
            style="width: 100%;"
            class="ag-theme-balham"
            :columnDefs="columnDefs"
            :rowData="rowData"
            :domLayout="'normal'"
            :tooltipShowDelay="0"
            rowSelection='multiple'
            @firstDataRendered="comm.sizeColumnsToFit"
            @gridSizeChanged="comm.sizeColumnsToFit"
            @grid-ready="(params) => grdListTable = params.api">
          </ag-grid-vue>
      </GridArea>
    </div>

  </div>

  <UserManageDialog ref="dialog" @callback="selectList"></UserManageDialog>
</template>

<script setup>
import {ref, onMounted, nextTick, inject} from 'vue'
import GridArea from '@/components/common/GridArea.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import UserManageDialog from './UserManageDialog.vue'
import LinkRenderer from '@/components/cellRenderer/LinkRenderer.vue'
import comm from '@/utils/comm'

const axios = inject('axios')

onMounted(async () => {
  let ynCodeList = await comm.selectCodeList({upperCode: 'YN', firstRow: '전체'})
  comboList.value.useYn = ynCodeList
  search()
})

// 조회 조건 설정
const condList = ref([
  [
    {condName: '부서명', condCode: 'orgName', type: 'text'},
    {condName: '이름/ID', condCode: 'loginId', type: 'text'},
    {condName: '권한', condCode: 'roleName', type: 'text' },
    {condName: '사용 여부', condCode: 'useYn', type: 'select', labelClass:'small'},
  ]
])

// 조회 조건
const cond = ref({
  orgName: '',
  loginId: '',
  roleName: '',
  useYn: 'Y',
})

// 검색조건 콤보 item list
const comboList = ref({
  roleName: [],
  useYn: [],
})


// - 그리드 설정
const grdListTable = ref()

// - 그리드 컬럼 속성 정보
const columnDefs = comm.makeTooltipField(ref(
  [
    { headerName: '부서명', field: 'orgName', width: 100, minWidth: 100, cellStyle: {'text-align': 'left'}, },
    { headerName: '이름', field: 'userName', width: 80, minWidth: 80, },
    {
      headerName: 'ID', field: 'loginId', width: 80, minWidth: 80,
      cellRenderer: LinkRenderer,
      cellRendererParams: {
        click: (params) => {
          let av_param = {
            data: comm.objDeepCopy(params.data)
          }
          fn_openDetail(av_param)
        }
      }
    },
    { headerName: '이메일 주소', field: 'email', width: 120, minWidth: 120, cellStyle: {'text-align': 'left'}, },
    { headerName: '직책', field: 'pstnName', width: 90, minWidth: 90, },
    { headerName: '권한', field: 'roleNameList', width: 120, minWidth: 120, },
    { headerName: '사용여부', field: 'useYn', width: 60, minWidth: 60, },
  ]
))

// 그리드 데이터
const rowData = ref([])

// Popup 설정
const dialog = ref(null)

// 검색 기능
async function search() {
  selectList()
}

// 상세보기 : 그리드의 행 클릭
function fn_openDetail(av_param) {
  dialog.value.open(av_param)
}

// [Create] : 등록버튼 클릭
function openRegister() {
  dialog.value.open()
}

// [조회] : 그리드 조회
async function selectList() {
  rowData.value = []
  let payload = {
    orgName: cond.value.orgName,
    loginId: cond.value.loginId,
    roleName: cond.value.roleName,
    useYn: null
  }
  if (cond.value.useYn) payload.useYn = cond.value.useYn === 'Y'
  // 1. 조회조건 체크
  let response = await axios.get("/api/users", { payload })
  rowData.value = response.data
}

</script>
