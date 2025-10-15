import { useAlertStore } from '@/stores/alert'
import { useConfirmStore } from '@/stores/confirm'
import comm from './comm'

export async function alert(msg, title) {
  let _msg
  let _title = title
  let msgKey

  if(typeof msg == "string") {
    _msg = msg
  } else if(typeof msg == "object") {
    msgKey = msg.msgKey
    _msg = msgKey
    /* msgKey 로직을 사용하지 않으므로, 그대로 넘김
    if(msg.msgVar) {
      for(let idx in msg.msgVar) {
        _msg = _msg.replaceAll(`{${idx}}`, msg.msgVar[idx])
      }
    }
    // msgKey 쓸 때에는 아마도 태그 문자열은 안쓰겠지...
    _msg = comm.escapeHTML(_msg)
    */
  }

  return await _alert(_msg, _title)
}

function _alert(msg, title) {
  let alertStore = useAlertStore()
  alertStore.$patch({
    show: true,
    title: title,
    msg: msg
  })

  return new Promise(resolve => {
    alertStore.$subscribe((mutation, state) => {
      if(!state.show) {
        resolve()
      }
    })
  })
}

export async function confirm(msg, title) {
  return await _confirm(msg, title)
}

function _confirm(msg, title) {
  let confirmStore = useConfirmStore()
  confirmStore.$patch({
    show: true,
    title: title,
    msg: msg
  })
  
  return new Promise(resolve => {
    confirmStore.$subscribe((mutation, state) => {
      if(!state.show) {
        resolve(confirmStore.result)
      }
    })
  })
}