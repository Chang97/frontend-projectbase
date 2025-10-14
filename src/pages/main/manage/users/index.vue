<template>
  <section class="content">
    <div class="content-box gap-24">
      <header class="flex-row space middle pb16">
        <h2>사용자 관리</h2>
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
                  <th scope="col">사용자 ID</th>
                  <th scope="col">이름</th>
                  <th scope="col">로그인 ID</th>
                  <th scope="col">이메일</th>
                  <th scope="col">조직</th>
                  <th scope="col">사용 여부</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!list.length">
                  <td colspan="7">등록된 사용자가 없습니다.</td>
                </tr>
                <tr v-for="item in list" :key="item.userId" @click="edit(item)">
                  <td>{{ item.userId }}</td>
                  <td>{{ item.userName }}</td>
                  <td>{{ item.loginId }}</td>
                  <td>{{ item.email }}</td>
                  <td>{{ item.orgName ?? '-' }}</td>
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
            <h3 class="page-title">{{ editingId ? '사용자 수정' : '사용자 등록' }}</h3>
            <div class="input-area">
              <label class="label" for="userName">이름 *</label>
              <input id="userName" v-model="form.userName" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="loginId">로그인 ID *</label>
              <input id="loginId" v-model="form.loginId" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="email">이메일 *</label>
              <input id="email" v-model="form.email" type="email" required />
            </div>
            <div class="input-area" v-if="!editingId">
              <label class="label" for="password">비밀번호 *</label>
              <input id="password" v-model="form.userPassword" type="password" required />
            </div>
            <div class="input-area">
              <label class="label" for="orgId">조직 ID</label>
              <input id="orgId" v-model.number="form.orgId" type="number" min="0" />
            </div>
            <div class="input-area">
              <label class="label" for="empNo">사번</label>
              <input id="empNo" v-model="form.empNo" type="text" />
            </div>
            <div class="input-area">
              <label class="label" for="pstnName">직위명</label>
              <input id="pstnName" v-model="form.pstnName" type="text" />
            </div>
            <div class="input-area">
              <label class="label" for="tel">전화번호</label>
              <input id="tel" v-model="form.tel" type="text" />
            </div>
            <div class="input-area">
              <label class="label" for="userStatusId">상태 코드 ID</label>
              <input id="userStatusId" v-model.number="form.userStatusId" type="number" min="0" />
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
  email: '',
  loginId: '',
  userPassword: '',
  userName: '',
  orgId: null,
  empNo: '',
  pstnName: '',
  tel: '',
  userStatusId: null,
  useYn: true
})

const defaultForm = () => ({
  email: '',
  loginId: '',
  userPassword: '',
  userName: '',
  orgId: null,
  empNo: '',
  pstnName: '',
  tel: '',
  userStatusId: null,
  useYn: true
})

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const fetchList = async () => {
  const { data } = await axios.get('/api/users')
  list.value = data ?? []
}

const edit = (item) => {
  editingId.value = item.userId
  Object.assign(form, {
    email: item.email,
    loginId: item.loginId,
    userPassword: '',
    userName: item.userName,
    orgId: item.orgId,
    empNo: item.empNo,
    pstnName: item.pstnName,
    tel: item.tel,
    userStatusId: item.userStatusId,
    useYn: item.useYn ?? true
  })
}

const submit = async () => {
  saving.value = true
  try {
    const payload = {
      email: form.email,
      loginId: form.loginId,
      userName: form.userName,
      orgId: form.orgId || null,
      empNo: form.empNo || null,
      pstnName: form.pstnName || null,
      tel: form.tel || null,
      userStatusId: form.userStatusId || null,
      useYn: form.useYn
    }

    if (editingId.value) {
      await axios.put(`/api/users/${editingId.value}`, payload)
      comm.alert('사용자 정보가 수정되었습니다.', '알림')
    } else {
      await axios.post('/api/users', {
        ...payload,
        userPassword: form.userPassword
      })
      comm.alert('사용자가 등록되었습니다.', '알림')
    }

    await fetchList()
    resetForm()
  } finally {
    saving.value = false
  }
}

const removeItem = async (item) => {
  if (!comm.confirm(`사용자(${item.userName})를 삭제하시겠습니까?`, '확인')) {
    return
  }
  await axios.delete(`/api/users/${item.userId}`)
  if (editingId.value === item.userId) {
    resetForm()
  }
  await fetchList()
}

onMounted(() => {
  fetchList()
})
</script>
