<script setup lang="ts">
import { storeToRefs } from 'pinia'
import useStore from '@/store'
import HeaderTitle from './components/HeaderTitle/index.vue'
import OptionButton from './components/OptionsButton/index.vue'
import PrizeList from './components/PrizeList/index.vue'
import StarsBackground from './components/StarsBackground/index.vue'
import { useViewModel } from './useViewModel'
import QRCode from './components/QRCode/index.vue'
import { computed } from 'vue'
import 'vue-toast-notification/dist/theme-sugar.css'

const viewModel = useViewModel()
const { setDefaultPersonList, tableData, currentStatus, enterLottery, stopLottery, containerRef, startLottery, continueLottery, quitLottery, isInitialDone, titleFont, titleFontSyncGlobal } = viewModel
const globalConfig = useStore().globalConfig

const { getTopTitle: topTitle, getTextColor: textColor, getTextSize: textSize, getBackground: homeBackground } = storeToRefs(globalConfig)
const { getAllPersonList } = storeToRefs(useStore().personConfig)
const totalParticipants = computed(() => getAllPersonList.value.length)
</script>

<template>
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
</style>
