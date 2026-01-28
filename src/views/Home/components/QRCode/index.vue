<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { computed, ref } from 'vue'

// totalParticipants用于简单显示，实际可通过事件驱动更新
const props = defineProps<{ totalParticipants?: number }>()
const show = ref(false)
const origin = window.location.origin
// 确保路径正确，如果base不是/log-lottery/需要调整，但目前 vite.config.ts base 是 /log-lottery/
const registerUrl = computed(() => `${origin}/log-lottery/register`)
const qr = useQRCode(registerUrl)
const qrSrc = computed(() => qr.value)
const totalParticipants = computed(() => props.totalParticipants ?? 0)

function openQr() {
    show.value = !show.value // toggle
}
</script>

<template>
  <div class="qr-container" style="position: fixed; top: 80px; right: 16px; z-index: 50;">
    <button class="qr-button" @click="openQr">
      扫码参与
    </button>
    <div v-if="show" class="qr-modal" @click="show = false">
      <!-- 简单占位，实际请替换为真正的二维码图片 -->
      <img :src="qrSrc" alt="二维码">
    </div>
    <div v-if="totalParticipants != null" class="qr-count">
      当前参与: <span class="count-number">{{ totalParticipants }}</span> 人
    </div>
  </div>
</template>

<style scoped>
.qr-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end; /* 右对齐 */
}
.qr-button {
  padding: 10px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  font-weight: bold;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}
.qr-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
.qr-modal {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.qr-modal img { width: 200px; height: 200px; display: block; border-radius: 8px; }

.qr-count {
    margin-top: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.3);
    padding: 4px 12px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
    font-weight: 500;
}
.count-number {
    font-weight: bold;
    color: #34d399;
    font-size: 16px;
    margin: 0 2px;
}
</style>
