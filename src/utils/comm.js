/**
 * 공통 유틸 모듈.
 * 실제 서비스에서 교체될 수 있도록 최소 구현만 제공한다.
 */

const comm = {
  /**
   * 객체의 열거 가능한 속성 수를 반환한다.
   */
  getObjectLength(obj) {
    if (!obj || typeof obj !== 'object') {
      return 0
    }
    return Object.keys(obj).length
  },

  /**
   * null/undefined/빈 문자열 여부를 판별한다.
   */
  isNull(value) {
    return value === null || value === undefined || value === ''
  },

  /**
   * 데이터 변경 여부 확인.
   * 현재는 항상 true를 반환하지만, 추후 변경감지 로직을 연동할 수 있다.
   */
  async confirmDataModified() {
    return true
  },

  /**
   * 화면 단에서 관리하던 변경 상태를 초기화한다.
   * 기본 구현은 no-op.
   */
  resetDataListInView() {
    // no-op
  },

  /**
   * 사용자에게 메시지를 표시한다.
   * 토스트/모달 등의 UI 컴포넌트로 대체 가능하도록 분리해 둔다.
   */
  alert(message, title) {
    const prefix = title ? `[${title}] ` : ''
    window.alert(`${prefix}${message}`)
  },

  confirm(message, title) {
    const prefix = title ? `[${title}] ` : ''
    return window.confirm(`${prefix}${message}`)
  }
}

export default comm
