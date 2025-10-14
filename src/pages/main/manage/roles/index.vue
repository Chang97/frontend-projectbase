<template>
  <section class="content">
    <div class="content-box gap-24">
      <header class="flex-row space middle pb16">
        <h2>역할 관리</h2>
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
                  <th scope="col">역할 ID</th>
                  <th scope="col">역할명</th>
                  <th scope="col">사용 여부</th>
                  <th scope="col">생성일</th>
                  <th scope="col">수정일</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!list.length">
                  <td colspan="6">등록된 역할이 없습니다.</td>
                </tr>
                <tr v-for="item in list" :key="item.roleId" @click="edit(item)">
                  <td>{{ item.roleId }}</td>
                  <td>{{ item.roleName }}</td>
                  <td>{{ item.useYn ? '사용' : '미사용' }}</td>
                  <td>{{ formatDate(item.createdDt) }}</td>
                  <td>{{ formatDate(item.updatedDt) }}</td>
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
            <h3 class="page-title">{{ editingId ? '역할 수정' : '역할 등록' }}</h3>
            <div class="input-area">
              <label class="label" for="roleName">역할명 *</label>
              <input id="roleName" v-model="form.roleName" type="text" required />
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
  roleName: '',
  useYn: true
})

const defaultForm = () => ({
  roleName: '',
  useYn: true
})

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const fetchList = async () => {
  const { data } = await axios.get('/api/role')
  list.value = data ?? []
}

const edit = (item) => {
  editingId.value = item.roleId
  Object.assign(form, {
    roleName: item.roleName,
    useYn: item.useYn ?? true
  })
}

const submit = async () => {
  saving.value = true
  try {
    const payload = {
      roleName: form.roleName,
      useYn: form.useYn
    }

    if (editingId.value) {
      await axios.put(`/api/role/${editingId.value}`, payload)
      comm.alert('역할이 수정되었습니다.', '알림')
    } else {
      await axios.post('/api/role', payload)
      comm.alert('역할이 등록되었습니다.', '알림')
    }

    await fetchList()
    resetForm()
  } finally {
    saving.value = false
  }
}

const removeItem = async (item) => {
  if (!comm.confirm(`역할(${item.roleName})을 삭제하시겠습니까?`, '확인')) {
    return
  }
  await axios.delete(`/api/role/${item.roleId}`)
  if (editingId.value === item.roleId) {
    resetForm()
  }
  await fetchList()
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(() => {
  fetchList()
})
</script>
