<template>
  <!-- <div class="wrapper"> -->
    <!-- <div class="select" @click="toggleActive" ref="selectObj" 
      :style="{
        backgroundColor: readonly ? '#F2F2F2E5' : '#fff'
      }"
    >
      <span class="selected" :style="{
        cursor: !readonly ? 'pointer' : 'default'
      }">{{ _nameValue }}&nbsp;</span>
      <img v-if="!readonly" src="/src/assets/images/icon/search.png" />
    </div> -->
    <div :class="'search-input' + (noline ? ' noline' : '')" ref="selectObj" @click="event => toggleActive(event)">
      <input type="text" :value="_nameValue" readonly v-if="!onlySearchIcon"/>
      <button v-if="!readonly" type="button" class="icon search"></button>
    </div>
    <Teleport to="body">
      <div v-if="active" class="select-background" @click="event => toggleActive(event)" :style="{ zIndex: 50001 }">
        <div class="content" :style="containerStyle" @click="stopBubbling($event)">
          <div class="search-box">
            <img src="/src/assets/images/icon/search.png" class="search-icons" />
            <input class="filter" type="text" placeholder="검색어를 입력하세요" v-model="filterText" @input="filter" @keydown.enter="filter">
          </div>
          <ag-grid-vue
            :style="{
              width: '100%',
              height: popupHeight,
              marginTop: '10px'
            }"
            class="ag-theme-balham"
            rowSelection="single"
            :columnDefs="columnDefs"
            :rowData="_items"
            @grid-ready="(params) => grdList = params.api"
            @firstDataRendered="(params) => {
              comm.sizeColumnsToFit(params)
            }"
            @gridSizeChanged="(params) => {
              comm.sizeColumnsToFit(params)
            }"
            @rowSelected="select"
          >
          </ag-grid-vue>
        </div>
      </div>
    </Teleport>
  <!-- </div> -->
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import comm from "@/utils/comm"

// Grid 관련 객체들
// grid column 정의
const columnDefs = ref([])
// grid object
const grdList = ref()

const active = ref(false)
const selectObj = ref()
const containerStyle = ref({})
const _items = ref([])
const filterText = ref('')

const emit = defineEmits([
  'update:modelValue',
  'update:codeValue',
  'update:nameValue',
  'selected'
])

const props = defineProps({
  modelValue: null,
  codeValue: null,
  nameValue: null,
  readonly: {
    type: Boolean,
    default: false
  },
  items: Array,
  headers: Array,
  code: {
    type: String,
    default: 'CD'
  },
  name: {
    type: String,
    default: 'CD_NM'
  },
  popupWidth: {
    type: String,
    default: '450px'
  },
  popupHeight: {
    type: String,
    default: '300px'
  },
  noline: Boolean,          // - 테두리를 안그릴지 여부
  onlySearchIcon: {         // - 텍스트 영역을 제외하고 돋보기 버튼만 보여줄지 여부
    type: Boolean,
    default: false,
  },
  contentFilter: null,
})

onMounted(() => {
  window.addEventListener('scroll', scroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', scroll)
})

function scroll(event) {
  active.value = false
}

const modelValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const codeValue = computed({
  get() {
    return props.codeValue
  },
  set(value) {
    emit('update:codeValue', value)
  }
})

const nameValue = computed({
  get() {
    return props.nameValue
  },
  set(value) {
    emit('update:nameValue', value)
  }
})

const _nameValue = computed(() => {
  if(props.nameValue) return props.nameValue
  else {
    let selected
    if(props.items) selected = props.items.find((value) => {
      if(props.modelValue) return value[props.code] == props.modelValue[props.code]
      else return value[props.code] == props.codeValue
    })
    if(selected) return selected[props.name]
    else return ''
  }
})

function select(params) {
  modelValue.value = {...params.data}
  codeValue.value = params.data[props.code]
  nameValue.value = params.data[props.name]
  active.value = false
  emit('selected', {...params.data})
}

function filter() {
  if(filterText.value) {
    if(props.contentFilter) {
      _items.value = props.contentFilter(props.items)
    } else {
      _items.value = props.items
    }

    _items.value = _items.value.filter((value) => {
      let flag = false
      props.headers.forEach(header => {
        if(!value[header.field]) { //IsNull
          flag = false
        } else {
          if(value[header.field].toUpperCase().indexOf(filterText.value.toUpperCase()) > -1) flag = true
        }
      })
      return flag
    })
  } else {
    _items.value = props.items
  }
}

function stopBubbling(event) {
  if(event != null) event.stopPropagation() // event 버블링 방지
}

function toggleActive(event) {
  event.stopPropagation()
  
  if(props.readonly) return
  
  if(!active.value) { // select box 열었을 때
    let rect = selectObj.value.getBoundingClientRect()
    // containerStyle.value = {
    //   top: rect.bottom + 'px',
    //   left: rect.left + 'px',
    //   width: props.popupWidth
    // }

    // width 설정
    containerStyle.value.width = props.popupWidth

    // 가로 position 설정
    let windowWidth = window.innerWidth // 창 크기
    let right = rect.left + Number(props.popupWidth.replace('px', '')) // 최종적으로 right point가 되는 지점
    if(right > windowWidth) { // 창 크기보다 최종적으로 right point가 되는 지점이 더 길면
      containerStyle.value.left = `calc(${rect.right}px - ${props.popupWidth})`
    } else {
      containerStyle.value.left = rect.left + 'px'
    }

    // 세로 position 설정
    let windowHeight = window.innerHeight // 창 높이
    let bottom = rect.bottom + Number(props.popupHeight.replace('px', '')) + 76.19 + 5 // 최종적으로 bottom point가 되는 지점
    // 76.19는 그리드 높이 외 컴포넌트 높이, 5는 클릭된 컴포넌트와의 margin 높이임
    if(bottom > windowHeight) { // 창 높이보다 최종적으로 bottom point가 되는 지점이 더 길면
      containerStyle.value.top = `calc(${rect.top}px - ${props.popupHeight} - 76.19px - 5px)`
    } else {
      containerStyle.value.top = `calc(${rect.bottom}px + 5px)`
    }

    // _items.value = props.items
    if(props.contentFilter) {
      _items.value = props.contentFilter(props.items)
    } else {
      _items.value = props.items
    }

    // 검색값 초기화
    filterText.value = ''

    let headerArr = []
    for(let i = 0; i < props.headers.length; i++) {
      headerArr.push({
        headerName: props.headers[i].title,
        field: props.headers[i].field,
        width: props.headers[i].width || 150,
        cellStyle: { "text-align": props.headers[i].align || "center" } 
      })
    }
    columnDefs.value = comm.makeTooltipField(headerArr)
  }

  active.value = !active.value
}
</script>

<style scoped>
/* .wrapper {
	font-family: 'Pretendard', sans-serif;
  display: flex;
  width: 100%;
}
.select {
	width: 100%;
  padding: 7px 9px 7px 14px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  background-color: #fff;
  color: var(--gray-03);
  font-weight: 500;
	font-size: 1.4rem;
	line-height: 130%;
  justify-content: space-between;
}
.selected {
  margin-right: 12px;
}
.select {
  display: flex;
  align-items: center;
} */
.search-input input[type='text'] {
  background-color: #fff;
}
.select-background {
	top: 0;
	left: 0;
	position: fixed;
	z-index: 50000;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
.content {
  min-width: 200px;
  border: 1px solid #CCCCCC;
  position: absolute;
  display: block;
  background: #ffffff;
  /* margin-top: 5px; */
  padding: 15px;
  border-radius: 10px;
}
.content .search-box {
  position: relative;
}
.search-icons {
  left: 10px;
  top: 50%;
  position: absolute;
  transform: translateY(-50%);
}
.search-box input {
	width: 100%;
  padding: 7px 14px 7px 35px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  background-color: #fff;
  color: var(--gray);
  font-weight: 500;
	font-size: 1.4rem;
	line-height: 130%;
}
</style>