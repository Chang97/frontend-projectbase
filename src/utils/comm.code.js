import axios from '@/plugins/axios'

/**
 * json 에 key가 존재하는지 여부
 */
function isKeyInObject(obj, findKey) {
  for (let key in obj) {
      if (key == findKey) return true;
  }
  return false;
}
/**
 * 첫번째 행 추가 
 */
function generateCodeList(param, list) {
    if (param.firstRow != null && param.firstRow != '') {
        list.unshift({
            code: "",
            codeName: param.firstRow,
            upperCode: "",
            description: "",
            etc1: "",
            etc2: "",
            etc3: "",
            etc4: ""
        });
    }
    return list;
}
/**
 * json key갯수 조회
 */
export function getObjectLength(obj) {
  var length = 0;
  for (let key in obj) {
      ++length;
  }
  return length;
}
/**
   * 공통코드 목록 배열로 조회
   * @param upperCode 
   * @param
   * @param callback 뭐... 다들 아는 그거 
   * @example
   *      Array를 반환 :
   *      selectCodeList({
   *          upperCode: 'AREA',
   *          firstRow:'선택하세요',
   *          callback: function(list){console.log(list);},
   *          filterCallback: function(item,idx,arr){return true;},
   *          sort: {key:'SRT', direction:'desc'}
   *      });
   * 
   *      Array를 반환 :
   *      [...] = selectCodeList('AREA');
   * 
   *      JSON을 반환. {AREA:[], CNTR:[], UNIT:[]} :
   *      selectCodeList(['AREA','CNTR','UNIT']);
   * 
   *      JSON을 반환. {AREA:[], CNTR:[], UNIT:[]} :
   *      selectCodeList({
   *          upperCode: ['AREA','CNTR','UNIT'],
   *          firstRow: '선택하세요',
   *          callback: function(list){console.log(list);}
   *      });
   * @returns Promise
   */
export async function selectCodeList(payload) {
  let param;
  let isArray = false; //배열로 받으면 json으로 리턴 {upperCode1:[], upperCode2:[], ...upperCodeN:[]}
  let isString = false;
  if (typeof (payload) == 'string') {
      param = { upperCode: payload };
      isString = true;
  } else if (typeof (payload) == 'object' && typeof (payload.upperCode) == 'string') {
      param = payload;
      isString = true;
  } else {
      return [];
  }
  if (!isKeyInObject(param, "firstRow")) {
      param.firstRow = "전체";
  }

  const fn_postProcess = function (param, list) {
      if (!list) {
          return null;
      }
      //filter
      if (param.filterCallback) {
          list = list.filter(param.filterCallback);
      }

      //sort
      if (param.sort != undefined && typeof (param.sort) == 'object') {
          let sortList = [];
          for (let idx in list) {
              sortList.push(list[idx]);
          } //copy

          let sortKey = param.sort.key;
          let sortDir = param.sort.direction;
          if (sortDir == "asc") sortDir = 1;
          else if (sortDir == "desc") sortDir = -1;
          sortList.sort(function (a, b) {
              return (a[sortKey] > b[sortKey]) ? sortDir : sortDir * -1;
          });
          list = sortList;
      }

      //firstRow
      list = generateCodeList(param, list);
      return list;
  };

  let result = null;
  let codeObj = {};

  if(import.meta.env.VITE_use_cache_common_code == 'true') { // - 공통코드의 캐쉬 사용여부 체크
    let codeStr = sessionStorage.getItem('v_comm_STORAGE_KEY_COMM_CODE');
    if (!codeStr) {
      result = null;
    } else {
        result = codeObj[param.upperCode];
        result = fn_postProcess.apply(this, [param, result]);
        if (result) {
            return result;
        }
    }
  }

  let response 
  await axios.get("/api/codes",{
    params: {
      upperCode: param.upperCode
    }
  }).then(res => {
    response = res
  })
  
  let responseData = response.data; //json
  codeObj[param.upperCode] = responseData;
  
  if(import.meta.env.VITE_use_cache_common_code == 'true') { // - 공통코드의 캐쉬 사용여부 체크
    sessionStorage.setItem('v_comm_STORAGE_KEY_COMM_CODE', JSON.stringify(codeObj));
  }

  result = fn_postProcess.apply(this, [param, responseData]);
  if (param.callback) {
      param.callback.apply(this, [result]);
  }
  return result;
}
