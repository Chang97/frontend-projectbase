<template>
  <div>
    <div
      v-if="subText"
      class="label font-16"
      style="margin-bottom: 3px;"
      v-html="subText"
    ></div>
    <SearchBar @search="emitSearch">
      <template #default>
        <SearchRow
          v-for="(row, rowIndex) in condList"
          :key="rowIndex"
          :buttons-row="condList.length - 1 === rowIndex"
          :hide-search="hideSearch"
          :hide-clear="hideClear"
          @search="emitSearch"
          @clear="clearRow(row)"
        >
          <template #extraButtons>
            <slot name="extraButtons" />
          </template>
          <template #default>
            <template
              v-for="(condItem, colIndex) in row"
              :key="colIndex"
            >
              <SearchItem
                v-if="!isHidden(condItem)"
                :label="condItem.condName"
                :wrapper-class="condItem.labelClass || wrapperClass(condItem)"
              >
                <template v-if="!condItem.type || condItem.type === 'text'">
                  <input
                    type="text"
                    :value="modelValueProxy?.[condItem.condCode] ?? ''"
                    @keyup.enter.prevent="onEnter(condItem.condCode, $event.target.value)"
                    @blur="onBlur(condItem.condCode, $event.target.value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'text-readonly'">
                  <input
                    type="text"
                    readonly
                    :value="modelValueProxy[condItem.condCode]"
                  />
                </template>

                <template v-else-if="condItem.type === 'popup'">
                  <div class="search-input">
                    <input
                      type="text"
                    :value="modelValueProxy?.[condItem.condCode] ?? ''"
                    @keyup.enter.prevent="onEnter(condItem.condCode, $event.target.value)"
                    @blur="onBlur(condItem.condCode, $event.target.value)"
                    />
                    <button
                      type="button"
                      class="icon search"
                      @click="condItem.click"
                    ></button>
                  </div>
                </template>

                <template v-else-if="condItem.type === 'popup-select'">
                  <PopupSelect
                    :headers="condItem.headers"
                    :items="comboItems(condItem)"
                    :code="condItem.comboCode || 'code'"
                    :name="condItem.comboName || 'codeName'"
                    :code-value="modelValueProxy?.[condItem.condCode] ?? ''"
                    @update:codeValue="value => setField(condItem.condCode, value)"
                    @selected="value => condItem.onSelected && condItem.onSelected(value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'filter-select'">
                  <FilteredSelect
                    :items="comboItems(condItem)"
                    :code="condItem.comboCode || 'code'"
                    :name="condItem.comboName || 'codeName'"
                    :readonly="condItem.readonly"
                    :model-value="modelValueProxy?.[condItem.condCode] ?? null"
                    @update:modelValue="value => setField(condItem.condCode, value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'filter-multi-select'">
                  <FilteredSelect
                    :items="comboItems(condItem)"
                    :code="condItem.comboCode || 'code'"
                    :name="condItem.comboName || 'codeName'"
                    multiple
                    :model-value="modelValueProxy?.[condItem.condCode] ?? []"
                    @update:modelValue="value => setField(condItem.condCode, value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'select' || condItem.type === 'basic-select'">
                  <Select
                    :items="comboItems(condItem)"
                    :code="condItem.comboCode || 'code'"
                    :name="condItem.comboName || 'codeName'"
                    :model-value="modelValueProxy?.[condItem.condCode] ?? null"
                    :style="selectStyle(condItem)"
                    @update:modelValue="value => setField(condItem.condCode, value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'date'">
                  <input
                    type="date"
                    :value="modelValueProxy?.[condItem.condCode] ?? ''"
                    @change="event => setField(condItem.condCode, event.target.value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'month'">
                  <input
                    type="month"
                    :value="modelValueProxy?.[condItem.condCode] ?? ''"
                    @change="event => setField(condItem.condCode, event.target.value)"
                  />
                </template>

                <template v-else-if="condItem.type === 'period'">
                  <div class="flex-row">
                    <input
                      type="date"
                      :value="modelValueProxy?.[condItem.condCode[0]] ?? ''"
                      @change="event => setField(condItem.condCode[0], event.target.value)"
                    />
                    <span class="innerText">~</span>
                    <input
                      type="date"
                      :value="modelValueProxy?.[condItem.condCode[1]] ?? ''"
                      @change="event => setField(condItem.condCode[1], event.target.value)"
                    />
                  </div>
                </template>

                <template v-else-if="condItem.type === 'period_month'">
                  <div class="flex-row">
                    <input
                      type="month"
                      :value="modelValueProxy?.[condItem.condCode[0]] ?? ''"
                      @change="event => setField(condItem.condCode[0], event.target.value)"
                    />
                    <span class="innerText">~</span>
                    <input
                      type="month"
                      :value="modelValueProxy?.[condItem.condCode[1]] ?? ''"
                      @change="event => setField(condItem.condCode[1], event.target.value)"
                    />
                  </div>
                </template>

                <template v-else>
                  <span class="text-error">[ERROR] invalid condition type</span>
                </template>
              </SearchItem>
            </template>
          </template>
        </SearchRow>
      </template>
    </SearchBar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PopupSelect from '@/components/common/PopupSelect.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import SearchRow from '@/components/common/SearchRow.vue'
import SearchItem from '@/components/common/SearchItem.vue'

const emit = defineEmits(['update:modelValue', 'search'])

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  condList: {
    type: Array,
    default: () => []
  },
  comboList: {
    type: Object,
    default: () => ({})
  },
  condOption: {
    type: Object,
    default: () => ({ autoFullWidth: false })
  },
  subText: {
    type: String,
    default: ''
  },
  hideSearch: {
    type: Boolean,
    default: false
  },
  hideClear: {
    type: Boolean,
    default: true
  },
  initCond: {
    type: Object,
    default: null
  }
})

const initialCondition = ref({})

onMounted(() => {
  initialCondition.value = { ...props.modelValue }
})

const modelValueProxy = computed(() => props.modelValue)

const emitSearch = () => {
  emit('search')
}

const setFields = updates => {
  const next = { ...props.modelValue }
  let changed = false
  Object.entries(updates).forEach(([key, value]) => {
    if (next[key] !== value) {
      next[key] = value
      changed = true
    }
  })
  if (changed) {
    emit('update:modelValue', next)
  }
  return changed
}

const setField = (code, value) => {
  if (Array.isArray(code)) {
    console.warn('setField expects a string key', code)
    return
  }
  setFields({ [code]: value })
}

const onBlur = (code, value) => {
  setField(code, value)
}

const onEnter = (code, value) => {
  setField(code, value)
  emitSearch()
}

const isHidden = condItem => typeof condItem.hidden === 'function' && condItem.hidden()

const comboItems = condItem => {
  const key = condItem.comboItems || condItem.condCode
  return props.comboList?.[key] || []
}

const selectStyle = condItem => {
  if (!condItem.width) {
    return undefined
  }
  return {
    minWidth: condItem.width,
    maxWidth: condItem.width
  }
}

const wrapperClass = condItem => (props.condOption?.autoFullWidth ? 'flex-item' : '')

const resolveInitialValue = condItem => {
  const source = props.initCond ?? initialCondition.value
  if (!source) {
    return undefined
  }
  if (Array.isArray(condItem.condCode)) {
    return condItem.condCode.map(code => source[code])
  }
  return source[condItem.condCode]
}

const clearRow = row => {
  const updates = {}
  row.forEach(condItem => {
    if (Array.isArray(condItem.condCode)) {
      const values = resolveInitialValue(condItem) || []
      condItem.condCode.forEach((code, index) => {
        updates[code] = values[index] ?? ''
      })
    } else if (condItem.type !== 'text-readonly') {
      updates[condItem.condCode] = resolveInitialValue(condItem) ?? ''
    }
  })
  setFields(updates)
  emitSearch()
}
</script>

<style scoped>
:deep(.innerText) {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 5px;
  font-size: 1.4rem;
}
:deep(.search-input input) {
  max-width: 240px;
}
</style>
