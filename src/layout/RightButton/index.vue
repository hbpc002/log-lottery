<script setup lang='ts'>
import { useFullscreen } from '@vueuse/core'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { Maximize, Minimize, TabletSmartphone, Grid3X3 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CustomDialog from '@/components/Dialog/index.vue'
import useStore from '@/store'
import { getOriginUrl, getUniqueSignature } from '@/utils/auth'
import { usePlayMusic } from './usePlayMusic'
import { LotteryStatus } from '@/views/Home/type'

const serverConfig = useStore().serverConfig
const {
    getServerStatus: serverStatus,
} = storeToRefs(serverConfig)
const { playMusic, currentMusic, nextPlay } = usePlayMusic()
const { isFullscreen, toggle: toggleScreen } = useFullscreen()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const customDialogRef = ref()
const settingRef = ref()
const fullScreenRef = ref()
const mobileUrl = shallowRef<string>('')
const qrCodeImg = useQRCode(mobileUrl)
const visible = ref(true)
// 检查是否在Home页面且有返回平铺函数（说明已进入球体状态）
const shouldShowButton = ref(false)

// 定期更新按钮显示状态
const checkButtonVisibility = () => {
    const isHome = route.path === '/log-lottery/home' || route.path === '/' || route.path === '/log-lottery'
    const isNotInitStatus = window.lotteryStatus !== undefined && window.lotteryStatus !== 0
    const shouldBeVisible = isHome && isNotInitStatus
    console.log('checkButtonVisibility:', { 
        path: route.path, 
        isHome, 
        lotteryStatus: window.lotteryStatus,
        isNotInitStatus,
        shouldBeVisible
    })
    shouldShowButton.value = shouldBeVisible
}

// 定期检查
let checkInterval: number | null = null

// 监听路由变化
watch(() => route.path, () => {
    checkButtonVisibility()
}, { immediate: true })

function enterConfig() {
    router.push('/log-lottery/config')
}
function enterHome() {
    router.push('/log-lottery')
}
async function openMobileQrCode() {
    const originUrl = getOriginUrl()
    const userSignature = await getUniqueSignature()
    mobileUrl.value = `${originUrl}/log-lottery/mobile?userSignature=${userSignature}`
    customDialogRef.value.showDialog()
}
function handleSubmit() {

}
function handleBackToTable() {
    console.log('Back to table button clicked')
    if ((window as any).backToTableFunction) {
        console.log('Executing backToTableFunction')
        ;(window as any).backToTableFunction()
    } else {
        // 如果函数不存在，发送一个自定义事件
        console.log('Sending backToTable event')
        window.dispatchEvent(new CustomEvent('backToTable'))
    }
}

watch(() => route, (val) => {
    const { meta } = val
    if (meta && meta.isMobile) {
        visible.value = false
    }
}, { immediate: true })
onMounted(() => {
    console.log('RightButton mounted, current path:', route.path)
    
    // 初始检查
    checkButtonVisibility()
    
    // 设置定期检查
    checkInterval = window.setInterval(checkButtonVisibility, 500)
    
    // 监听抽奖状态变化事件
    const handleLotteryStatusChanged = () => {
        setTimeout(checkButtonVisibility, 50) // 短暂延迟确保状态已更新
    }
    window.addEventListener('lotteryStatusChanged', handleLotteryStatusChanged)
    
    if (!settingRef.value) {
        return
    }
    settingRef.value.addEventListener('mouseenter', () => {
        fullScreenRef.value.style.display = 'block'
    })
    settingRef.value.addEventListener('mouseleave', () => {
        fullScreenRef.value.style.display = 'none'
    })
    
    // 清理函数
    onUnmounted(() => {
        if (checkInterval) {
            clearInterval(checkInterval)
        }
        window.removeEventListener('lotteryStatusChanged', handleLotteryStatusChanged)
    })
})
</script>

<template>
  <div v-if="visible" ref="settingRef" class="flex flex-col gap-3">
    <CustomDialog
      ref="customDialogRef"
      title=""
      :submit-func="handleSubmit"
      footer="center"
      dialog-class="h-120 p-6"
    >
      <template #content>
        <div class="flex w-full justify-center h-90">
          <img :src="qrCodeImg" alt="qr code">
        </div>
      </template>
    </CustomDialog>
    <div ref="fullScreenRef" class="tooltip tooltip-left hidden" @click="toggleScreen">
      <div
        v-if="isFullscreen"
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
      >
        <Minimize />
      </div>
      <div
        v-else
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
      >
        <Maximize />
      </div>
    </div>
    <div v-if="route.path.includes('/config')" class="tooltip tooltip-left" :data-tip="t('tooltip.toHome')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="enterHome"
      >
        <svg-icon name="home" />
      </div>
    </div>
    <div v-else class="tooltip tooltip-left" :data-tip="t('tooltip.settingConfiguration')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="enterConfig"
      >
        <svg-icon name="setting" />
      </div>
    </div>
    <div v-if="shouldShowButton" class="tooltip tooltip-left" data-tip="返回平铺">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="handleBackToTable"
      >
        <Grid3X3 />
      </div>
    </div>
    <div class="tooltip tooltip-left" :data-tip="currentMusic.item ? `${currentMusic.item.name}\n\r ${t('tooltip.nextSong')}` : t('tooltip.noSongPlay')">
      <div
        class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90"
        @click="playMusic(currentMusic.item)" @click.right.prevent="nextPlay"
      >
        <svg-icon :name="currentMusic.paused ? 'play' : 'pause'" />
      </div>
    </div>
    <div v-if="serverStatus" class="tooltip tooltip-left" data-tip="访问手机端">
      <div class="flex items-center justify-center w-10 h-10 p-0 m-0 cursor-pointer setting-container bg-slate-500/50 rounded-l-xl hover:bg-slate-500/80 hover:text-blue-400/90" @click="openMobileQrCode">
        <TabletSmartphone />
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
details {

    // display: none;
    summary {
        display: none;
    }
}
</style>
