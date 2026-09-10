<script setup lang="ts">
import type { IPersonSubmission } from '@/types/formType'
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { storeToRefs } from 'pinia'
import { api_submitPerson } from '@/api/person'
import useStore from '@/store'
import { createDraftPerson } from '@/utils'

const router = useRouter()
const toast = useToast()
const isSubmitting = ref(false)
const isSuccess = ref(false)

const store = useStore()
const { getRegisterPage: registerPage } = storeToRefs(store.globalConfig)

const pageStyle = computed(() => ({
    background: `linear-gradient(135deg, ${registerPage.value.bgStart}, ${registerPage.value.bgMid}, ${registerPage.value.bgEnd})`,
}))

const cardStyle = computed(() => ({
    background: `linear-gradient(135deg, ${registerPage.value.cardBgStart}, ${registerPage.value.cardBgEnd})`,
}))

const btnStyle = computed(() => ({
    background: `linear-gradient(135deg, ${registerPage.value.btnBgStart}, ${registerPage.value.btnBgEnd})`,
}))

const textColorStyle = computed(() => ({
    color: registerPage.value.textColor,
}))

const borderColorStyle = computed(() => ({
    borderColor: registerPage.value.textColor + '44',
}))

const focusRingStyle = computed(() => ({
    '--tw-ring-color': registerPage.value.textColor + '33',
}))

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
        try {
            const draft = createDraftPerson(form.name, form.phone)
            const store = useStore()
            store.personConfig.addOnePerson([draft] as any)
        }
        catch (e) {
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

const particlePool: HTMLElement[] = []
let registerFireworksInterval: number | null = null
let activeAnimations = 0

function getOrCreateParticle(): HTMLElement {
  if (particlePool.length > 0) {
    return particlePool.pop()!
  }
  const particle = document.createElement('div')
  particle.className = 'firework-particle'
  particle.style.position = 'absolute'
  particle.style.width = '3px'
  particle.style.height = '3px'
  particle.style.borderRadius = '50%'
  particle.style.pointerEvents = 'none'
  particle.style.willChange = 'transform, opacity'
  return particle
}

function returnParticleToPool(particle: HTMLElement) {
  particle.remove()
  particlePool.push(particle)
}

function createRegisterFirework(x: number, y: number) {
  const fireworks = document.getElementById('register-fireworks')
  if (!fireworks || activeAnimations > 3) return
  const colors = ['#e53935', '#ffd54f', '#ff6659', '#ffb300', '#c62828']
  const particleCount = 12
  for (let i = 0; i < particleCount; i++) {
    const particle = getOrCreateParticle()
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    particle.style.opacity = '1'
    particle.style.zIndex = '0'
    const angle = (Math.PI * 2 * i) / particleCount
    const velocity = 1.5 + Math.random() * 2
    const vx = Math.cos(angle) * velocity * 100
    const vy = Math.sin(angle) * velocity * 100
    fireworks.appendChild(particle)
    activeAnimations++
    particle.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    setTimeout(() => {
      particle.style.transform = `translate(${vx}px, ${vy + 150}px)`
      particle.style.opacity = '0'
    }, 16)
    setTimeout(() => {
      returnParticleToPool(particle)
      activeAnimations--
    }, 1500)
  }
}

function startRegisterFireworks() {
  if (registerFireworksInterval || !registerPage.value.showFireworks) return
  registerFireworksInterval = window.setInterval(() => {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * (window.innerHeight / 2)
    createRegisterFirework(x, y)
  }, 5000)
}

function stopRegisterFireworks() {
  if (registerFireworksInterval) {
    clearInterval(registerFireworksInterval)
    registerFireworksInterval = null
  }
  activeAnimations = 0
  particlePool.forEach(p => p.remove())
  particlePool.length = 0
}

onMounted(() => {
    if (registerPage.value.showFireworks) {
        startRegisterFireworks()
    }
})

onUnmounted(() => {
  stopRegisterFireworks()
  const fireworks = document.getElementById('register-fireworks')
  if (fireworks) {
    fireworks.innerHTML = ''
  }
})
</script>

<template>
  <div
    class="register-page flex items-center justify-center min-h-screen p-4 relative overflow-hidden"
    :style="pageStyle"
  >
    <div class="absolute inset-0 opacity-30 pointer-events-none">
      <div
        class="absolute top-10 left-10 w-60 h-60 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
        :style="{ background: registerPage.bgStart }"
      />
      <div
        class="absolute top-40 right-20 w-60 h-60 rounded-full mix-blend-multiply filter blur-3xl"
        :style="{ background: registerPage.bgEnd }"
      />
      <div
        class="absolute -bottom-8 left-1/3 w-60 h-60 rounded-full mix-blend-multiply filter blur-3xl"
        :style="{ background: registerPage.bgMid }"
      />
    </div>

    <div v-if="registerPage.showFireworks" id="register-fireworks" class="absolute inset-0 z-0" />

    <div
      class="card w-full max-w-md backdrop-blur-sm rounded-3xl shadow-2xl p-8 relative z-10"
      :style="[cardStyle, { borderColor: registerPage.textColor + '44', borderWidth: '1px', borderStyle: 'solid' }]"
    >
      <div v-if="registerPage.titleText || registerPage.promptText" class="text-center mb-6">
        <h2 v-if="registerPage.titleText" class="text-3xl font-bold mb-2" :style="textColorStyle">
          {{ registerPage.titleText }}
        </h2>
        <div v-if="registerPage.promptText" class="text-sm" :style="{ color: registerPage.textColor + 'cc' }">
          {{ registerPage.promptText }}
        </div>
      </div>

      <div v-if="isSuccess" class="text-center py-8">
        <div class="mb-6" :style="textColorStyle">
          <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-lg font-semibold" :style="textColorStyle">
          {{ registerPage.successMessage }}
        </p>
      </div>

      <form v-else class="space-y-5" @submit.prevent="submitForm">
        <div>
          <label class="block text-sm font-semibold mb-2" :style="textColorStyle">{{ registerPage.nameLabel }}</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5" :style="{ color: registerPage.textColor + '99' }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              v-model="form.name"
              class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white"
              :class="{ 'border-red-400 bg-red-50': errors.name }"
              :style="[borderColorStyle, focusRingStyle, textColorStyle]"
              :placeholder="registerPage.namePlaceholder"
            >
          </div>
          <div v-if="errors.name" class="mt-1 text-sm text-red-500 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.name }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold mb-2" :style="textColorStyle">{{ registerPage.phoneLabel }}</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5" :style="{ color: registerPage.textColor + '99' }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              class="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white"
              :class="{ 'border-red-400 bg-red-50': errors.phone }"
              :style="[borderColorStyle, focusRingStyle, textColorStyle]"
              :placeholder="registerPage.phonePlaceholder"
            >
          </div>
          <div v-if="errors.phone" class="mt-1 text-sm text-red-500 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.phone }}
          </div>
        </div>

        <button
          type="submit"
          class="w-full text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :style="btnStyle"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            提交中...
          </span>
          <span v-else>{{ registerPage.buttonText }}</span>
        </button>
      </form>

      <div v-if="registerPage.bottomHint" class="mt-6 text-center text-xs" :style="{ color: registerPage.textColor + '99' }">
        <p>{{ registerPage.bottomHint }}</p>
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
