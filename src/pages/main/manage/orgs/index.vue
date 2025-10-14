<template>
  <section class="content">
    <div class="content-box gap-24">
      <header class="flex-row space middle pb16">
        <h2>조직 관리</h2>
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
                  <th scope="col">조직 ID</th>
                  <th scope="col">조직 코드</th>
                  <th scope="col">조직명</th>
                  <th scope="col">상위 조직</th>
                  <th scope="col">정렬</th>
                  <th scope="col">사용 여부</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!list.length">
                  <td colspan="7">등록된 조직이 없습니다.</td>
                </tr>
                <tr v-for="item in list" :key="item.orgId" @click="edit(item)">
                  <td>{{ item.orgId }}</td>
                  <td>{{ item.orgCode }}</td>
                  <td>{{ item.orgName }}</td>
                  <td>{{ item.upperOrgId ?? '-' }}</td>
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
            <h3 class="page-title">{{ editingId ? '조직 수정' : '조직 등록' }}</h3>
            <div class="input-area">
              <label class="label" for="orgCode">조직 코드 *</label>
              <input id="orgCode" v-model="form.orgCode" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="orgName">조직명 *</label>
              <input id="orgName" v-model="form.orgName" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="upperOrgId">상위 조직 ID</label>
              <input id="upperOrgId" v-model.number="form.upperOrgId" type="number" min="0" />
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
const saving = ref(false)
const editingId = ref(null)
const form = reactive({
  orgCode: '',
  orgName: '',
  upperOrgId: null,
  srt: null,
  useYn: true
})

const defaultForm = () => ({
  orgCode: '',
  orgName: '',
  upperOrgId: null,
  srt: null,
  useYn: true
})

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const fetchList = async () => {
  const { data } = await axios.get('/org')
  list.value = data ?? []
}

const edit = (item) => {
  editingId.value = item.orgId
  Object.assign(form, {
    orgCode: item.orgCode,
    orgName: item.orgName,
    upperOrgId: item.upperOrgId,
    srt: item.srt,
    useYn: item.useYn ?? true
  })
}

const submit = async () => {
  saving.value = true
  try {
    const payload = {
      orgCode: form.orgCode,
      orgName: form.orgName,
      upperOrgId: form.upperOrgId || null,
      srt: form.srt || null,
      useYn: form.useYn
    }

    if (editingId.value) {
      await axios.put(`/org/${editingId.value}`, payload)
      comm.alert('조직이 수정되었습니다.', '알림')
    } else {
      await axios.post('/org', payload)
      comm.alert('조직이 등록되었습니다.', '알림')
    }

    await fetchList()
    resetForm()
  } finally {
    saving.value = false
  }
}

const removeItem = async (item) => {
  if (!comm.confirm(`조직(${item.orgName})을 삭제하시겠습니까?`, '확인')) {
    return
  }
  await axios.delete(`/org/${item.orgId}`)
  if (editingId.value === item.orgId) {
    resetForm()
  }
  await fetchList()
}

onMounted(() => {
  fetchList()
})
</script>
