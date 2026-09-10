<script setup lang='ts'>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import useStore from '@/store'
import { useViewModel } from './useViewModel'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn') // 设置为中文

const textareaRef = ref()
const messageArrayRef = ref()
// 存储定时器ID
const timer = ref()
// 创建一个响应式的时间戳，用于触发更新
const nowTimestamp = ref(Date.now())
const { sendMsg, userInputMsg, userMsgArray } = useViewModel()

// 获取主页标题
const globalConfig = useStore().globalConfig
const { getTopTitle: topTitle } = storeToRefs(globalConfig)
async function handleEnterSend() {
    sendMsg(userInputMsg.value)
    textareaRef.value.blur()
    messageArrayRef.value.scrollTop = messageArrayRef.value.scrollHeight
}

function scrollToBottom() {
    if (!messageArrayRef.value) {
        return
    }
    setTimeout(() => {
        messageArrayRef.value.scrollTop = messageArrayRef.value.scrollHeight
    }, 0)
}

// 带有实时更新的时间显示
const formattedMessages = computed(() => {
    const _ = nowTimestamp.value
    return userMsgArray.value.map(item => ({
        ...item,
        formattedTime: dayjs(item.dateTime).fromNow(),
    }))
})
watch(() => userMsgArray.value.length, () => {
    scrollToBottom()
}, { immediate: true })

// 烟花效果
let mobileFireworksInterval: number | null = null

function createMobileFirework(x: number, y: number) {
  const fireworks = document.getElementById('mobile-fireworks')
  if (!fireworks) return
  
  const colors = ['#e53935', '#ffd54f', '#ff6659', '#ffb300', '#c62828']
  const particleCount = 20 // 移动端减少粒子数量以提升性能
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.style.position = 'absolute'
    particle.style.width = '3px'
    particle.style.height = '3px'
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    particle.style.borderRadius = '50%'
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    particle.style.zIndex = '0'
    
    const angle = (Math.PI * 2 * i) / particleCount
    const velocity = 1.5 + Math.random() * 2 // 移动端减少速度
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity
    
    fireworks.appendChild(particle)
    
    // 动画
    let opacity = 1
    let px = x
    let py = y
    let vyModified = vy
    
    const animate = () => {
      px += vx
      py += vyModified
      vyModified += 0.1 // 重力
      opacity -= 0.02 // 移动端加快消失速度
      
      particle.style.left = `${px}px`
      particle.style.top = `${py}px`
      particle.style.opacity = opacity.toString()
      
      if (opacity > 0) {
        requestAnimationFrame(animate)
      } else {
        particle.remove()
      }
    }
    
    requestAnimationFrame(animate)
  }
}

function startMobileFireworks() {
  if (mobileFireworksInterval) return
  
  mobileFireworksInterval = window.setInterval(() => {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * (window.innerHeight / 2)
    createMobileFirework(x, y)
  }, 3000) // 移动端减少烟花频率
}

function stopMobileFireworks() {
  if (mobileFireworksInterval) {
    clearInterval(mobileFireworksInterval)
    mobileFireworksInterval = null
  }
}

onMounted(() => {
    timer.value = setInterval(() => {
        nowTimestamp.value = Date.now()
    }, 60000) // 每分钟更新一次
    
    // 启动烟花效果
    startMobileFireworks()
})
onUnmounted(() => {
    if (timer.value) {
        clearInterval(timer.value)
    }
    
    // 清理烟花效果
    stopMobileFireworks()
    const fireworks = document.getElementById('mobile-fireworks')
    if (fireworks) {
        fireworks.innerHTML = ''
    }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-amber-600 relative overflow-hidden">
    <!-- 新年背景装饰 -->
    <div class="absolute inset-0 opacity-20">
      <div class="absolute top-10 left-10 w-64 h-64 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div class="absolute bottom-20 right-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style="animation-delay: 2s;" />
    </div>
    
    <!-- 新年烟花效果 -->
    <div id="mobile-fireworks" class="absolute inset-0 z-0"></div>

    <!-- 头部 -->
    <div class="relative z-10 p-6 pb-4">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white drop-shadow-lg" style="text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);">
          {{ topTitle }}
        </h2>
        <p class="text-white/80 text-sm mt-2">
          发送弹幕 · 参与新年抽奖
        </p>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messageArrayRef" class="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
      <ul class="space-y-3">
        <li v-for="item in formattedMessages" :key="item.id">
          <div class="chat chat-end">
            <div class="chat-header mb-1">
              <time class="text-xs text-yellow-200/80">{{ item.formattedTime }}</time>
            </div>
            <div class="chat-bubble bg-gradient-to-br from-red-50 to-amber-50 text-gray-800 shadow-lg backdrop-blur-sm border border-red-200/50 break-all whitespace-normal">
              {{ item.msg }}
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 输入区域 -->
    <div class="relative z-10 p-4 bg-red-900/20 backdrop-blur-md border-t border-red-300/30">
      <div class="bg-gradient-to-br from-red-50 to-amber-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-red-200/50">
        <textarea
          ref="textareaRef"
          v-model="userInputMsg"
          class="w-full rounded-xl border-2 border-red-200/70 p-3 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all resize-none outline-none bg-white/80"
          placeholder="发送弹幕参与新年抽奖 | 只展示您发送过的弹幕"
          rows="3"
          @keydown.enter.prevent="handleEnterSend"
        />
        <div class="flex justify-end mt-3">
          <button
            class="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-red-500/20"
            @click="handleEnterSend"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
