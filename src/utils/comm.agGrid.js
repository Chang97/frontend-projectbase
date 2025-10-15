import comm from './comm'
import { nextTick } from 'vue'

/**
 * AG Grid 접기펴기 가능한 Tree 만들 때 쓰는 공통함수
 * 
 * @param {*} node filterpass 시 주는 param 그대로 전달
 * @param {*} list grid에서 사용하는 list
 * @param CD row 의 key value의 명칭 (String)
 * @param UPPER_CD row 의 upper key value의 명칭 (String)
 */
export function actionTreeFilterPass(node, list, CD, UPPER_CD) {
  let flag = true
  if (node.data) {
    if (node.data[UPPER_CD] && node.data[UPPER_CD] != '0') {
      flag = recurTreeActionFilter(node.data, list, CD, UPPER_CD)
    }
    if(node.data.__treeHide) {
      flag = false
    }
  }
  return flag
}
function recurTreeActionFilter(data, list, CD, UPPER_CD) {
  let parent = list.find(row => row[CD] == data[UPPER_CD])
  if(parent) {
    if(parent.isOpen) return recurTreeActionFilter(parent, list, CD, UPPER_CD)
    else return false
  } else {
    if(data.isOpen) {
      return true
    } else {
      return false
    }
  }
}
/**
 * AG Grid 접기펴기 가능한 Tree에서 쓰는 quickfilter
 * 
 * @param CD row 의 key value의 명칭 (String)
 * @param UPPER_CD row 의 upper key value의 명칭 (String)
 * @param {*} grid grid object (ref 객체) .value 아님
 * @param {*} list grid에서 사용하는 list (ref 객체) .value 아님
 * @param filterText filter 걸 text (.value)
 */
export async function setQuickFilterInTree(CD, UPPER_CD, grid, list, filterText) {
  if(filterText) {
    list.value.forEach(row => {
      let flag = false
      for(let key in row) {
        if(String(row[key]).toUpperCase().indexOf(filterText.toUpperCase()) > -1) {
          flag = true
        }
      }
      if(flag) {
        row.__treeHide = false
        recurTreeOpen(CD, UPPER_CD, row, list)
      } else {
        row.__treeHide = true
      }
    })
  } else {
    list.value.forEach(row => {
      row.__treeHide = false
      row.isOpen = false
    })
  }

  await nextTick()
  grid.value.onFilterChanged()
}
function recurTreeOpen(CD, UPPER_CD, data, list) {
  let parent = list.value.find(row => row[CD] == data[UPPER_CD])
  if(parent) {
    parent.__treeHide = false
    parent.isOpen = true
    recurTreeOpen(CD, UPPER_CD, parent, list)
  }
}

/**
 * AG Grid의 Column Size를 너비에 맞게 자동조정
 * 
 * 참고 URL : https://www.ag-grid.com/vue-data-grid/column-sizing/#size-columns-to-fit
 * @param {*} params 
 */
export function sizeColumnsToFit(params) {
  if(params && params.api) {
    params.api.sizeColumnsToFit()
  }
}

/*
 * 재귀적으로 다 찾아서 tooltipField 만들어주는 함수
 */
function makeChildTootipField(col, index, options) {
  if(col.field) {
    if(!col.tooltipField && !col.tooltipValueGetter) { // - tooltipField, tooltipValueGetter(강제로 tooltip내용을 생성하는 경우)가 미설정인 경우만
      col.tooltipField = col.field
    }
    // - numberSort 여부에 따른 Custom Sort 추가 : 숫자형식이지만, 문자열로 넘어오는 경우가 존재해서
    if(col.numberSort === 'Y' && col.comparator === undefined) {
      col.comparator = function(valueA, valueB, nodeA, nodeB, isDescending) {
          if (valueA === valueB) return 0;
          return ((valueA === undefined ? 0 : Number(valueA)) > (valueB === undefined ? 0 : Number(valueB))) ? 1 : -1;
      }
    }

  } else {
    if(col.children) {
      for(let i = 0; i < col.children.length; i++) {
        let childCol = col.children[i]
        makeChildTootipField(childCol, index, options)
      }
    }
  }

  if(col.field || col.checkboxSelection) {
    if(options) {
      if(options.pinned) {
        if(options.pinned.left) {
          if(index <= options.pinned.left) col.pinned = 'left'
        }
        if(options.pinned.right) {
          if(index >= options.pinned.right) col.pinned = 'right'
        }
      }
    }
  }
}
/*
 * tooltipField 자동으로 붙여주는 함수
 */
export function makeTooltipField(colDefRef, options) {
  if(colDefRef.value) {
    for(let i = 0; i < colDefRef.value.length; i++) {
      let col = colDefRef.value[i]
      makeChildTootipField(col, i, options)
    }
  } else {
    for(let i = 0; i < colDefRef.length; i++) {
      let col = colDefRef[i]
      makeChildTootipField(col, i, options)
    }
  }
  return colDefRef
}

/*
 * agGrid랑 연동된 list index 찾는 함수
 */
export function agGridFindBindedRowIndex(rowData, targetData, keyId) {
  let index = -1
  
  if(!targetData['__id']) {
    targetData['__id'] = Date.now().toString(36) + Math.random().toString(36).substring(2)

    if(keyId == null || keyId == undefined || keyId == '') {
      index = rowData.findIndex(row => {
        let flag = false
        for(let key in row) {
          if(targetData[key] && row[key] == targetData[key]) flag = true 
        }
        return flag
      })
    } else {
      index = rowData.findIndex(row => row[keyId] == targetData[keyId])
    }
  } else {
    index = rowData.findIndex(row => row['__id'] == targetData['__id'])
  }

  return index
}

/* AG Grid 의 grid 내부 데이터와 화면 row Data 함께 update 하는 함수 */
/**
 * AG Grid의 행 추가 : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 
 * @param {*} rowData   grid에 연결된 rowData
 * @param {*} grid      
 * @param {*} newData   추가할 Data Array
 * @param {*} location 'append'(끝에 추가), 'prepand'(제일 위에 추가), number(해당 위치에 추가)
 */
export function agGridAddRows(rowData, grid, newData, location) {
  let newArr = []
  if(Array.isArray(newData)) {
    for(let idx in newData) {
      newData[idx]['__id'] = Date.now().toString(36) + Math.random().toString(36).substring(2)
      newData[idx]['__crud'] = 'C'
    }
    
    newArr = comm.arrayDeepCopy(newData)
  } else {
    newData['__id'] = Date.now().toString(36) + Math.random().toString(36).substring(2)
    newData['__crud'] = 'C'

    newArr.push(comm.objDeepCopy(newData))
  }

  if(location === null || location === undefined || location === '' || location == "append") {
    grid.applyTransaction({
      add: newArr
    })
    for(let key in newArr) {
      rowData.push(newArr[key])
    }
  } else if(location == "prepand") {
    grid.applyTransaction({
      add: newArr,
      addIndex: 0
    })
    for(let key in newArr) {
      rowData.unshift(newArr[key])
    }
  } else {
    grid.applyTransaction({
      add: newArr,
      addIndex: location
    })
    for(let key in newArr) {
      rowData.splice(location, 0, newArr[key])
    }
  }
  
  grid.deselectAll()

  return newArr
}

/**
 * AG Grid의 행 삭제 : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 
 * 참고) targetData는 그리드에서 직접 가져와야 한다. 즉, rowData에서 가져오면, 오류 발생 : ex) grid.getSelectedRows() or grid.forEachNode((rowNode) => { targetData.push(rowNode.data) })
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 * @param {*} targetData  삭제할 Data Array
 * @param {*} keyId       데이터를 찾을 수 있는 keyId가 존재하는 경우 설정
 */
export async function agGridRemoveRows(rowData, grid, targetData, keyId) {
  let targetArr = []
  if(Array.isArray(targetData)) {
    targetArr = comm.arrayDeepCopy(targetData)
  } else {
    targetArr.push(comm.objDeepCopy(targetData))
  }
  
  let isAllDeleted = true
  let deletedBeforeCreatedArr = []
  
  targetArr.forEach(targetRow => {
    let index = agGridFindBindedRowIndex(rowData, targetRow, keyId)

    if(!targetRow["__crud"] || targetRow["__crud"] == 'R') { // R일 경우
      targetRow["__pre_crud"] = 'R'
      targetRow["__crud"] = 'D'

      rowData[index] = targetRow // rowData에 update
      isAllDeleted = false
    } else if(targetRow["__crud"] == 'U') { // U일 경우
      targetRow["__pre_crud"] = 'U'
      targetRow["__crud"] = 'D'

      rowData[index] = targetRow // rowData에 update
      isAllDeleted = false
    } else if(targetRow["__crud"] == 'C') { // C일 경우
      // remove array에 push
      deletedBeforeCreatedArr.push(targetRow)

      // 완전히 날아가야 되는 C 데이터의 경우 rowData에서도 지워줌
      rowData.splice(index, 1)
      isAllDeleted = false
    } else { 
      // 전체가 D일 경우 아래애서 처리, 개별적으로 D면 안처리
    }
  })

  if(isAllDeleted) { // 전체가 다 D일 경우 => 원래 상태로 토글
    for(let idx in targetArr) {
      let index = agGridFindBindedRowIndex(rowData, targetArr[idx], keyId)

      if(targetArr[idx]["__pre_crud"] == 'R') targetArr[idx]["__crud"] = 'R'
      if(targetArr[idx]["__pre_crud"] == 'U') targetArr[idx]["__crud"] = 'U'

      rowData[index] = targetArr[idx]
    }
  }

  // update 먼저 하고
  // grid.applyTransaction({
  //   update: targetArr
  // })
  agGridRefreshNodes(grid, targetArr)
  
  // 삭제(update, remove를 한번에 처리하면 에러남)
  grid.applyTransaction({
    remove: deletedBeforeCreatedArr
  })

  // 삭제 후 셀렉션 제거 추가 (24.01.04)
  grid.deselectAll()

  // CSS 재적용을 위해 redraw 해줌
  // grid.redrawRows()
}
/**
 * AG Grid의 행 삭제 : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 
 * 참고) targetData는 그리드에서 직접 가져와야 한다. 즉, rowData에서 가져오면, 오류 발생 : ex) grid.getSelectedRows() or grid.forEachNode((rowNode) => { targetData.push(rowNode.data) })
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 * @param {*} targetData  삭제할 Data Array
 * @param {*} keyId       데이터를 찾을 수 있는 keyId가 존재하는 경우 설정
 */
export function agGridForcedRemoveRows(rowData, grid, targetData, keyId) {
  let targetArr = []
  if(Array.isArray(targetData)) {
    targetArr = comm.arrayDeepCopy(targetData)
  } else {
    targetArr.push(comm.objDeepCopy(targetData))
  }
  
  // 삭제(update, remove를 한번에 처리하면 에러남)
  grid.applyTransaction({
    remove: targetArr
  })
  
  // 삭제 후 데이터에 반영
  targetArr.forEach(targetRow => {
    let index = agGridFindBindedRowIndex(rowData, targetRow, keyId)
    rowData.splice(index, 1)
  })

  // CSS 재적용을 위해 redraw 해줌
  // grid.redrawRows()

  grid.deselectAll()
}
/**
 * AG Grid의 행 삭제 : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * AG Grid의 선택된 행 삭제
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 */
export async function agGridRemoveSelectedRows(rowData, grid, keyId) {
  let selectedList = comm.arrayDeepCopy(grid.getSelectedRows())
  let isAllDeleted = true
  let deletedBeforeCreatedArr = []

  for(let idx in selectedList) {
    let index = agGridFindBindedRowIndex(rowData, selectedList[idx], keyId)

    if(!selectedList[idx]["__crud"] || selectedList[idx]["__crud"] == 'R') { // R일 경우
      selectedList[idx]["__pre_crud"] = 'R'
      selectedList[idx]["__crud"] = 'D'

      rowData[index] = selectedList[idx] // rowData에 update
      isAllDeleted = false
    } else if(selectedList[idx]["__crud"] == 'U') { // U일 경우
      selectedList[idx]["__pre_crud"] = 'U'
      selectedList[idx]["__crud"] = 'D'

      rowData[index] = selectedList[idx] // rowData에 update
      isAllDeleted = false
    } else if(selectedList[idx]["__crud"] == 'C') { // C일 경우
      // remove array에 push
      deletedBeforeCreatedArr.push(selectedList[idx])

      // 완전히 날아가야 되는 C 데이터의 경우 rowData에서도 지워줌
      rowData.splice(index, 1)
      isAllDeleted = false
    } else { 
      // 전체가 D일 경우 아래애서 처리, 개별적으로 D면 안처리
    }
  }

  if(isAllDeleted) { // 전체가 다 D일 경우 => 원래 상태로 토글
    for(let idx in selectedList) {
      let index = agGridFindBindedRowIndex(rowData, selectedList[idx], keyId)

      if(selectedList[idx]["__pre_crud"] == 'R') selectedList[idx]["__crud"] = 'R'
      if(selectedList[idx]["__pre_crud"] == 'U') selectedList[idx]["__crud"] = 'U'

      rowData[index] = selectedList[idx]
    }
  }

  // update 먼저 하고
  // grid.applyTransaction({
  //   update: selectedList,
  // })
  agGridRefreshNodes(grid, selectedList)

  if(deletedBeforeCreatedArr.length > 0) {
    // 삭제(update, remove를 한번에 처리하면 에러남)
    grid.applyTransaction({
      remove: deletedBeforeCreatedArr
    })
  }

  // 삭제 후 셀렉션 제거 추가 (24.01.04)
  grid.deselectAll()
}

/**
 * AG Grid의 행 Update : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 참고) targetData는 그리드에서 직접 가져와야 한다. 즉, rowData에서 가져오면, 오류 발생 : ex) grid.getSelectedRows() or grid.forEachNode((rowNode) => { targetData.push(rowNode.data) })
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 * @param {*} updateData  수정할 Data Object
 * @param {*} keyId       데이터를 찾을 수 있는 keyId가 존재하는 경우 설정
 */
export function agGridUpdateRow(rowData, grid, _updateData, keyId) {
  let updateData = comm.objDeepCopy(_updateData)

  let index = -1
  index = agGridFindBindedRowIndex(rowData, updateData, keyId)

  if(updateData['__crud'] != 'C') updateData['__crud'] = 'U' // 상태값 C 아닌 경우 상태값 U로 변경
  if(index > -1) rowData[index] = updateData

  // let node = grid.getRowNode(updateData['__id'])
  // node.setData(updateData)

  // 이 밑에꺼도 멍청하게 동작해서 위에꺼로 바꿈 (23.12.13)
  // grid.applyTransaction({
  //   update: [updateData],
  // })

  // CSS 재적용을 위해 redraw 해줌
  // Update 일 때는 삭제 (필요도 없는데 충돌만 남 23.12.11)
  // grid.redrawRows()

  // CSS 재적용을 위해 update된 node들만 redraw 해줌 (23.12.19)
  // grid.redrawRows({ rowNodes: [node] })

  // 매서드로 묶음 (23.12.28)
  agGridRefreshNodes(grid, updateData)
}
/**
 * AG Grid의 행 Update : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 참고) targetData는 그리드에서 직접 가져와야 한다. 즉, rowData에서 가져오면, 오류 발생 : ex) grid.getSelectedRows() or grid.forEachNode((rowNode) => { targetData.push(rowNode.data) })
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 * @param {*} updateData  수정할 Data Object
 * @param {*} keyId       데이터를 찾을 수 있는 keyId가 존재하는 경우 설정
 */
export function agGridUpdateRows(rowData, grid, _updateData, keyId) {
  // let updateArr = []
  // let updateNodes = []
  let updateData = comm.arrayDeepCopy(_updateData)
  for(let idx in updateData) {
    let index = -1
    index = agGridFindBindedRowIndex(rowData, updateData[idx], keyId)

    if(updateData[idx]['__crud'] != 'C') updateData[idx]['__crud'] = 'U' // 상태값 C 아닌 경우 상태값 U로 변경
    if(index > -1) rowData[index] = updateData[idx]

    // updateArr.push(updateData[idx])

    // let node = grid.getRowNode(updateData[idx]['__id'])
    // node.setData(updateData[idx])

    // updateNodes.push(node)
  }

  // 이 밑에꺼도 멍청하게 동작해서 위에꺼로 바꿈 (23.12.13)
  // grid.applyTransaction({
  //   update: [updateData],
  // })

  // CSS 재적용을 위해 redraw 해줌
  // Update 일 때는 삭제 (필요도 없는데 충돌만 남 23.12.11)
  // grid.redrawRows()

  // CSS 재적용을 위해 update된 node들만 redraw 해줌 (23.12.19)
  // grid.redrawRows({ rowNodes: updateNodes })

  // 매서드로 묶음 (23.12.28)
  agGridRefreshNodes(grid, updateData)
}
/**
 * AG Grid의 행 Update : 바인딩된 rowData와 Grid 모두에 반영하기 위한 목적
 * 참고) targetData는 그리드에서 직접 가져와야 한다. 즉, rowData에서 가져오면, 오류 발생 : ex) grid.getSelectedRows() or grid.forEachNode((rowNode) => { targetData.push(rowNode.data) })
 * @param {*} rowData     grid에 연결된 rowData
 * @param {*} grid        
 * @param {*} updateData  수정할 Data Object
 * @param {*} keyId       데이터를 찾을 수 있는 keyId가 존재하는 경우 설정
 */
export function agGridForcedUpdateRows(rowData, grid, _updateData, keyId) {
  // let updateArr = []
  // let updateNodes = []
  let updateData = comm.arrayDeepCopy(_updateData)
  for(let idx in updateData) {
    let index = -1
    index = agGridFindBindedRowIndex(rowData, updateData[idx], keyId)

    // if(updateData[idx]['__crud'] != 'C') updateData[idx]['__crud'] = 'U' // 상태값 C 아닌 경우 상태값 U로 변경
    if(index > -1) rowData[index] = updateData[idx]

    // updateArr.push(updateData[idx])

    // let node = grid.getRowNode(updateData[idx]['__id'])
    // node.setData(updateData[idx])

    // updateNodes.push(node)
  }

  // 이 밑에꺼도 멍청하게 동작해서 위에꺼로 바꿈 (23.12.13)
  // grid.applyTransaction({
  //   update: [updateData],
  // })

  // CSS 재적용을 위해 redraw 해줌
  // Update 일 때는 삭제 (필요도 없는데 충돌만 남 23.12.11)
  // grid.redrawRows()

  // CSS 재적용을 위해 update된 node들만 redraw 해줌 (23.12.19)
  // grid.redrawRows({ rowNodes: updateNodes })

  // 매서드로 묶음 (23.12.28)
  agGridRefreshNodes(grid, updateData)
}

/**
 * AG Grid Number형식의 Cell에 valueFormatter을 사용해서, number formatting을 하기 위한 펑션
 * 
 * 기본 설정 : null은 null로 표현. 소수점 4째자리까지 표현.
 * 
 * 사용방법 : AG Grid의 columnDef에 추가 :: valueFormatter : (params) => comm.agGridNumberFormat(params, {  })
 * 
 * ex) 1234 => '1,234'
 * @param {*} params 
 * @param {*} options { nullToZero, maximumFractionDigits, minimumFractionDigits, prefixUnit, subffixUnit, unit }
 */
export function agGridNumberFormat(params, options) {
  if(options == null || options == undefined) {
    options = { nullToZero : false, maximumFractionDigits : 3, minimumFractionDigits : 0, prefixUnit : '', subffixUnit : '' }
  }
  if(options.nullToZero == null || options.nullToZero == undefined) options.nullToZero = false                              // - Null을 "0"으로 반환할지 여부.
  if(options.maximumFractionDigits == null || options.maximumFractionDigits == undefined) options.maximumFractionDigits = 3 // - 기본형은 소수점 3째자리까지만 표현
  if(options.minimumFractionDigits == null || options.minimumFractionDigits == undefined) options.minimumFractionDigits = 0 // - 기본형은 모두 표현하는 소수점 0째자리까지만 표현 : ex) 2로 설정시, 2.0 -> 2.00
  if(options.prefixUnit == null || options.prefixUnit == undefined) options.prefixUnit = ''                                 // - 숫자 앞에 표현할 문자열
  if(options.subffixUnit == null || options.subffixUnit == undefined) options.subffixUnit = ''                              // - 숫자 뒤에 표현할 문자열
  if(options.unit == null || options.unit == undefined) options.unit = ''                                                   // - 숫자를 표현할 단위. 보통 %만 사용(%는 *100으로 표현)
  let val = params.value
  if(val === null || val === undefined || val === '') return (options.nullToZero ? (options.prefixUnit + '0' + options.subffixUnit) : '')
  if(options.unit == '%') {
    val = val * 100 // - 단위가 %이면, *100 붙이기
  }
  let intlOption = { maximumFractionDigits : options.maximumFractionDigits, minimumFractionDigits : options.minimumFractionDigits }
  return options.prefixUnit + (new Intl.NumberFormat('ko-KR', intlOption)).format(val) + options.subffixUnit
}

export function isDataChanged(data, list) {
  let diff = false
  let dataArr = []
  if(Array.isArray(data)) {
    dataArr = data
  } else {
    dataArr.push(data)
  }

  for(let idx in dataArr) {
    let orgRow = list.value.find(value => value['__id'] == dataArr[idx]['__id'])
    for(let key in orgRow) {
      if(orgRow[key] != dataArr[idx][key]) diff = true
    }
  }

  return diff
}

/**
 * AG Grid의 Checkbox Default 설정 : columnDefs 용
 * @param showHeaderCheckbox Header에 checkbox 표현여부. Default는 true
 * @example
  const columnDefs = comm.makeTooltipField(ref([
   comm.getDefaultCheckBoxDef(),
   { headerName: "영역", field: "AREA_NM", width: 100, minWidth: 100, cellStyle : { "text-align" : "center"} },
  ]))
 */
export function getDefaultCheckBoxDef(showHeaderCheckbox, options) {
  if(showHeaderCheckbox === undefined || showHeaderCheckbox === null || showHeaderCheckbox !== false) {
    showHeaderCheckbox = true
  }
  let rtn = { 
    headerCheckboxSelection: showHeaderCheckbox, // 전체 선택 여부 (파라메터로 받음)
    headerCheckboxSelectionFilteredOnly: true, // quick filter 기능을 사용했을 때 filter 된 row만 selection 되도록 함
    showDisabledCheckboxes: true, // row selection이 안되는 행도 checkbox로 보여줌(disabled)
    checkboxSelection: true, // 이 행이 checkbox임
    resizable: false, width: 34, minWidth: 34, maxWidth: 34, // 사이즈 고정 필요
  }
  if(options) {
    for(let key in options) {
      rtn[key] = options[key]
    }
  }
  return rtn
}

/**
 * AG Grid의 데이터가 변경되었는지 여부
 * cf) AG Grid의 그리드 데이터 변경시, comm.agGridUpdateRow()와 같은 함수처리가 필수
 * @param {*} rowData grid에 연결된 rowData
 */
export function isAgGridDataModified(rowData) {
  if(rowData === undefined || rowData === null || rowData.length < 1) return false
  let flag = false
  for(let rowIdx in rowData) {
    let row = rowData[rowIdx]
    if(row.__crud && row.__crud !== 'R') { 
      flag = true
      break
    }
  }
  return flag
}

/**
 * 그리드의 특정 컬럼 정의를 반환
 * 동일한 ID가 여러 개가 존재하는 경우, 처음으로 찾게 된 컬럼 정의를 반환
 */
export function getGridColDef(av_columnDefs, av_field) {
  let oColDef = {  }
  if(comm.isNull(av_field)) return oColDef
  for(let colDef of av_columnDefs) {
    if(comm.isNull(colDef.field) && comm.isNull(colDef.children)) continue
    if(colDef.children) {
      let tmpObj = getGridColDef(colDef.children, av_field)
      if(!comm.isNull(tmpObj)) return tmpObj
    } else if(colDef.field === av_field) {
      return colDef
    }
  }
  return oColDef
}
