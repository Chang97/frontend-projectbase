<template>
  <a style="display: inline-block; line-height: 18px; vertical-align: center;" v-if="params.renderCond ? params.renderCond(params) : true" 
    :class="(params.class == '' ? '' : (params.class ? params.class : 'link')) + color"
    @click="$event => doClick($event, params)"
    :href="params.href ? (typeof params.href == 'function' ? params.href(params) : params.href) : null"
    >
    <span class="link" v-if="(showHtmlYn == 'Y')" v-html="getContents()" :style="getContentsStyle()" :title="getContentsTitle()"></span>
    <span class="link" v-if="(showHtmlYn != 'Y')" v-text="getContents()" :style="getContentsStyle()" :title="getContentsTitle()"></span>
  </a>
</template>

<script setup>
const props = defineProps({
  /**
   * 추가 옵션
   * - color : a태그에 추가할 class 문자열
   * - showTitleYn : Y(Title 표기), N(Title 표기 안함. Default)
   * - showElipsisYn : Y(길면 말줄임표 처리. Default), N(생략 안하고 모두 표기)
   * - showHtmlYn : Y(Html형식으로 표현), N(Text형식으로 표현. Default)
   */
  params: Object
})

const color = props.params.color ? ' ' + props.params.color : ''
// - showHtmlYn : Y(Html형식으로 표현), N(Text형식으로 표현. Default)
const showHtmlYn = (props.params.showHtmlYn == null || props.params.showHtmlYn == undefined || props.params.showHtmlYn != 'Y') ? 'N' : 'Y'

function doClick(event, params) {
  event.stopPropagation()
  if(props.params.click) props.params.click(params)
}

function getContents() {
  let val = props.params.valueFormatted || props.params.value // valueFormatter가 있으면 먼저 적용
  if(props.params.prepandIcon) {
    val = props.params.prepandIcon + val
  }
  return val
}

// - Title 속성값
function getContentsTitle() {
  if(props.params.showTitleYn == 'Y') {
    return props.params.value
  } else {
    return
  }
}

// - Style 반환 : 말줄임 표기 여부
function getContentsStyle() {
  let contentsStyle = {}
  if(props.params.showElipsisYn != 'Y') {
    contentsStyle['text-overflow'] ='ellipsis'
    contentsStyle['white-space'] ='nowrap'
    contentsStyle['overflow'] ='hidden'
  } else {
    contentsStyle['white-space'] ='normal'
    contentsStyle['display'] ='flex'
  }
  return contentsStyle
}
</script>