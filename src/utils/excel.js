import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import comm from '@/utils/comm';

/*
 * grid colDef로 fieldList 찾아내는 함수
 * @param {Array} columnDefs 엑셀 업로드 callback param
 * @returns
 */
export function getFieldListByColDefs(columnDefs, options) {
  let fieldList = []
  function recurGetField(row) {
    if(row.children) {
      for(let idx in row.children)
        recurGetField(row.children[idx])
    } else fieldList.push(row.field)
  }
  if(options && options.includeRowId) fieldList.push('__id')
  if(options && options.hiddenKeys) {
    for(let index in options.hiddenKeys) {
      fieldList.push(options.hiddenKeys[index])
    }
  }
  if(!options || !options.excludeYYYY) fieldList.push('YYYY')
  columnDefs.value.forEach(row => {
    if(row.checkboxSelection) {
      // nothing to do
    } else {
      recurGetField(row)
    }
  })
  return fieldList
}

/*
 * 엑셀 업로드 validation check
 * @param {Object} av_param 엑셀 업로드 callback param
 * @param {Array} checkArr validation check 해야되는 list
 * @param {Array} list 기존 화면의 list
 * @returns
 */
export async function excelUploadValidation(av_param, checkArr, list) {
  // 미입력 데이터 존재하는지 체크
  return av_param.value.EXCEL_DATA.some((row) => {
    let flag = false
    for(let idx in checkArr) {
      if(checkArr[idx]['check'].indexOf('req') > -1) { // 필수체크
        if(comm.isNull(comm.nvl(row[checkArr[idx][`code`]]).trim())) {
          comm.alert(`There is data that cannot be uploaded to Excel. ${checkArr[idx][`name`]} is a required input(row ${(Number(idx) + 1)}).`)
          flag = true
        }
      }
      if(checkArr[idx]['check'].indexOf('dup') > -1) { // 중복체크
        let foundItem = list.value.find(grdItem => row[checkArr[idx][`code`]] === grdItem[checkArr[idx][`code`]])

        if(foundItem) {
          comm.alert(`There is data that cannot be uploaded to Excel. The same ${checkArr[idx][`name`]} cannot be registered(row ${(Number(idx) + 1)}).`)
          flag = true
        }
      }
    }
    return flag
  })
}

/**
 * 엑셀다운로드 
 * @param {Array} grdColDefs 그리드의 columnDefs
 * @param {Array} grdRowData 그리드의 rowData
 * @param {Object} options  엑셀 다운로드 시 설정할 option
 * options : {
 *  rowMerge: [1,2],    // 열 Merge할 열 지정
 *  hilightCol: [1,2]  // 노란색으로 칠할 열 지정
 *  disabledCol: [1,2]  // 회색으로 칠하고 값을 보이지 않게 할 열 지정
 *  fileName: 'example.xlsx'  파일명 지정
 *  zoomScale: 100            // 시트배율. Default 100% = 100
 *  ySplit: 0                 // Y축 틀고정. 존재할 시에만 반영하고, 없으면 정의하지 말것
 *  cellCommentList: [{ cellPos: 'A1', note: '코멘트 추가' }] // 특정 Cell에 comment 추가
 *  colStyle: [{ colId: 'C', numFmt: '@' }] // 특정 컬럼의 Style 지정. numFmt=@(텍스트)
 * }
 * @returns
 */
export async function excelDownload(grdColDefs, grdRowData, options) {
  // hidden row 숨겨서 넣기
  if(options.hiddenKeys) {
    for(let i = options.hiddenKeys.length - 1; i > -1; i--) {
      grdColDefs.value.unshift({
        headerName: options.hiddenKeys[i],
        field: options.hiddenKeys[i],
        xlsWidth: 0
      })
    }
  }
  // id row 숨겨서 넣기
  if(options.includeRowId) {
    grdColDefs.value.unshift({
      headerName: "__id",
      field: "__id",
      xlsWidth: 0
    })
  }
  const columnDefs = flattenColumnDefs(grdColDefs.value);
  const rowData = JSON.parse(JSON.stringify(grdRowData.value));
  const maxLevel = getHeaderMaxLevel(columnDefs);
  let customColDefs = generateMergedHeaders(columnDefs, maxLevel);
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  let fileName = 'example.xlsx'

  // 헤더, 데이터 삽입
  insertHeaderRows(worksheet, customColDefs);
  insertDataRows(worksheet, rowData);
  // 헤더 병합
  mergeHeaderRowsAndColumns(worksheet, maxLevel);

  if (options) {
    if (options.hilightCol) {
      setStyleHilightCol(worksheet, options.hilightCol, maxLevel)
    }
    if (options.disabledCol) {
      setStyleDisabledCol(worksheet, options.disabledCol, maxLevel)
    }
    if (options.rowMerge) {
      mergeRowDataRows(worksheet, options.rowMerge, maxLevel)
    }
    if (options.fileName) {
      fileName = options.fileName
    }
  }

  // 헤더 바디 스타일 설정
  styleHeaderRows(worksheet, maxLevel);
  styleDataRows(worksheet, maxLevel, columnDefs);
  // 열 사이즈 자동 조정
  //autoAdjustColumnWidths(worksheet, columnDefs, rowData);
  adjustColumnXlsWidths(worksheet, columnDefs)

  // 시트 옵션 적용
  let sheetView = { state: 'normal', zoomScale: 100, }
  if(!comm.isNull(options.zoomScale) && String(options.zoomScale) !== '') {
    sheetView["zoomScale"] = options.zoomScale
  }
  if(!comm.isNull(options.ySplit) && String(options.ySplit) !== '') {
    sheetView["state"] = 'frozen'
    sheetView["ySplit"] = options.ySplit
  }
  worksheet.views = [ sheetView ]

  // Cell Comments 적용 : cellPos, note
  if(!comm.isNull(options.cellCommentList) && options.cellCommentList.length > 0) {
    setCellComments(worksheet, options.cellCommentList)
  }

  // Cell Data Validation 적용(유효성 검사) : cellId, type(list, ...), allowBlank(true, false), formulae()
  if(!comm.isNull(options.cellDataValidationList) && options.cellDataValidationList.length > 0) {
    setSheetDataValidation(worksheet, options.cellDataValidationList)
  }

  // Column Style 설정 : numFmt=@(텍스트)
  if(!comm.isNull(options.colStyle) && options.colStyle.length > 0) {
    setColumnStyle(worksheet, options.colStyle)
  }

  // 파일 저장
  const blob = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([blob]), fileName);
};

/**
 * 엑셀다운로드 Multi Sheet 
 * @param {String} fileName 파일명
 * @param {Array} sheetArr [{colDef, rowData, options}]
 * colDef : ref([
 *  { headerName: '예시' , field: 'EXAMPLE' , width: 120, xlsWidth:20, cellStyle: {'text-align':'center'},}, ...
 * ]),
 * rowData ; ref([
 * { EXAMPLE: 'ex', ... }
 * ]),
 * options : {
 *  rowMerge: [1,2],    //rowMerge할 열 지정
 *  sheetName: '시트1', // sheet명
 *  hilightCol: [1,2]  // 노란색으로 칠할 열 지정
 *  disabledCol: [1,2]  // 회색으로 칠하고 값을 보이지 않게 할 열 지정
 *  zoomScale: 100            // 시트배율. Default 100% = 100
 *  ySplit: 0                 // Y축 틀고정. 존재할 시에만 반영하고, 없으면 정의하지 말것
 *  cellCommentList: [{ cellPos: 'A1', note: '코멘트 추가' }] // 특정 Cell에 comment 추가
 *  colStyle: [{ colId: 'C', numFmt: '@' }] // 특정 컬럼의 Style 지정. numFmt=@(텍스트)
 * }
 * @returns
 */
export async function excelMultiSheetDownload(fileName, sheetArr) {
  // 엑셀 생성
  const workbook = new ExcelJS.Workbook();

  sheetArr.forEach(sheet => {
    // hidden row 숨겨서 넣기
    if(sheet.options.hiddenKeys) {
      for(let i = sheet.options.hiddenKeys.length - 1; i > -1; i--) {
        grdColDefs.value.unshift({
          headerName: sheet.options.hiddenKeys[i],
          field: sheet.options.hiddenKeys[i],
          xlsWidth: 0
        })
      }
    }
    // id row 숨겨서 넣기
    if(sheet.options.includeRowId) {
      grdColDefs.value.unshift({
        headerName: "__id",
        field: "__id",
        xlsWidth: 0
      })
    }

    const columnDefs = flattenColumnDefs(sheet.colDef.value);
    const rowData = JSON.parse(JSON.stringify(sheet.rowData.value));

    const maxLevel = getHeaderMaxLevel(columnDefs);
    let customColDefs = generateMergedHeaders(columnDefs, maxLevel);
    // sheet 생성
    const worksheet = workbook.addWorksheet(sheet.options.sheetName);
    
    // 헤더, 데이터 삽입
    insertHeaderRows(worksheet, customColDefs);
    insertDataRows(worksheet, rowData);
    // 헤더 병합
    mergeHeaderRowsAndColumns(worksheet, maxLevel);
  
    if (sheet.options) {
      if (sheet.options.hilightCol) {
        setStyleHilightCol(worksheet, sheet.options.hilightCol, maxLevel)
      }
      if (sheet.options.disabledCol) {
        setStyleDisabledCol(worksheet, sheet.options.disabledCol, maxLevel)
      }
      if (sheet.options.rowMerge) {
        mergeRowDataRows(worksheet, sheet.options.rowMerge, maxLevel)
      }
    }
    // 헤더 바디 스타일 설정
    styleHeaderRows(worksheet, maxLevel);
    styleDataRows(worksheet, maxLevel);
    // 열 사이즈 자동 조정
    //autoAdjustColumnWidths(worksheet, columnDefs, rowData);
    adjustColumnXlsWidths(worksheet, columnDefs)

    // 시트 옵션 적용
    let sheetView = { state: 'normal', zoomScale: 100, }
    if(!comm.isNull(sheet.options.zoomScale) && String(sheet.options.zoomScale) !== '') {
      sheetView["zoomScale"] = sheet.options.zoomScale
    }
    if(!comm.isNull(sheet.options.ySplit) && String(sheet.options.ySplit) !== '') {
      sheetView["state"] = 'frozen'
      sheetView["ySplit"] = sheet.options.ySplit
    }
    worksheet.views = [ sheetView ]

    // Cell Comments 적용 : cellPos, note
    if(!comm.isNull(sheet.options.cellCommentList) && sheet.options.cellCommentList.length > 0) {
      setCellComments(worksheet, sheet.options.cellCommentList)
    }

    // Cell Data Validation 적용(유효성 검사) : cellId, type(list, ...), allowBlank(true, false), formulae()
    if(!comm.isNull(sheet.options.cellDataValidationList) && sheet.options.cellDataValidationList.length > 0) {
      setSheetDataValidation(worksheet, sheet.options.cellDataValidationList)
    }

    // Column Style 설정 : colId, numFmt=@(텍스트)
    if(!comm.isNull(sheet.options.colStyle) && sheet.options.colStyle.length > 0) {
      setColumnStyle(worksheet, sheet.options.colStyle)
    }
  })

  // 파일 저장
  const blob = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([blob]), fileName);
};

function insertHeaderRows(worksheet, customColDefs) {
  worksheet.columns = customColDefs[0];
  for (let i = 1; i < customColDefs.length; i++) {
    worksheet.addRow(customColDefs[i].map(col => col.header));
  }
};

function insertDataRows(worksheet, rowData) {
  worksheet.addRows(rowData);
};

function styleHeaderRows(worksheet, maxLevel) {
  const headerRows = worksheet.getRows(1, maxLevel);
  headerRows.forEach((row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E9E9E9' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });
};
// 데이터 부분의 셀 스타일 기본설정
function styleDataRows(worksheet, maxLevel, columnDefs) {
  const dataRows = worksheet.getRows(maxLevel + 1, worksheet.rowCount);
  // 병합된 셀 align 설정
  dataRows.forEach((row) => {
    row.eachCell({ includeEmpty: true }, (cell, number) => {
      // 병합셀의 경우 텍스트 정렬 가운데
      if(cell.isMerged) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      // 테두리 처리
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      if(columnDefs && columnDefs[number - 1]) {
        if(columnDefs[number - 1].numFmt) cell.numFmt = columnDefs[number - 1].numFmt
      }
    });
  });

}

function autoAdjustColumnWidths(worksheet, columnDefs, rowData) {
  const allRows = [columnDefs, ...rowData.map((data) => Object.values(data))];

  allRows.forEach((row) => {
    row.forEach((cell, columnIndex) => {
      const column = worksheet.columns[columnIndex];
      let byteLen = 0
      if (cell != null) {
        byteLen = getByteLength(cell.toString())
      }
      const cellByteLength = byteLen;
      column.width = Math.max(column.width || 0, cellByteLength);
    });
  });
}

function adjustColumnXlsWidths(worksheet, columnDefs) {
  columnDefs.forEach((cell, index) => {
    const column = worksheet.columns[index]
    const cellXlsWidth = cell.xlsWidth
    if (cellXlsWidth != undefined) {
      column.width = cellXlsWidth
    } else {
      let byteLen = 0
      if (cell != null) {
        byteLen = getByteLength(cell.toString())
      }
      const cellByteLength = byteLen
      column.width = Math.max(column.width || 0, cellByteLength)
    }
  })
}

/**
 * 열 크기 조정을 위한 blength를 가져오는 함수
 * @param {string} str byte length를 구할 문자열
 * @returns 문자열에 byte length를 반환
 *
 */
function getByteLength(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return data.byteLength;
};
/**
 * columnDefs[].cellStyle object를 exceljs에서 호환되게 변경하는 함수
 * @param {object} styles columnDefs[].cellStyle
 * @returns exceljs에서 호환되는 style object 반환
 */
function transformStyle(styles) {
  let trnsStyle = {};

  // 기본 스타일
  trnsStyle.alignment = { horizontal: 'center' };

  if (styles) {
    for (let style in styles) {
      if (style === 'text-align') {
        trnsStyle.alignment = { horizontal: styles[style] };
      }
    }
  }
  return trnsStyle;
};
// 헤더 병합처리를 위한 가공
function flattenColumnDefs(columnDefs, parentHeader = '') {
  let flattenedDefs = [];

  for (const columnDef of columnDefs) {
    // 체크박스와 같은 컬럼명이 존재하지 않는 컬럼 제외
    if (columnDef.checkboxSelection) {
      continue;
    }
    // 다운로드시 제외
    if (columnDef.excludeColumn) {
      continue;
    }

    if (columnDef.children) {
      flattenedDefs = flattenedDefs.concat(
        flattenColumnDefs(columnDef.children, parentHeader + ' > ' + columnDef.headerName)
      );
    } else {
      let width
      if(columnDef.xlsWidth == 0 || columnDef.xlsWidth > 0) {
        width = columnDef.xlsWidth
      } else {
        if(columnDef.width == 0 || columnDef.width > 0) width = columnDef.width / 6
      }

      flattenedDefs.push({
        header: parentHeader + ' > ' + columnDef.headerName,
        key: columnDef.field,
        style: transformStyle(columnDef.cellStyle),
        xlsWidth: width,
        numFmt: columnDef.numFmt,
      });
    }
  }

  return flattenedDefs;
};
// 헤덥 병합을 위한 헤더 maxLevel 산출
function getHeaderMaxLevel(columnDefs) {
  let arr;
  let maxLevel = 0;
  for (const coldef of columnDefs) {
    arr = coldef.header.split(' > ');
    arr.shift();
    maxLevel = Math.max(maxLevel, arr.length);
  }

  return maxLevel
};
// 헤더 병합처리를 위한 가공
function generateMergedHeaders(columnDefs, maxLevel) {
  const colMergeDefs = Array.from({ length: maxLevel }, () => []);
  columnDefs.forEach((coldef, idx) => {
    const arr = coldef.header.split(' > ');
    arr.shift();

    for (let i = 0; i < maxLevel; i++) {
      if (!colMergeDefs[i]) {
        colMergeDefs[i] = [];
      }
  
      if (!colMergeDefs[i][idx]) {
        colMergeDefs[i][idx] = { header: '', key: '', style: {} };
      }
      // 헤더명이 없을 경우 상위 행 헤더명 입력
      if (!arr[i]) { 
        arr[i] = arr[i - 1]
      }
      colMergeDefs[i][idx].header = arr[i];
      colMergeDefs[i][idx].key    = coldef.key;
      colMergeDefs[i][idx].style  = coldef.style;
    }
  });

  return colMergeDefs;
};

function mergeHeaderRowsAndColumns(worksheet, maxLevel) {
  let rowCount = maxLevel;
  let colCount = worksheet.columnCount;
  
  // Merge rows
  for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
    for (let colIndex = 1; colIndex <= colCount; colIndex++) {
      const cell = worksheet.getCell(rowIndex, colIndex);
      const cellValue = cell.value;
      if (!cell.isMerged) {
        if (cellValue === worksheet.getCell(rowIndex + 1, colIndex).value) {
          let mergeEnd = rowIndex + 1;
          while (mergeEnd <= rowCount && worksheet.getCell(mergeEnd, colIndex).value === cellValue) {
            mergeEnd++;
          }
          if (mergeEnd - rowIndex > 1) {
            worksheet.mergeCells(rowIndex, colIndex, mergeEnd - 1, colIndex);
          }
        }
      }
      
    }
  }

  // Merge columns
  for (let colIndex = 1; colIndex <= colCount; colIndex++) {
    for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
      const cell = worksheet.getCell(rowIndex, colIndex);
      const cellValue = cell.value;

      if (!cell.isMerged) {
        if (cellValue === worksheet.getCell(rowIndex, colIndex + 1).value) {
          let mergeEnd = colIndex + 1;
          while (mergeEnd <= colCount && worksheet.getCell(rowIndex, mergeEnd).value === cellValue) {
            mergeEnd++;
          }
          if (mergeEnd - colIndex > 1) {
            worksheet.mergeCells(rowIndex, colIndex, rowIndex, mergeEnd - 1);
          }
        }
      }
      
    }
  }
};

function mergeRowDataRows(worksheet, colIdxArr, maxLevel) {
  let rowCount = worksheet.rowCount - maxLevel;
  
  // Merge rows
  colIdxArr.forEach((colIndex) => {
    for (let rowIndex = 1; rowIndex <= rowCount; rowIndex++) {
      const cell = worksheet.getCell(rowIndex, colIndex);
      const cellValue = cell.value;
      if (!cell.isMerged) {
        if (cellValue === worksheet.getCell(rowIndex + 1, colIndex).value) {
          let mergeEnd = rowIndex + 1;
          while (mergeEnd <= rowCount && worksheet.getCell(mergeEnd, colIndex).value === cellValue) {
            mergeEnd++;
          }
          if (mergeEnd - rowIndex > 1) {
            worksheet.mergeCells(rowIndex, colIndex, mergeEnd - 1, colIndex);
          }
        }
      }
    }
  })
};

function setStyleHilightCol(worksheet, colIdxArr, maxLevel) {
  const dataRows = worksheet.getRows(maxLevel + 1, worksheet.rowCount);
  
  colIdxArr.forEach((colIndex) => {
    dataRows.forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === colIndex) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' },
          };
        }
      });
    });
  })
};

function setStyleDisabledCol(worksheet, colIdxArr, maxLevel) {
  const dataRows = worksheet.getRows(maxLevel + 1, worksheet.rowCount);
  
  colIdxArr.forEach((colIndex) => {
    dataRows.forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === colIndex) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '808080' },
          };
          cell.value = ''
        }
      });
    });
  })
  
}

/**
 * Cell Data Validation 적용(유효성 검사)
 * @param {*} av_worksheet 반영할 시트
 * @param {*} av_arrCellDataValidationList [ cellId     : 반영할 cell ID. ex) A1:A5
 *                                           type       : list
 *                                           allowBlank : true, false
 *                                           formulae   : list방식일때 사용. One, Two, Three, Four -> ['"One,Two,Three,Four"']
 *                                         ]
 * @link https://github.com/exceljs/exceljs?tab=readme-ov-file#data-validations
 */
function setSheetDataValidation(av_worksheet, av_arrCellDataValidationList) {
  if(comm.isNull(av_arrCellDataValidationList) || av_arrCellDataValidationList.length < 1) return
  for(let i in av_arrCellDataValidationList) {
    let oDataValidation = av_arrCellDataValidationList[i]
    av_worksheet.dataValidations.model[ oDataValidation.cellId ] = oDataValidation
  }
}

/**
 * Cell Comments 적용
 * @param {*} av_worksheet 반영할 시트
 * @param {*} av_arrCellCommentList  [ cellPos : 반영할 cell ID. ex) A1
 *                                     note    : Comment String
 *                                   ]
 * @link https://github.com/exceljs/exceljs?tab=readme-ov-file#cell-comments
 */
function setCellComments(av_worksheet, av_arrCellCommentList) {
  if(comm.isNull(av_arrCellCommentList) || av_arrCellCommentList.length < 1) return
  for(let i in av_arrCellCommentList) {
    let noteObj = av_arrCellCommentList[i]
    if(!comm.isNull(noteObj.cellPos) && noteObj.cellPos !== '' && !comm.isNull(noteObj.note) && noteObj.note !== '') {
      av_worksheet.getCell( noteObj.cellPos ).note = noteObj.note
    }
  }
}

/**
 * Column Style 설정
 * ex) numFmt=@(텍스트)
 * @param {*} av_worksheet 반영할 시트
 * @param {*} av_arrColumnStyleList [ colId : 반영할 Column ID. ex) A
 *                                    numFmt : Excel Number Format. ex) @(텍스트)
 *                                  ]
 * @link https://github.com/exceljs/exceljs?tab=readme-ov-file#styles
 */
function setColumnStyle(av_worksheet, av_arrColumnStyleList) {
  if(comm.isNull(av_arrColumnStyleList) || av_arrColumnStyleList.length < 1) return;
  for(let i in av_arrColumnStyleList) {
    let colStyleObj = av_arrColumnStyleList[i];
    if(!comm.isNull(colStyleObj.colId) && colStyleObj.colId !== '') {
      if(!comm.isNull(colStyleObj.numFmt) && colStyleObj.numFmt !== '') {
        // 넉넉하게 조정 (필요하면 더 늘려도 될듯)
        const totalRows = av_worksheet.rowCount < 100 ? 100 : av_worksheet.rowCount;

        for (let row = 1; row <= totalRows; row++) {
          let cell = av_worksheet.getCell(colStyleObj.colId + row);
          cell.numFmt = colStyleObj.numFmt;
        }
      }
    }
  }
}

