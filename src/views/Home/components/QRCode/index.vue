<template>
  <div class="qr-container" style="position: fixed; top: 80px; right: 16px; z-index: 50;">
    <button class="qr-button" @click="openQr">扫码参与</button>
    <div v-if="show" class="qr-modal" @click="show = false">
      <!-- 简单占位，实际请替换为真正的二维码图片 -->
      <img :src="qrSrc" alt="二维码" />
    </div>
    <div class="qr-count" v-if="totalParticipants != null" style="margin-top:6px; text-align:center; font-size:12px; color:#333;">
      参与人数: {{ totalParticipants }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQRCode } from '@vueuse/integrations/useQRCode'

// totalParticipants用于简单显示，实际可通过事件驱动更新
const props = defineProps<{ totalParticipants?: number }>()
const show = ref(false)
const origin = window.location.origin
const registerUrl = computed(() => `${origin}/log-lottery/register`)
const qr = useQRCode(registerUrl.value)
const qrSrc = computed(() => qr.value)
const totalParticipants = computed(() => props.totalParticipants ?? 0)

function openQr() {
  show.value = true
}
</script>

<style scoped>
.qr-button {
  padding: 8px 12px; border-radius: 8px; background: #16a34a; color: white; border: none;
}
.qr-modal {
  margin-top: 8px; padding: 8px; background: white; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,.15);
}
.qr-modal img { width: 240px; height: 240px; display: block; }
</style>
