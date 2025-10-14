<template>
  <section class="content">
    <div class="content-box gap-24">
      <header class="flex-row space middle pb16">
        <h2>공통 코드 관리</h2>
        <div class="flex-row gap-8">
          <button class="btn sub" type="button" @click="resetForm">신규</button>
          <button class="btn" type="button" @click="submit" :disabled="saving">{{ editingId ? '수정' : '등록' }}</button>
        </div>
      </header>

      <div class="flex-row gap-24 top">
        <div class="list-container flex-item">
          <div class="table-scroll">
            <table class="list-table">
              <thead>
                <tr>
                  <th scope="col">코드</th>
                  <th scope="col">코드명</th>
                  <th scope="col">상위 코드</th>
                  <th scope="col">정렬</th>
                  <th scope="col">사용 여부</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!list.length">
                  <td colspan="6">등록된 코드가 없습니다.</td>
                </tr>
                <tr v-for="item in list" :key="item.codeId" @click="edit(item)">
                  <td>{{ item.code }}</td>
                  <td>{{ item.codeName }}</td>
                  <td>{{ item.upperCodeId ?? '-' }}</td>
                  <td>{{ item.srt ?? '-' }}</td>
                  <td>{{ item.useYn ? '사용' : '미사용' }}</td>
                  <td>
                    <div class="flex-row gap-8">
                      <button class="btn func" type="button" @click.stop="edit(item)">수정</button>
                      <button class="btn func" type="button" @click.stop="removeItem(item)">삭제</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="flex-item-2">
          <form class="flex-column gap-16" @submit.prevent="submit">
            <h3 class="page-title">{{ editingId ? '코드 수정' : '코드 등록' }}</h3>
            <div class="input-area">
              <label class="label" for="code">코드 *</label>
              <input id="code" v-model="form.code" type="text" required placeholder="CODE" />
            </div>
            <div class="input-area">
              <label class="label" for="codeName">코드명 *</label>
              <input id="codeName" v-model="form.codeName" type="text" required placeholder="코드명을 입력하세요" />
            </div>
            <div class="input-area">
              <label class="label" for="upperCodeId">상위 코드 ID</label>
              <input id="upperCodeId" v-model.number="form.upperCodeId" type="number" min="0" placeholder="숫자" />
            </div>
            <div class="input-area">
              <label class="label" for="srt">정렬 순서</label>
              <input id="srt" v-model.number="form.srt" type="number" min="0" />
            </div>
            <div class="input-area">
              <label class="label">사용 여부</label>
              <label class="toggle">
                <input v-model="form.useYn" type="checkbox" />
                <span>{{ form.useYn ? '사용' : '미사용' }}</span>
              </label>
            </div>
            <div class="input-area">
              <label class="label" for="description">설명</label>
              <textarea id="description" v-model="form.description" rows="3" placeholder="코드 설명"></textarea>
            </div>
            <div class="flex-row gap-8">
              <button class="btn" type="submit" :disabled="saving">{{ editingId ? '수정' : '등록' }}</button>
              <button class="btn sub" type="button" @click="resetForm">초기화</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { inject, onMounted, reactive, ref } from 'vue'
import comm from '@/utils/comm'

const axios = inject('axios')

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const editingId = ref(null)
const form = reactive({
  upperCodeId: null,
  code: '',
  codeName: '',
  description: '',
  srt: null,
  etc1: '',
  etc2: '',
  etc3: '',
  etc4: '',
  useYn: true
})

const defaultForm = () => ({
  upperCodeId: null,
  code: '',
  codeName: '',
  description: '',
  srt: null,
  etc1: '',
  etc2: '',
  etc3: '',
  etc4: '',
  useYn: true
})

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const fetchList = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/code')
    list.value = data ?? []
  } finally {
    loading.value = false
  }
}

const edit = (item) => {
  editingId.value = item.codeId
  Object.assign(form, {
    upperCodeId: item.upperCodeId,
    code: item.code,
    codeName: item.codeName,
    description: item.description,
    srt: item.srt,
    etc1: item.etc1,
    etc2: item.etc2,
    etc3: item.etc3,
    etc4: item.etc4,
    useYn: item.useYn ?? true
  })
}

const submit = async () => {
  saving.value = true
  try {
    const payload = {
      upperCodeId: form.upperCodeId || null,
      code: form.code,
      codeName: form.codeName,
      description: form.description,
      srt: form.srt || null,
      etc1: form.etc1 || null,
      etc2: form.etc2 || null,
      etc3: form.etc3 || null,
      etc4: form.etc4 || null,
      useYn: form.useYn
    }

    if (editingId.value) {
      await axios.put(`/api/code/${editingId.value}`, payload)
      comm.alert('코드가 수정되었습니다.', '알림')
    } else {
      await axios.post('/api/code', payload)
      comm.alert('코드가 등록되었습니다.', '알림')
    }

    await fetchList()
    resetForm()
  } finally {
    saving.value = false
  }
}

const removeItem = async (item) => {
  if (!comm.confirm(`코드(${item.code})를 삭제하시겠습니까?`, '확인')) {
    return
  }
  await axios.delete(`/api/code/${item.codeId}`)
  if (editingId.value === item.codeId) {
    resetForm()
  }
  await fetchList()
}

onMounted(() => {
  fetchList()
})
</script>
