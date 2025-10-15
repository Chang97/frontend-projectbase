<template>
  <component 
    :is="params.baseTag" 
    :class="params.class || ''"
    @click="params.click ? params.click(params) : ''"
    v-if="params.renderCond ? params.renderCond(params) : true" 
    v-html="params.template(params)">
  </component>
</template>

<script setup>
const props = defineProps({
  params: Object
})

/* cellRendererParams 설명
  baseTag : 어떤 태그로 감쌀건지 결정, "a"나 "div"나 "span" 등 원하는대로 넣으면 됨
  class : baseTag에 적용될 class
  click : baseTag 클릭 했을때 function

  renderCond : cell에 나타내냐 안나타내냐 조건. 함수 형태로 넣어야됨. 리턴은 true|false
  ex) row에 COLUMN1 컬럼에 데이터가 있으면 나타나고 아니면 아예 사라지는 조건이라면,
  renderCond : (params) => {
    if(params.data.COLUMN1) return true
    else false
  }

  template : cell 내부에 들어갈 템플릿 (그냥 baseTag 적당한거 두고 여기다 다 때려박아도 됨)
  ex) 앞에 word 모양 아이콘이 붙은 cell이라면,
  template : (params) => { // params의 value는 grid api 참고하거나 console 찍어보시면 됩니다
    return `
      <span class="icon word"></span>
      ${params.value}
    `
  }
*/
</script>