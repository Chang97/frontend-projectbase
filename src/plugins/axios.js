import axios from "axios"
import qs from "qs"

let config = {
  // baseURL: '/api',
  baseURL: import.meta.env.VITE_axios_baseURL,
  // timeout: 60 * 1000, // Timeout
  withCredentials: true, // Check cross-site Access-Control
  paramsSerializer: { // `paramsSerializer` is an optional function in charge of serializing `params`. (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
    serialize : (params) => {
      /*
       * - { }(일반적인 object) : qs.stringify(params)를 이용해서 처리(String으로 변환됨)
       * - URLSearchParams() : 그대로 반환
       * 
       * cf) paramsSerializer을 사용하게 된 사유 : axios의 get방식 통신 중 파라메터값에 "[]"이 들어가면, cors 오류가 발생함(axios v1.6.0에서 []을 url encoding하지 않는 이슈가 존재함. https://github.com/axios/axios/issues/3316)
       */
      let returnVal = null
      if(typeof params == 'object' && params.constructor != undefined && params.constructor.name == 'URLSearchParams') {
        returnVal = params
      } else if(typeof params == 'object') {
        returnVal = qs.stringify(params)
      } else {
        returnVal = qs.stringify(params)
      }
      //console.log(params, returnVal, 'object name=' + (typeof params == 'object' && params.constructor != undefined ? params.constructor.name : 'N/A'))
      return returnVal
    }
  },
}

const _axios = axios.create(config)

_axios.interceptors.request.use(
  function(config) {
    return config
  },
  function(error) {
    return Promise.reject(error)
  }
);

function recurMakeId(obj) {
  if(Array.isArray(obj)) {
    for(let idx in obj) {
      if(obj[idx] && typeof obj[idx] == "object") {
        obj[idx]['__id'] = idx
        obj[idx]['__crud'] = 'R'
        for(let key in obj[idx]) {
          if(typeof obj[idx][key] == "object") recurMakeId(obj[idx][key])
        }
      }
    }
  } else {
    for(let key in obj) {
      if(typeof obj[key] == "object") recurMakeId(obj[key])
    }
  }
}

// Add a response interceptor
_axios.interceptors.response.use(
  async function(response) {
    let errmsg = response?.data?.__errmsg__;
    if (!errmsg) { //정상
      for(let key in response.data) {
        let dataItem = response.data[key]
        recurMakeId(dataItem)
      }
    }

    if (errmsg) { //error -> json(errmsg)
      let msgVar = response?.data?.msgargs;
      alert({msgKey: errmsg, msgVar: msgVar}, 'Error')
      
      return Promise.reject(new Error(errmsg))
    }
    
    return response
  },
  async function(error) {

    let errmsg = error?.response?.data?.__errmsg__?? 'error';
    let msgVar = error?.response?.data?.msgargs;
    alert({msgKey: errmsg, msgVar: msgVar}, 'Error')
    
    return Promise.reject(error)
  }
)

// export default import.meta.env.VITE_use_dummyData == "true" ? dummyDataLoader : _axios
export default _axios