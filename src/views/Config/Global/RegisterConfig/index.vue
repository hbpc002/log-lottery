<script setup lang='ts'>
import { useI18n } from 'vue-i18n'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import { useViewModel } from './useViewModel'

const { t } = useI18n()
    const { pageData, reset } = useViewModel()
</script>

<template>
  <div class="w-4/5 flex flex-col gap-4">
    <h2>{{ t('viewTitle.registerConfig') }}</h2>

    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn btn-error btn-sm" @click="reset">
        {{ t('table.resetAllData') }}
      </button>
    </div>

    <div class="flex flex-wrap gap-6">
      <!-- 背景颜色设置 -->
      <fieldset class="p-4 border fieldset bg-base-200 border-base-300 rounded-box w-xs pb-10">
        <legend class="fieldset-legend">{{ t('table.themeSetting') }}</legend>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerBgStart') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.bgStart" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerBgMid') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.bgMid" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerBgEnd') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.bgEnd" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerCardBgStart') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.cardBgStart" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerCardBgEnd') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.cardBgEnd" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerTextColor') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.textColor" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerBtnBgStart') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.btnBgStart" />
          </div>
          <div class="flex flex-col items-center gap-1 form-control">
            <label class="label"><span class="label-text">{{ t('table.registerBtnBgEnd') }}</span></label>
            <ColorPicker v-model:pure-color="pageData.btnBgEnd" />
          </div>
        </div>
      </fieldset>

      <!-- 页面内容设置 -->
      <fieldset class="p-4 border fieldset bg-base-200 border-base-300 rounded-box w-xs pb-10">
        <legend class="fieldset-legend">{{ t('table.textSetting') }}</legend>

        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerTitleText') }}</span></div>
          <input v-model="pageData.titleText" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerPromptText') }}</span></div>
          <input v-model="pageData.promptText" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerBottomHint') }}</span></div>
          <input v-model="pageData.bottomHint" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerSuccessMessage') }}</span></div>
          <input v-model="pageData.successMessage" type="text" class="input input-bordered w-full max-w-xs">
        </label>
      </fieldset>

      <!-- 表单文本设置 -->
      <fieldset class="p-4 border fieldset bg-base-200 border-base-300 rounded-box w-xs pb-10">
        <legend class="fieldset-legend">{{ t('table.registerConfig') }}</legend>

        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerNameLabel') }}</span></div>
          <input v-model="pageData.nameLabel" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerPhoneLabel') }}</span></div>
          <input v-model="pageData.phoneLabel" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerNamePlaceholder') }}</span></div>
          <input v-model="pageData.namePlaceholder" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerPhonePlaceholder') }}</span></div>
          <input v-model="pageData.phonePlaceholder" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label"><span class="label-text">{{ t('table.registerButtonText') }}</span></div>
          <input v-model="pageData.buttonText" type="text" class="input input-bordered w-full max-w-xs">
        </label>
        <div class="flex items-center justify-between w-full max-w-xs gap-2 mt-3 form-control">
          <div class="label"><span class="label-text">{{ t('table.registerShowFireworks') }}</span></div>
          <input
            type="checkbox" :checked="pageData.showFireworks" class="checkbox checkbox-secondary border"
            @change="pageData.showFireworks = !pageData.showFireworks"
          >
        </div>
      </fieldset>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
