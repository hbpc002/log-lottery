<script setup lang="ts">
import type { IPersonSubmission } from '@/types/formType'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { api_submitPerson } from '@/api/person'
import useStore from '@/store'
import { createDraftPerson } from '@/utils'

const router = useRouter()
const toast = useToast()
const isSubmitting = ref(false)
const isSuccess = ref(false)

const form = reactive<IPersonSubmission>({
    name: '',
    phone: '',
})

const errors = reactive<{ name?: string, phone?: string }>({})

function validateForm(): boolean {
    let ok = true
    if (!form.name?.trim()) {
        errors.name = '请填写姓名'
        ok = false
    }
    else {
        errors.name = undefined
    }
    const phoneReg = /^1[3-9]\d{9}$/
    if (!form.phone?.trim()) {
        errors.phone = '请填写手机号'
        ok = false
    }
    else if (!phoneReg.test(form.phone)) {
        errors.phone = '手机号格式不正确'
        ok = false
    }
    else {
        errors.phone = undefined
    }
    return ok
}

async function submitForm() {
    if (!validateForm())
        return
    isSubmitting.value = true
    try {
        await api_submitPerson({ name: form.name, phone: form.phone })
        toast.success('报名成功！您已参与抽奖')
        // 将本地草稿也加入到本地人员名单中，便于即时显示
        try {
            const draft = createDraftPerson(form.name, form.phone)
            const store = useStore()
            store.personConfig.addOnePerson([draft] as any)
        }
        catch (e) {
            // 忽略本地草稿失败的情况，仅作为提示性日志
            console.warn('本地草稿添加失败', e)
        }
        isSuccess.value = true
    }
    catch (e: any) {
        toast.error(e?.msg || '报名失败，请重试')
    }
    finally {
        isSubmitting.value = false
    }
}
</script>

<template>
  <div class="register-page flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 opacity-30 pointer-events-none">
      <div class="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div class="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style="animation-delay: 2s;" />
      <div class="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style="animation-delay: 4s;" />
    </div>

    <div class="card w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative z-10">
      <!-- 头部装饰 -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!isSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">
          {{ isSuccess ? '报名成功' : '参与抽奖' }}
        </h2>
        <div class="text-sm text-gray-500">
          {{ isSuccess ? '您已成功参与抽奖，请等待开奖' : '请填写姓名和手机号以参与抽奖' }}
        </div>
      </div>

      <div v-if="isSuccess" class="text-center py-8">
        <div class="mb-6 text-green-500">
          <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-gray-600 text-lg">
          祝您好运！
        </p>
      </div>

      <form v-else class="space-y-5" @submit.prevent="submitForm">
        <!-- 姓名输入框 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">姓名</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              v-model="form.name"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none bg-white text-gray-900"
              :class="{ 'border-red-300 bg-red-50': errors.name }"
              placeholder="请输入姓名"
            >
          </div>
          <div v-if="errors.name" class="mt-1 text-sm text-red-500 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.name }}
          </div>
        </div>

        <!-- 手机号输入框 -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">手机号</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none bg-white text-gray-900"
              :class="{ 'border-red-300 bg-red-50': errors.phone }"
              placeholder="请输入手机号"
            >
          </div>
          <div v-if="errors.phone" class="mt-1 text-sm text-red-500 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.phone }}
          </div>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            提交中...
          </span>
          <span v-else>立即参与抽奖</span>
        </button>
      </form>

      <!-- 底部提示 -->
      <div class="mt-6 text-center text-xs text-gray-400">
        <p>填写信息即可参与抽奖活动</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
}
.card {
  max-width: 420px;
  margin: 0 auto;
}
</style>
