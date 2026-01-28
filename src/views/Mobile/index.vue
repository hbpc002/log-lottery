<script setup lang='ts'>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

onMounted(() => {
    timer.value = setInterval(() => {
        nowTimestamp.value = Date.now()
    }, 60000) // 每分钟更新一次
})
onUnmounted(() => {
    if (timer.value) {
        clearInterval(timer.value)
    }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 opacity-20">
      <div class="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div class="absolute bottom-20 right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style="animation-delay: 2s;" />
    </div>

    <!-- 头部 -->
    <div class="relative z-10 p-6 pb-4">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-white drop-shadow-lg">
          发送弹幕
        </h2>
        <p class="text-white/80 text-sm mt-1">
          与大家一起互动吧
        </p>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messageArrayRef" class="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
      <ul class="space-y-3">
        <li v-for="item in formattedMessages" :key="item.id">
          <div class="chat chat-end">
            <div class="chat-header mb-1">
              <time class="text-xs text-white/60">{{ item.formattedTime }}</time>
            </div>
            <div class="chat-bubble bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm break-all whitespace-normal">
              {{ item.msg }}
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 输入区域 -->
    <div class="relative z-10 p-4 bg-white/10 backdrop-blur-md border-t border-white/20">
      <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4">
        <textarea
          ref="textareaRef"
          v-model="userInputMsg"
          class="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none outline-none"
          placeholder="发送弹幕 | 只展示您发送过的弹幕"
          rows="3"
          @keydown.enter.prevent="handleEnterSend"
        />
        <div class="flex justify-end mt-3">
          <button
            class="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
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
