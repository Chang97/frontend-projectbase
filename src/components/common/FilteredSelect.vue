<template>
  <div class="wrapper">
    <div class="select" @click="toggleActive($event)" ref="selectObj" 
      :style="{
        backgroundColor: readonly ? '#e0e0e0' : '',
        color: readonly ? 'rgba(76, 73, 72, 0.50)' : ''
      }"
    >
      <span class="selected" :style="{
        cursor: !readonly ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }" :title="multiple ? _tooltipValue : _nameValue">{{ _nameValue }}&nbsp;</span>
      <img v-if="!readonly" src="/src/assets/images/icon/icon-combo-box.png" class="expand-icons" />
    </div><!--select-->
    <Teleport to="body">
      <div v-if="active" class="select-background" @click="toggleActive($event)" :style="{ zIndex: 50001 }">
        <div ref="selectBox" class="content" :style="containerStyle" @click="stopBubbling($event)">
          <div v-if="!noFilter" class="search-box">
            <img src="/src/assets/images/icon/search.png" class="search-icons" />
            <input class="filter" type="text" placeholder="검색어를 입력하세요"
              @input="filter"
              @keydown.enter="filter"
            >
          </div><!--search box-->
          <ul class="options">
            <li v-for="item in _items" :key="item" @click="select($event, item)">
              <input type="checkbox"
                v-if="multiple" :checked="item['checked']"
                :style="{
                  width: '20px',
                  marginRight: '5px'
                }"
              >
              {{ item[name] }}
            </li>
          </ul>
        </div><!--content-->
      </div>
    </Teleport>
  </div><!--wrapper-->
</template>

<script setup>
import { watch, computed, ref, onMounted, onUnmounted } from 'vue'

const active = ref(false)
const selectObj = ref()
const selectBox = ref()
const containerStyle = ref({})
const _items = ref([])

const emit = defineEmits([
  'update:modelValue',
  'update:nameValue',
  'update:selectedValue'
])

const props = defineProps({
  modelValue: null,
  nameValue: null,
  selectedValue: null,
  readonly: {
    type: Boolean,
    default: false
  },
  items: Array,
  code: {
    type: String,
    default: 'CD'
  },
  name: {
    type: String,
    default: 'CD_NM'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  noFilter: {
    type: Boolean,
    default: false
  }
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

const nameValue = computed({
  get() {
    return props.nameValue
  },
  set(value) {
    emit('update:nameValue', value)
  }
})

const selectedValue = computed({
  get() {
    return props.selectedValue
  },
  set(value) {
    emit('update:selectedValue', value)
  }
})

const _nameValue = computed(() => {
  if(props.nameValue) return props.nameValue
  else {
    if(!props.multiple) {
      let selected
      if(props.items) selected = props.items.find((value) => value[props.code] == props.modelValue)
      if(selected) return selected[props.name]
      else return ''
    } else {
      if(modelValue.value && modelValue.value.length > 0) {
        let nameString = ''
        if(modelValue.value.length > 1) {
          nameString = modelValue.value.length + ' 개 선택됨'
          // for(let i = 0; i < modelValue.value.length; i++) {
          //   nameString += modelValue.value[i][props.name] + (i < modelValue.value.length - 1 ? ', ' : '')
          // }
        } else nameString = modelValue.value[0][props.name]
        return nameString
      } else return ''
    }
  }
})

const _tooltipValue = computed(() => {
  if(props.nameValue) return props.nameValue
  else {
    if(!props.multiple) {
      let selected
      if(props.items) selected = props.items.find((value) => value[props.code] == props.modelValue)
      if(selected) return selected[props.name]
      else return ''
    } else {
      if(modelValue.value && modelValue.value.length > 0) {
        let nameString = ''
        if(modelValue.value.length > 1) {
          // nameString = modelValue.value.length + ' 개 선택됨'
          for(let i = 0; i < modelValue.value.length; i++) {
            nameString += modelValue.value[i][props.name] + (i < modelValue.value.length - 1 ? ', ' : '')
          }
        } else nameString = modelValue.value[0][props.name]
        return nameString
      } else return ''
    }
  }
})

function stopBubbling(event) {
  if(event != null) event.stopPropagation() // event 버블링 방지
  }

function select(event, item) {
  if(event != null) stopBubbling(event)

  if(props.multiple) {
    // 없는 경우로 보고 주석처리
    // if(!modelValue.value) {
    //   modelValue.value = []
    // }

    if(item.checked) {
      item.checked = false
      let find = modelValue.value.findIndex(value => value[props.code] == item[props.code])
      modelValue.value.splice(find, 1)
    } else {
      item.checked = true
      modelValue.value.push(item)
    }
  } else {
    modelValue.value = item[props.code]
    nameValue.value = item[props.name]
    selectedValue.value = item
    active.value = false
  }
}

function filter(event) {
  let filterText = event.target.value

  if(filterText) {
    _items.value = props.items.filter((value) => {
      if(value[props.name].toUpperCase().indexOf(filterText.toUpperCase()) > -1) return true
    })
  } else {
    _items.value = props.items
  }
}

function toggleActive(event) {
  if(props.readonly) return
  // 버블링 막기위해 추가
  if(event != null) stopBubbling(event)
  
  if(!active.value) { // select box 열었을 때
    let rect = selectObj.value.getBoundingClientRect()
    containerStyle.value = {
      top: rect.bottom + 'px',
      left: rect.left + 'px',
      minWidth: rect.width + 'px'
    }

    _items.value = props.items
  }

  active.value = !active.value
}

watch(selectBox, (newVal) => {
  if(newVal) {
    let rectSelObj = selectObj.value.getBoundingClientRect()
    let rectSelBox = selectBox.value.getBoundingClientRect()

    // 포지션 조정
    // 가로 position 설정
    let windowWidth = window.innerWidth // 창 크기
    let right = rectSelObj.left + rectSelBox.width // 최종적으로 right point가 되는 지점
    if(right > windowWidth) { // 창 크기보다 최종적으로 right point가 되는 지점이 더 길면
      containerStyle.value.left = `calc(${rectSelObj.right}px - ${rectSelBox.width}px)`
    } else {
      containerStyle.value.left = rectSelObj.left + 'px'
    }

    // 세로 position 설정
    let windowHeight = window.innerHeight // 창 높이
    let bottom = rectSelObj.bottom + rectSelBox.height // 최종적으로 bottom point가 되는 지점
    if(bottom > windowHeight) { // 창 높이보다 최종적으로 bottom point가 되는 지점이 더 길면
      containerStyle.value.top = `calc(${rectSelObj.top}px - ${rectSelBox.height}px - 5px)`
    } else {
      containerStyle.value.top = `calc(${rectSelObj.bottom}px + 5px)`
    }
  }
})
</script>

<style scoped>
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
.wrapper{
	font-family: 'Pretendard', sans-serif;
  display: flex;
  justify-content: center;
}
.select{
	width: 100%;
  min-width: 120px;
  /* max-width: 240px; */
  height: 36px;
  padding: 7px 9px 7px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fff;
  color: var(--gray);
  font-weight: 500;
	font-size: 1.4rem;
	line-height: 130%;
  justify-content: space-between;
}
.selected {
  margin-right: 12px;
}
.select, .options li{
  display: flex;
  cursor: pointer;
  align-items: center;
}
.content{
  min-width: 200px;
  border: 1px solid #CCCCCC;
  position: absolute;
  display: block;
  background: #ffffff;
  /* margin-top: 5px; */
  padding: 12px;
  border-radius: 10px;
}
.content .search-box{
  position: relative;
}
.search-icons {
  left: 10px;
  top: 50%;
  position: absolute;
  transform: translateY(-50%);
}
.search-box input{
	width: 100%;
  padding: 7px 14px 7px 35px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  background-color: #fff;
  color: var(--gray-03);
  font-weight: 500;
	font-size: 1.4rem;
	line-height: 130%;
}
.content .options{
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}
.options li{
  line-height: 30px;
  padding: 0 13px 0 5px;
  border-radius: 7px;
	font-size: 1.4rem;
  display: flex;
  align-content: flex-start;
}
.options li:hover{
  background: #f2f2f2;
}
</style>