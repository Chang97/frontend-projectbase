
export default {
  localeText: {
    noRowsToShow: '표시할 데이터가 없습니다'
  },

  suppressNativeWidgetStyling: true,

  domLayout: 'normal',
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true, // multi 선택일 때 row 눌러도 select 되도록 하는 설정
  stopEditingWhenCellsLoseFocus: true, // focus 잃었을 때 edit 종료되게 하기

  suppressPropertyNamesCheck: true, // ag grid grid options에서 property check warning 제거(colDefs에 ag-grid에서 지정되지 않은 props 있을때 warning)

  suppressMovableColumns: true, // 기본적으로 column 이동 금지

  enableCellTextSelection: true, // 텍스트 복사 가능하게 하는 옵션
  ensureDomOrder: true, // 위 옵션 지정 시 같이 넣어야 되는 부분

  // fit하게 붙이는게 아니라 width 지정하고 resize 가능하게 변경하는게 나을 것 같음
  defaultColDef: {
    resizable: true,
    unSortIcon: false, // 정렬 default true
    sortable: true,
    suppressKeyboardEvent: suppressNavigation, // text박스 내부에서 화살표로 커서이동이 안되고 포커스가 빠져서 추가
  },

  // tooltips 기본 브라우저 사용
  enableBrowserTooltips: true,
}

// 그리드 내 input에서 방향키 이동시 blur처리되어서 추가
function suppressNavigation(params) {
  var KEY_A = 'A';
  var KEY_C = 'C';
  var KEY_V = 'V';
  var KEY_D = 'D';
  var KEY_LEFT = 'ArrowLeft';
  var KEY_UP = 'ArrowUp';
  var KEY_RIGHT = 'ArrowRight';
  var KEY_DOWN = 'ArrowDown';
  var KEY_BACKSPACE = 'Backspace';
  var KEY_SPACE = ' ';
  var KEY_DELETE = 'Delete';
  var KEY_PAGE_HOME = 'Home';
  var KEY_PAGE_END = 'End';
  var KEY_TAB = 'Tab';
  var event = params.event;
  var key = event.key;
  var keysToSuppress = [
    KEY_LEFT,
    KEY_RIGHT,
    KEY_UP,
    KEY_DOWN,
    KEY_BACKSPACE,
    KEY_DELETE,
    KEY_SPACE,
    KEY_PAGE_HOME,
    KEY_PAGE_END,
    KEY_TAB,
  ];
  if (event.ctrlKey || event.metaKey) {
    keysToSuppress.push(KEY_A);
    keysToSuppress.push(KEY_V);
    keysToSuppress.push(KEY_C);
    keysToSuppress.push(KEY_D);
  }
  let suppress = keysToSuppress.some(function (suppressedKey) {
    return suppressedKey === key || key.toUpperCase() === suppressedKey;
  });
  return suppress;
};