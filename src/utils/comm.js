import axios from '@/plugins/axios'
import * as agGird_comm from './comm.agGrid'
import * as code_comm from './comm.code'
import * as message_comm from './comm.message'


function isPlainObject(o) {
  return !!o && (typeof o === 'object' && !Array.isArray(o));
}

// 엑셀 템플릿 다운로드 시 url 파라미터 문자열로 변환
function objectToQueryString(obj) {
  const queryString = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      // encodeURIComponent 함수를 사용하여 값 인코딩
      queryString.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  
  return queryString.join("&");
}

export default {

  // comm.agGrid.js
  setQuickFilterInTree: agGird_comm.setQuickFilterInTree,
  actionTreeFilterPass: agGird_comm.actionTreeFilterPass,
  sizeColumnsToFit: agGird_comm.sizeColumnsToFit,
  makeTooltipField: agGird_comm.makeTooltipField,
  agGridAddRows: agGird_comm.agGridAddRows,
  agGridRemoveRows: agGird_comm.agGridRemoveRows,
  agGridForcedRemoveRows: agGird_comm.agGridForcedRemoveRows,
  agGridRemoveSelectedRows: agGird_comm.agGridRemoveSelectedRows,
  agGridUpdateRow: agGird_comm.agGridUpdateRow,
  agGridUpdateRows: agGird_comm.agGridUpdateRows,
  agGridForcedUpdateRows: agGird_comm.agGridForcedUpdateRows,
  agGridFindBindedRowIndex: agGird_comm.agGridFindBindedRowIndex,
  agGridNumberFormat: agGird_comm.agGridNumberFormat,
  isDataChanged: agGird_comm.isDataChanged,
  getDefaultCheckBoxDef: agGird_comm.getDefaultCheckBoxDef,
  isAgGridDataModified: agGird_comm.isAgGridDataModified,
  getGridColDef: agGird_comm.getGridColDef,

  // comm.code.js
  getObjectLength: code_comm.getObjectLength,
  selectCodeList: code_comm.selectCodeList,
  selectOrgList: code_comm.selectOrgList,
  selectOrgMultiList: code_comm.selectOrgMultiList,
  selectUserList: code_comm.selectUserList,
  selectUserMultiList: code_comm.selectUserMultiList,
  selectPstnList: code_comm.selectPstnList,
  selectStcmList: code_comm.selectStcmList,
  selectPstnOrgList: code_comm.selectPstnOrgList,
  selectUserOrgDetail: code_comm.selectUserOrgDetail,
  selectHistYmdList: code_comm.selectHistYmdList,
  selectPstnHistList: code_comm.selectPstnHistList,
  selectPstnQuarterHistList: code_comm.selectPstnQuarterHistList,
  selectEfctMstList: code_comm.selectEfctMstList,

  // comm.message.js
  alert: message_comm.alert,
  confirm: message_comm.confirm,

  /*
    임시 함수 (데이터셋 넣으면 콤보리스트로 만들어줌)
  */
  getComboListByData: (list) => {
    function getOnlyNumber(str) {
      let pattern_special = /[~!@#$%^&*()\-=_+’]/gi
      let pattern_kor = /[ㄱ-ㅎ가-힣]/g
      let pattern_eng = /[A-Za-z]/g
  
      if (pattern_special.test(str) || pattern_kor.test(str) || pattern_eng.test(str)) {
        return Number(str.replace(/[^0-9]/g, ""))
      } else {
        return Number(str)
      }
    }
    let rtn = {}
    if(list.length > 0) {
      for (let key of Object.keys(list[0])) {
        if(typeof list[0][key] == "string") rtn[key] = []
      }

      list.forEach(row => {
        for (let key of Object.keys(rtn)) {
          if(row[key] && !rtn[key].find(value => value.CD == row[key])) rtn[key].push({CD: row[key], CD_NM: row[key]})
        }
      })

      for (let key of Object.keys(rtn)) {
        if(rtn[key] && rtn[key].length > 0) {
          rtn[key].sort((a, b) => {
            return getOnlyNumber(b.CD) - getOnlyNumber(a.CD) 
          })
        }
      }
    }
    return rtn
  },
  /*
    임시 함수2 (rowId 넣어줌 (axios 쓸 때처럼))
  */
  setRowId: (list) => {
    function recurMakeId(obj) {
      if(Array.isArray(obj)) {
        for(let idx in obj) {
          obj[idx]['__id'] = idx
          obj[idx]['__crud'] = 'R'
          for(let key in obj[idx]) {
            if(typeof obj[idx][key] == "object") recurMakeId(obj[idx][key])
          }
        }
      } else {
        for(let key in obj) {
          if(typeof obj[key] == "object") recurMakeId(obj[key])
        }
      }
    }

    recurMakeId(list)

    return list
  },

  /**
   * agGridNumberFormat 메서드의 범용 버전
   * number에 formatting 처리를 함
   * @param {*} value 
   * @param {*} options { nullToZero, maximumFractionDigits, minimumFractionDigits, prefixUnit, subffixUnit, unit }
   */
  numberFormatter: (value, options) => {
    if(options == null || options == undefined) {
      options = { nullToZero : false, maximumFractionDigits : 3, minimumFractionDigits : 0, prefixUnit : '', subffixUnit : '' }
    }
    if(options.nullToZero == null || options.nullToZero == undefined) options.nullToZero = false                              // - Null을 "0"으로 반환할지 여부.
    if(options.maximumFractionDigits == null || options.maximumFractionDigits == undefined) options.maximumFractionDigits = 3 // - 기본형은 소수점 3째자리까지만 표현
    if(options.minimumFractionDigits == null || options.minimumFractionDigits == undefined) options.minimumFractionDigits = 0 // - 기본형은 모두 표현하는 소수점 0째자리까지만 표현 : ex) 2로 설정시, 2.0 -> 2.00
    if(options.prefixUnit == null || options.prefixUnit == undefined) options.prefixUnit = ''                                 // - 숫자 앞에 표현할 문자열
    if(options.subffixUnit == null || options.subffixUnit == undefined) options.subffixUnit = ''                              // - 숫자 뒤에 표현할 문자열
    if(options.unit == null || options.unit == undefined) options.unit = ''                                                   // - 숫자를 표현할 단위. 보통 %만 사용(%는 *100으로 표현)
    let val = value
    if(val === null || val === undefined || val === '') return (options.nullToZero ? (options.prefixUnit + '0' + options.subffixUnit) : '')
    if(options.unit == '%') {
      val = val * 100 // - 단위가 %이면, *100 붙이기
    }
    let intlOption = { maximumFractionDigits : options.maximumFractionDigits, minimumFractionDigits : options.minimumFractionDigits }
    return options.prefixUnit + (new Intl.NumberFormat('ko-KR', intlOption)).format(val) + options.subffixUnit
  },
  /**
   * input type number에 숫자만 들어가게 하기
   * 사용법 oninput={(event) => oninputOnlyNumber(event, {maxFractionDigits: 4})} // maxFractionDigits 기본값이 4임
   * @param {*} event (oninputevent) 
   * @param {*} option
   */
  oninputOnlyNumber: (event, option) => {
    let maxFractionDigits = 3
    let maxDigits = -1
    if(option) {
      if(option.maxFractionDigits) maxFractionDigits = option.maxFractionDigits
      if(option.maxDigits) maxDigits = option.maxDigits
    }
    event.target.value = event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    if(event.target.value.indexOf('.') != -1) {
      if(event.target.value.split('.')[1].length > maxFractionDigits){
        event.target.value = event.target.value.substring(0, event.target.value.length - (event.target.value.split('.')[1].length - maxFractionDigits))
      }
    }
    if(maxDigits > -1 && event.target.value.split('.')[0].length > maxDigits) {
      let decimal = event.target.value.split('.')[0].substring(0, event.target.value.split('.')[0].length - (event.target.value.split('.')[0].length - maxDigits)) 
      let fractal = event.target.value.split('.')[1]
      event.target.value = decimal
      if(fractal) event.target.value += '.' + fractal
    }
    if(event.target.value == '.') event.target.value = '0.'
  },
  nvl : (objValue, defValue) => {
    return (objValue == null || objValue == undefined) ? defValue : objValue;
  },
  isNull : (str) => {
    if (str == null) return true;
    if (str == "NaN") return true;
    if (new String(str).valueOf() == "undefined") return true;
    var chkStr = new String(str);
    if( chkStr.valueOf() == "undefined" ) return true;
    if (chkStr == null) return true;
    if (chkStr.toString().length == 0 ) return true;
    return false; 
  },
  /**
   * date문자열 -> Date객체
   * @param {*} s 
   */
  pareseDate : (s) => {
    if (!s)
      return new Date();
    var ss;
    if (s.indexOf("-")!=-1) {
      ss = (s.split("-"));
    } else if (s.indexOf("/")!=-1) {
      ss = (s.split("/"));
    } else if (s.length==8) {
      ss = [
        s.substring(0,4),
        s.substring(4,6),
        s.substring(6,8)
      ];
    } else {
      return new Date();
    }
    
    var y = parseInt(ss[0], 10);
    var m = parseInt(ss[1], 10);
    var d = parseInt(ss[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    } else {
      return new Date();
    }
  },
  /**
   * Date객체 -> date문자열
   * @param {*} date 
   * @param {*} delim 
   */
  formatDate : (date, delim) => {
    if (!date)
      return "";
    if (delim==null || delim==undefined)
      delim = "-";
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var dateStr = y + delim + (m < 10 ? ("0" + m) : m) + delim + (d < 10 ? ("0" + d) : d);
    return dateStr;
  },
  /**
   * download 받을 때 datestring 얻는 function
   * ex) 20240530_152800
   */
  getDownloadDate : () => {
    let date = new Date()
    let y = date.getFullYear()
    let m = date.getMonth() + 1
    let d = date.getDate()
    let h = date.getHours()
    let min = date.getMinutes()
    let s = date.getSeconds()
    let dateStr = `${y}${(m < 10 ? ("0" + m) : m)}${(d < 10 ? ("0" + d) : d)}_${(h < 10 ? ("0" + h) : h)}${(min < 10 ? ("0" + min) : min)}${(s < 10 ? ("0" + s) : s)}`
    return dateStr
  },
  /**
   * return date + months (type date)
   * @param {*} date 
   * @param {*} months 
   */
  addMonth : (date, months) => {
    if (!date)
      return new Date()
    if (months==null || months==undefined)
      return date
    let _date = new Date(date)
    _date.setMonth(date.getMonth() + months)
    return _date
  },
  /**
   * 시작날짜와 종료날짜 유효성 검사
   * @param {String} start_date format : YYYY-MM-DD
   * @param {String} end_date   format : YYYY-MM-DD
   * */
  validateDates (start_date, end_date) {
    // 현재 날짜를 얻기
    const currentDate = new Date();
    
    // start_date와 close_date를 Date 객체로 변환
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // start_date와 end_date가 올바른 날짜 형식인지 확인
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      message_comm.alert('유효하지 않은 날짜 형식입니다.')
      return false
    }

    // start_date가 현재 날짜 이전인지 확인
    if (startDate > currentDate) {
      message_comm.alert('시작 날짜는 현재 날짜보다 이전이어야 합니다')
      return false
    }

    // end_date가 start_date 이후인지 확인
    if (endDate < startDate) {
      message_comm.alert('종료 날짜는 시작 날짜 이후여야 합니다.') 
      return false
    }
    return true
  },
  /**
   * 문자열에 한글 포함여부 반환
   * @param {*} str 
   */
  hasKoreanAlphabet(str) {
    if(str === null || str === undefined || str === '') return false
    let regExp = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|ᄀ-ᇿ]/g // - UTF-16의 4352 ~ 4607 사이의 한글도 체크
    if(regExp.test(str)) {
      return true
    } else {
      return false
    }
  },

  /**
   * 파일명으로 허용되는 문자는 영어/숫자/특수기호이다.
   * true: 정규식 통과
   */
  isFailFileNameRegexp(fileName) {
    if(fileName === null || fileName === undefined || fileName === '') return false
    let regExp = /[a-zA-Z0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/g // - UTF-16의 4352 ~ 4607 사이의 한글도 체크
    // let regExp = /\d\w\D/g // - UTF-16의 4352 ~ 4607 사이의 한글도 체크
    if((fileName.replace(regExp, '')).length > 0) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * 문자열에서 한글 삭제해서 반환
   * @param {*} str 
   */
  removeKoreanAlphabet(str) {
    if(str === null || str === undefined || str === '') return str
    let regExp = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|ᄀ-ᇿ]/g // - UTF-16의 4352 ~ 4607 사이의 한글도 체크
    if(regExp.test(str) && (typeof str).toUpperCase() === 'STRING') {
      return str.replace(regExp, '')
    } else {
      return str
    }
  },

  /**
   * 첨부파일 목록 배열로 조회
   * @param {*} FILE_ID 
   * @param {*} param 
   */
  async selectAtchFileList(FILE_ID, param) {
    let result = []
    // 1. 파라메터 처리 : 최종적으로는, param.FILE_ID에 FILE_ID를 넣게 하기
    if (isPlainObject(FILE_ID)) {
      param = FILE_ID;
    } else {
      param = param || {};
      if(!!FILE_ID) {
        param.FILE_ID = FILE_ID;
      }
    }
    // - FILE_ID가 존재하지 않으면, 빈값 반환
    if (param.FILE_ID == null || param.FILE_ID == undefined || param.FILE_ID == '') {
      return result;
    }
    // 2. 데이터 조회
    let response = await axios({
      url           : "/main/common/AtchFile/selectList.do",
      method        : "get",
      params        : param,
      responseType  : "json",
    });
    if (response != null && response != undefined && response.data != null && response.data != undefined) {
      result = response.data.list
    }
    return result
  },

  uploadAtchFile(FILE_ID, list, preCallback, postCallback) {
    let param;
    if (isPlainObject(FILE_ID)) {
      param = FILE_ID;
    } else {
      param = {
        FILE_ID: FILE_ID,
        list: list,
        preCallback: preCallback,
        postCallback: postCallback,
      };
    }

    if (param.preCallback) param.preCallback.apply(this, []);
    
    const formData = new FormData();
    formData.append('FILE_ID', param.FILE_ID);
    formData.append('GB_CD', param.GB_CD || '');
    param.list.forEach(o => {
      if (o.isNew) formData.append('atchFile', o.blob, o.FILE_NM);
    });

    // 추가된 파일이 있을 경우 업로드
    if (formData.get('atchFile')) {
      axios({
        url: "/main/common/AtchFile/upload.do",
        method: 'post',
        data: formData
      })
      .then(async response => {
        if (param.postCallback) {
          param.success = true;
          param.FILE_ID = response.data.FILE_ID;
          param.postCallback.apply(this, [param]);
        }
      })
      .catch(error => {
        if (param.postCallback) {
          param.success = false;
          param.postCallback.apply(this, [param]);
        }
      });
    } else { // 추가된 파일 없음
      param.success = true;
      param.postCallback.apply(this, [param]);
    }
  },
  uploadAtchFilePromise(FILE_ID, list) {
    return new Promise((resolve, reject) => {
      let param;
      if (isPlainObject(FILE_ID)) {
        param = FILE_ID;
      } else {
        param = {
          FILE_ID: FILE_ID,
          list: list,
        };
      }
      
      const formData = new FormData();
      formData.append('FILE_ID', param.FILE_ID);
      formData.append('GB_CD', param.GB_CD || '');
      param.list.forEach(o => {
        if (o.isNew) formData.append('atchFile', o.blob, o.FILE_NM);
      });
  
      // 추가된 파일이 있을 경우 업로드
      if (formData.get('atchFile')) {
        axios({
          url: "/main/common/AtchFile/upload.do",
          method: 'post',
          data: formData
        })
        .then(async response => {
          param.success = true;
          param.FILE_ID = response.data.FILE_ID;
          resolve(param)
        })
        .catch(error => {
          param.success = false;
          reject(param)
        });
      } else { // 추가된 파일 없음
        param.success = true;
        resolve(param)
      }
    })
  },

  /**
   * 첨부파일 다운로드
   * @param {*} FILE_ID 
   * @param {*} ITEM_NO 
   */
  downloadAtchFile(FILE_ID, ITEM_NO) {
    let param =
      isPlainObject(FILE_ID)?
      FILE_ID:
      {FILE_ID: FILE_ID, ITEM_NO: ITEM_NO}
    ;
    
    if (param.FILE_ID==undefined || param.ITEM_NO==undefined) {
      message_comm.alert('업로드 되지 않은 파일입니다.')
      return;
    }
    location.href = this.getAtchFileUrl({FILE_ID:param.FILE_ID, ITEM_NO:param.ITEM_NO, action:"download"});
  },

  /**
   * 복수 첨부파일 다운로드
   * @param {Array} FILE_ID_LIST [ Map {*FILE_ID, FOLDER_NM} ] FOLDER_NM 입력 안할시에는 zip파일 최상위에 저장됨
   * @param {String} ZIP_FILE_NM
   */
  async downloadMultiAtchFile(FILE_ID_LIST, ZIP_FILE_NM) {
    let itemCnt = 0;
    for (let obj of FILE_ID_LIST) {
      let result = await this.selectAtchFileList(obj.FILE_ID);
      itemCnt += result.length;
      if (itemCnt > 0) break;
    }
    
    // 다운로드할 파일이 없는 경우 alert
    if (FILE_ID_LIST.length < 1 || itemCnt == 0) {
      this.alert("다운로드할 파일이 없습니다.");
      return;
    }
    
    let fileList = JSON.stringify(FILE_ID_LIST);

    let url = import.meta.env.VITE_axios_baseURL+"/main/common/AtchFile/downloadMultiFile.do?ZIP_FILE_NM=" + encodeURIComponent(ZIP_FILE_NM) + "&FILE_LIST=" + encodeURIComponent(fileList);
    location.href = url;
  },

  /**
   * 첨부파일 다운로드 URL 생성
   * @param {*} FILE_ID 
   * @param {*} ITEM_NO 
   * @param {*} action 
   * @returns 
   */
  getAtchFileUrl(FILE_ID, ITEM_NO, action) {
    let param = isPlainObject(FILE_ID)?
      FILE_ID:
      {FILE_ID: FILE_ID, ITEM_NO: ITEM_NO, action:action}
    ;
    
    if (param.FILE_ID==undefined || param.ITEM_NO==undefined) {
      message_comm.alert('업로드 되지 않은 파일입니다.')
      return;
    }
    if (param.action==null) {
      param.action = "download";
    }
    
    let url;
    if (param.action=="download") {
      url = import.meta.env.VITE_axios_baseURL+"/main/common/AtchFile/download.do?FILE_ID="+encodeURIComponent(param.FILE_ID)+"&ITEM_NO="+encodeURIComponent(param.ITEM_NO);
    } else if (param.action=="view") {
      url = import.meta.env.VITE_axios_baseURL+"/main/common/AtchFile/view.do?FILE_ID="+encodeURIComponent(param.FILE_ID)+"&ITEM_NO="+encodeURIComponent(param.ITEM_NO);
    }
    return url;
  },

  arrayDeepCopy(org) {
    return org.map(item => {
      if (Array.isArray(item)) {
        return this.arrayDeepCopy(item)
      } else if (item !== null && typeof item === 'object') {
        if (item instanceof Blob) {
            return new Blob([item], { type: item.type })
        } else {
            return this.objDeepCopy(item)
        }
      } else {
        return item
      }
    })
  },

  objDeepCopy(org) {
    let rtn = {}
    for(let key in org) {
      if(Array.isArray(org[key])) {
        rtn[key] = this.arrayDeepCopy(org[key])
      } else if(org[key] !== null && typeof org[key] == 'object') {
        if (org[key] instanceof Blob) {
            rtn[key] = new Blob([org[key]], { type: org[key].type });
        } else {
            rtn[key] = this.objDeepCopy(org[key]);
        }
      } else {
        rtn[key] = org[key]
      }
    }
    return rtn
  },

  escapeHTML(str) {
    return (str === undefined || str === null) ? str : str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  },

  getExcelDownloadParams(cond, array) {
    // 혹시 롤백될까봐 공통 함수로 뺌
    let _cond = {}

    if(array) {
      array.forEach(key => {
        _cond[key] = cond[key]
      })
    }

    return _cond
  },

  async convertHtmlToDocx(htmlContent, fileName = 'document.docx', options = {}) {
    // 용지방향 기본값을 'portrait'으로 설정 (세로방향)
    // 용지 방향 가로 사용시 options에 { orientation: 'landscape' } 추가
    const { orientation = 'portrait' } = options;

    // htmlDocx-js가 내부적으로 orientation을 처리하게 함
    const blob = window.htmlDocx.asBlob(htmlContent, { orientation });

    this.triggerBlobDownload(blob, fileName);
  },
  convertHtmlToDoc(htmlContent, fileName = 'document.doc') {
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    this.triggerBlobDownload(blob, fileName)
  },

  triggerBlobDownload(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  },


  

}