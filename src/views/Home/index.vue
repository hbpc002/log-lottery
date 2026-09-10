<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted } from 'vue'
import useStore from '@/store'
import HeaderTitle from './components/HeaderTitle/index.vue'
import OptionButton from './components/OptionsButton/index.vue'
import PrizeList from './components/PrizeList/index.vue'
import QRCode from './components/QRCode/index.vue'
import StarsBackground from './components/StarsBackground/index.vue'
import { useViewModel } from './useViewModel'
import 'vue-toast-notification/dist/theme-sugar.css'

const viewModel = useViewModel()
const { setDefaultPersonList, tableData, currentStatus, enterLottery, stopLottery, containerRef, startLottery, continueLottery, quitLottery, isInitialDone, titleFont, titleFontSyncGlobal, backToTable } = viewModel
const globalConfig = useStore().globalConfig

// 添加调试
onMounted(() => {
    console.log('Home component mounted')
})

const { getTopTitle: topTitle, getTextColor: textColor, getTextSize: textSize, getBackground: homeBackground } = storeToRefs(globalConfig)
const { getAllPersonList } = storeToRefs(useStore().personConfig)
const totalParticipants = computed(() => getAllPersonList.value.length)

// 烟花效果
let fireworksInterval: number | null = null

function createFirework(x: number, y: number) {
  const fireworks = document.getElementById('fireworks')
  if (!fireworks) return
  
  const colors = ['#e53935', '#ffd54f', '#ff6659', '#ffb300', '#c62828']
  const particleCount = 30
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.style.position = 'absolute'
    particle.style.width = '4px'
    particle.style.height = '4px'
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    particle.style.borderRadius = '50%'
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    particle.style.zIndex = '1'
    
    const angle = (Math.PI * 2 * i) / particleCount
    const velocity = 2 + Math.random() * 3
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
      opacity -= 0.015
      
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

function startFireworks() {
  if (fireworksInterval) return
  
  fireworksInterval = window.setInterval(() => {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * (window.innerHeight / 2)
    createFirework(x, y)
  }, 2000)
}

function stopFireworks() {
  if (fireworksInterval) {
    clearInterval(fireworksInterval)
    fireworksInterval = null
  }
}

onMounted(() => {
  // 启动烟花效果
  startFireworks()
})

onUnmounted(() => {
  // 清理烟花效果
  stopFireworks()
  const fireworks = document.getElementById('fireworks')
  if (fireworks) {
    fireworks.innerHTML = ''
  }
})
</script>

<template>
  <!-- 新年背景装饰 -->
  <div class="cny-background">
    <div class="fireworks" id="fireworks"></div>
  </div>

  <HeaderTitle
    :table-data="tableData"
    :text-size="textSize"
    :text-color="textColor"
    :top-title="topTitle"
    :set-default-person-list="setDefaultPersonList"
    :is-initial-done="isInitialDone"
    :title-font="titleFont"
    :title-font-sync-global="titleFontSyncGlobal"
  />
  <div id="container" ref="containerRef" class="3dContainer">
    <OptionButton
      :current-status="currentStatus"
      :table-data="tableData"
      :enter-lottery="enterLottery"
      :start-lottery="startLottery"
      :stop-lottery="stopLottery"
      :continue-lottery="continueLottery"
      :quit-lottery="quitLottery"
    />
  </div>
  <StarsBackground :home-background="homeBackground" />
  <PrizeList class="absolute left-0 top-32" />
  <QRCode class="absolute top-0 right-0 m-4" :total-participants="totalParticipants" />
</template>

<style scoped lang="scss">
// 中国新年主题样式
.cny-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

// 烟花效果
.fireworks {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

// 确保3D容器在灯笼上层
#container {
  z-index: 2;
}

// 新年主题色彩叠加
:deep(.element-card) {
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.2);
}





// 标题新年主题
:deep(.header-title) {
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  background: linear-gradient(to bottom, #e53935, #c62828);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
}
</style>
