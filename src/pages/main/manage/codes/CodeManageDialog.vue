<template>
  <Dialog
    :title="popupTitle"
    :width="810"
    v-model="show"
    @close="close"
  >
    <!-- Table 영역 -->
    <div class="contents">
      <div class="form-wrap">
        <div class="line">
          <div class="item">
            <div class="name">상위코드</div>
            <div class="contents">
              <div v-if="isRegPage" class="flex-column" style="width:100%">
                <PopupSelect
                  v-for="(cdGrp, idx) in conditionCdGrps" :key="idx"
                  @selected="onChangeCdGrp($event, idx)" v-bind="conditionCdGrps[idx]"
                  v-model="conditionCdGrps[idx].modelValue"
                  :headers="[
                    {title: '상위코드', field: 'codeName'},
                  ]"
                ></PopupSelect>
              </div>
              <div v-if="!isRegPage" class="content">{{ popupData.path }}</div>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">코드</div>
            <div class="contents">
              <input :disabled="!isRegPage" type="text" v-model="popupData.code" maxlength="40"/>
            </div>
          </div>
          <div class="item">
            <div class="name">코드명</div>
            <div class="contents">
              <input type="text" v-model="popupData.codeName" maxlength="200"/>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">순서</div>
            <div class="contents">
              <input type="number" v-model="popupData.srt" maxlength="5"/>
            </div>
          </div>
          <div class="item">
            <div class="name">사용여부</div>
            <div class="contents">
              <Select :items="useYnItems" v-model="popupData.useYn"></Select>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">코드설명</div>
            <div class="contents">
              <textarea v-model="popupData.description" maxlength="4000"></textarea>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">기타 1</div>
            <div class="contents">
              <input type="text" v-model="popupData.etc1" maxlength="100"/>
            </div>
            <div class="name">기타 2</div>
            <div class="contents">
              <input type="text" v-model="popupData.etc2" maxlength="100"/>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="item">
            <div class="name">기타 3</div>
            <div class="contents">
              <input type="text" v-model="popupData.etc3" maxlength="100"/>
            </div>
            <div class="name">기타 4</div>
            <div class="contents">
              <input type="text" v-model="popupData.etc4" maxlength="100"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Table 영역 -->
    <div class="bottom-btn-wrap">
      <button type="button" @click="saveCdInfo" class="btn">저장</button>
      <button type="button" @click="close" class="btn sub">닫기</button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, inject, nextTick, computed, watch } from "vue"
import PopupSelect from '@/components/common/PopupSelect.vue'
import comm from "@/utils/comm"

const axios = inject('axios')
const isRegPage = ref()

defineExpose({
  open
})

const emit = defineEmits([
  'callback'
])

// - Popup창의 Show/Hide
const show = ref(false)

// 상위코드 selectbox
const createCodeGroup = (items = []) => ({
  modelValue  : '',
  items       : Array.isArray(items) ? items : [],
  code        : 'code',
  name        : 'codeName',
})

const conditionCdGrps = ref([createCodeGroup()])

// 사용여부 selectbox
const useYnItems = ref([])

const popupData = ref({})

const cd = ref(null), cdNm = ref(null), srt = ref(null) // - Component 참조 : focus용

onMounted(async () => { // - 화면 초기화 처리 : AG Grid가 존재할 경우에는, 그리드가 생성된 후에 처리
  // 1. 콤보박스 구성
  try {
    useYnItems.value = await comm.selectCodeList({upperCode: 'YN', firstRow: ''})
    const { data } = await axios.get("/api/codes")
    
    if (data.length > 0) {
      conditionCdGrps.value[0].items = data.filter(o => o.upperCodeId === null)
    }
  } catch (err) {
    conditionCdGrps.value[0].items = []
  }
})

const popupTitle = ref('')

// Popup Open
async function open(av_params) {
  if (!conditionCdGrps.value.length) {
    conditionCdGrps.value.push(createCodeGroup())
  }

  if (av_params.action === 'create') {
    // - 등록
    isRegPage.value = true
    conditionCdGrps.value[0].modelValue = ''
    popupData.value = {
      useYn: 'Y',
    }
    popupTitle.value = '공통코드 등록'
  } else {
    // - 수정
    isRegPage.value = false
    popupTitle.value = '공통코드 수정'
    try {
      const { data } = await axios.get(`/api/codes/${av_params.id}`)
      popupData.value = data ?? {}

      // 정말로 문자열 'Y'/'N'이 필요할 때만 변환
      if (popupData.value.useYn !== undefined && popupData.value.useYn !== null) {
        popupData.value.useYn = popupData.value.useYn ? 'Y' : 'N'
      }
    } catch (err) {
      comm.alert('error')
    }
  }

  show.value = true;
}

// Popup Close
async function close() {
  show.value = false
  // - 값 초기화
  popupData.value = {}

  // 상위코드 : 최 상위만 남기고 제거 
  conditionCdGrps.value.splice(1)
  if (conditionCdGrps.value[0]) {
    conditionCdGrps.value[0].modelValue = ''
  }
}

// - [저장] 
async function saveCdInfo() {
  // 1. 파라메터 체크
  if (!popupData.value.code) return comm.alert('코드는 필수입니다.').then(() => { cd.value?.focus() })
  if (!popupData.value.codeName) return comm.alert('코드명은 필수입니다.').then(() => { cdNm.value?.focus() })

  if (isRegPage.value) {
    const groups = conditionCdGrps.value
    const len = groups.length
    let selectedParent = null
    if (len > 0) {
      const last = groups[len - 1].modelValue
      if (last && last.codeId) {
        selectedParent = last
      } else if (len > 1) {
        const prev = groups[len - 2].modelValue
        if (prev && prev.codeId) {
          selectedParent = prev
        }
      }
    }
    popupData.value.upperCodeId = selectedParent ? selectedParent.codeId : null

  }

  const payload = {
    upperCodeId: popupData.value.upperCodeId ?? null,
    code: popupData.value.code?.trim() ?? '',
    codeName: popupData.value.codeName?.trim() ?? '',
    description: popupData.value.description?.trim() || null,
    srt: popupData.value.srt !== '' && popupData.value.srt !== null && popupData.value.srt !== undefined
      ? Number(popupData.value.srt)
      : null,
    etc1: popupData.value.etc1?.trim() || null,
    etc2: popupData.value.etc2?.trim() || null,
    etc3: popupData.value.etc3?.trim() || null,
    etc4: popupData.value.etc4?.trim() || null,
    useYn: popupData.value.useYn === true || popupData.value.useYn === 'Y'
  }

  let response
  if (isRegPage.value) {
    response = await axios.post('/api/codes', payload)
  } else {
    if (!popupData.value.codeId) {
      return comm.alert('코드 정보가 올바르지 않습니다.')
    }
    response = await axios.put(`/api/codes/${popupData.value.codeId}`, payload)
  }

  const result = response?.data ?? payload
  await comm.alert('저장되었습니다.')
  emit('callback')
  close()
}

async function onChangeCdGrp(event, idx) {
  // 하위 컴포넌트 제거
  conditionCdGrps.value.splice(idx + 1)
  
  if (event.code === '') {
    return
  }

  const { data } = await axios.get("/api/codes", {
    params: {
      upperCode: event.code
    }
  })
  if (data.length > 0) {
    conditionCdGrps.value.push(createCodeGroup(data))
  }
}

</script>

<style scoped>
/* 드래그 관련 정의 */
.selected {
  background-image: url("/src/assets/images/selected.png") !important;
  /* background-color: rgb(255, 255, 220) !important;*/
}

.user-select {
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}
/* 드래그 관련 정의 */
</style>
