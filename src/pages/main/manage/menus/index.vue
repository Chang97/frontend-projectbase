<template>
  <section class="content">
    <div class="content-box gap-24">
      <header class="flex-row space middle pb16">
        <h2>메뉴 관리</h2>
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
                  <th scope="col">메뉴 코드</th>
                  <th scope="col">메뉴명</th>
                  <th scope="col">상위 메뉴</th>
                  <th scope="col">URL</th>
                  <th scope="col">정렬</th>
                  <th scope="col">사용 여부</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!list.length">
                  <td colspan="7">등록된 메뉴가 없습니다.</td>
                </tr>
                <tr v-for="item in list" :key="item.menuId" @click="edit(item)">
                  <td>{{ item.menuCode }}</td>
                  <td>{{ item.menuName }}</td>
                  <td>{{ item.upperMenuId ?? '-' }}</td>
                  <td>{{ item.url ?? '-' }}</td>
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
            <h3 class="page-title">{{ editingId ? '메뉴 수정' : '메뉴 등록' }}</h3>
            <div class="input-area">
              <label class="label" for="menuCode">메뉴 코드 *</label>
              <input id="menuCode" v-model="form.menuCode" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="menuName">메뉴명 *</label>
              <input id="menuName" v-model="form.menuName" type="text" required />
            </div>
            <div class="input-area">
              <label class="label" for="upperMenuId">상위 메뉴 ID</label>
              <input id="upperMenuId" v-model.number="form.upperMenuId" type="number" min="0" />
            </div>
            <div class="input-area">
              <label class="label" for="url">URL</label>
              <input id="url" v-model="form.url" type="text" placeholder="/main/manage/codes" />
            </div>
            <div class="input-area">
              <label class="label" for="menuCn">설명</label>
              <textarea id="menuCn" v-model="form.menuCn" rows="3" placeholder="메뉴 설명"></textarea>
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
  menuCode: '',
  menuName: '',
  upperMenuId: null,
  menuCn: '',
  url: '',
  srt: null,
  useYn: true
})

const defaultForm = () => ({
  menuCode: '',
  menuName: '',
  upperMenuId: null,
  menuCn: '',
  url: '',
  srt: null,
  useYn: true
})

const resetForm = () => {
  Object.assign(form, defaultForm())
  editingId.value = null
}

const fetchList = async () => {
  const { data } = await axios.get('/api/menu')
  list.value = data ?? []
}

const edit = (item) => {
  editingId.value = item.menuId
  Object.assign(form, {
    menuCode: item.menuCode,
    menuName: item.menuName,
    upperMenuId: item.upperMenuId,
    menuCn: item.menuCn,
    url: item.url,
    srt: item.srt,
    useYn: item.useYn ?? true
  })
}

const submit = async () => {
  saving.value = true
  try {
    const payload = {
      menuCode: form.menuCode,
      menuName: form.menuName,
      upperMenuId: form.upperMenuId || null,
      menuCn: form.menuCn || null,
      url: form.url || null,
      srt: form.srt || null,
      useYn: form.useYn
    }

    if (editingId.value) {
      await axios.put(`/api/menu/${editingId.value}`, payload)
      comm.alert('메뉴가 수정되었습니다.', '알림')
    } else {
      await axios.post('/api/menu', payload)
      comm.alert('메뉴가 등록되었습니다.', '알림')
    }

    await fetchList()
    resetForm()
  } finally {
    saving.value = false
  }
}

const removeItem = async (item) => {
  if (!comm.confirm(`메뉴(${item.menuName})를 삭제하시겠습니까?`, '확인')) {
    return
  }
  await axios.delete(`/api/menu/${item.menuId}`)
  if (editingId.value === item.menuId) {
    resetForm()
  }
  await fetchList()
}

onMounted(() => {
  fetchList()
})
</script>
