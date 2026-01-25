<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { api_submitPerson } from '@/api/person'
import type { IPersonSubmission } from '@/types/formType'
import { createDraftPerson } from '@/utils'
import useStore from '@/store'

const router = useRouter()
const toast = useToast()
const isSubmitting = ref(false)

const form = reactive<IPersonSubmission>({
  name: '',
  phone: '',
})

const errors = reactive<{ name?: string; phone?: string }>({})

function validateForm(): boolean {
  let ok = true
  if (!form.name?.trim()) {
    errors.name = '请填写姓名'
    ok = false
  } else {
    errors.name = undefined
  }
  const phoneReg = /^1[3-9]\d{9}$/
  if (!form.phone?.trim()) {
    errors.phone = '请填写手机号'
    ok = false
  } else if (!phoneReg.test(form.phone)) {
    errors.phone = '手机号格式不正确'
    ok = false
  } else {
    errors.phone = undefined
  }
  return ok
}

async function submitForm() {
  if (!validateForm()) return
  isSubmitting.value = true
  try {
    await api_submitPerson({ name: form.name, phone: form.phone })
    toast.success('报名成功！您已参与抽奖')
    // 将本地草稿也加入到本地人员名单中，便于即时显示
    try {
      const draft = createDraftPerson(form.name, form.phone)
      const store = useStore()
      store.personConfig.addOnePerson([draft] as any)
    } catch (e) {
      // 忽略本地草稿失败的情况，仅作为提示性日志
      console.warn('本地草稿添加失败', e)
    }
    router.push('/log-lottery')
  } catch (e: any) {
    toast.error(e?.msg || '报名失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="register-page flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="card w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-2xl font-semibold mb-4">参与抽奖</h2>
      <div class="mb-4 text-sm text-gray-600">请填写姓名和手机号以参与抽奖</div>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">姓名</label>
          <input v-model="form.name" class="w-full border rounded p-2" placeholder="请输入姓名" />
          <div v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</div>
        </div>
        <div>
          <label class="block text-sm mb-1">手机号</label>
          <input v-model="form.phone" class="w-full border rounded p-2" placeholder="请输入手机号" />
          <div v-if="errors.phone" class="text-sm text-red-500">{{ errors.phone }}</div>
        </div>
        <button type="submit" class="w-full btn btn-primary" :disabled="isSubmitting">{{ isSubmitting ? '提交中...' : '提交报名' }}</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page { min-height: 100vh; }
.card { max-width: 420px; margin: 0 auto; }
</style>
