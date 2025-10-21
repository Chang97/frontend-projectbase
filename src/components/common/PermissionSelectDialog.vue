<template>
  <Dialog
    title="권한 선택"
    :width="600"
    v-model="show"
    @close="handleCancel"
  >
    <div class="dialog-body">
      <AgGridVue
        class="ag-theme-balham permission-grid"
        style="width: 100%; height: 360px;"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :rowData="rowData"
        rowSelection="multiple"
        :suppressRowClickSelection="true"
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
      />
    </div>
    <div class="bottom-btn-wrap">
      <button type="button" class="btn" @click="confirmSelection">확인</button>
      <button type="button" class="btn sub" @click="handleCancel">취소</button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import Dialog from '@/components/common/Dialog.vue'
import { AgGridVue } from 'ag-grid-vue3'

const show = ref(false)
const rowData = ref([])
const columnDefs = ref([
  {
    headerName: '',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    width: 50,
    suppressMenu: true,
    sortable: false
  },
  { headerName: '권한명', field: 'permissionName', flex: 1 },
  { headerName: '권한 코드', field: 'permissionCode', width: 150 }
])
const defaultColDef = {
  resizable: true,
  sortable: true
}

const gridApi = ref(null)
const selectedIds = ref([])

const emit = defineEmits(['confirm', 'cancel'])

function onGridReady(params) {
  gridApi.value = params.api
  gridApi.value.setRowData(rowData.value)
  syncSelection()
  params.api.sizeColumnsToFit()
}

function onSelectionChanged() {
  if (!gridApi.value) {
    return
  }
  selectedIds.value = gridApi.value
    .getSelectedNodes()
    .map(node => node.data.permissionId)
}

function syncSelection() {
  if (!gridApi.value) {
    return
  }
  gridApi.value.forEachNode(node => {
    const id = node.data.permissionId
    node.setSelected(selectedIds.value.includes(id))
  })
}

watch(show, visible => {
  if (visible) {
    nextTick(() => {
      gridApi.value?.setRowData(rowData.value)
      syncSelection()
      gridApi.value?.sizeColumnsToFit()
    })
  }
})

function confirmSelection() {
  emit('confirm', [...selectedIds.value])
  show.value = false
}

function handleCancel() {
  show.value = false
  emit('cancel')
}

function open({ permissions = [], selectedIds: ids = [] } = {}) {
  rowData.value = permissions
  selectedIds.value = [...ids]
  show.value = true
  nextTick(() => {
    if (gridApi.value) {
      gridApi.value.setRowData(rowData.value)
      syncSelection()
      gridApi.value.sizeColumnsToFit()
    }
  })
}

defineExpose({ open })
</script>

<style scoped>
.dialog-body {
  margin-bottom: 12px;
}

.permission-grid ::v-deep(.ag-header-cell-text) {
  font-weight: 600;
}
</style>
