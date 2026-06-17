import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key.split('.').pop() || key,
  }),
}))

const registerPageData = ref({
  bgStart: '#6366f1',
  bgMid: '#8b5cf6',
  bgEnd: '#a78bfa',
  cardBgStart: '#f5f3ff',
  cardBgEnd: '#ede9fe',
  textColor: '#4c1d95',
  titleText: '',
  promptText: '请填写信息参与抽奖活动',
  bottomHint: '填写信息即可参与抽奖活动，祝您好运！',
  nameLabel: '姓名',
  phoneLabel: '手机号',
  namePlaceholder: '请输入您的姓名',
  phonePlaceholder: '请输入您的手机号',
  buttonText: '立即参与抽奖',
  btnBgStart: '#7c3aed',
  btnBgEnd: '#a855f7',
  successMessage: '参与成功！',
  showFireworks: true,
})

const mockSetRegisterPage = vi.fn()
const mockReset = vi.fn()

vi.mock('../src/store', () => ({
  default: () => ({
    globalConfig: {
      getRegisterPage: registerPageData,
      setRegisterPage: mockSetRegisterPage,
      setRegisterPageField: vi.fn(),
      reset: mockReset,
    },
  }),
}))

import RegisterConfig from '../src/views/Config/Global/RegisterConfig/index.vue'

describe('RegisterConfig component', () => {
  let wrapper: any

  beforeEach(() => {
    mockSetRegisterPage.mockClear()
    mockReset.mockClear()
    wrapper = mount(RegisterConfig, {
      global: {
        stubs: {
          ColorPicker: { template: '<input type="color" class="mock-color-picker" />' },
        },
      },
    })
  })

  it('renders the page', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('registerConfig')
  })

  it('renders three setting sections', () => {
    const fieldsets = wrapper.findAll('fieldset')
    expect(fieldsets.length).toBe(3)
  })

  it('renders reset button that calls store reset', async () => {
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(mockReset).toHaveBeenCalled()
  })

  it('renders color input for each color setting', () => {
    const colorInputs = wrapper.findAll('.mock-color-picker')
    expect(colorInputs.length).toBe(8)
  })

  it('renders text inputs for text content fields', () => {
    const textInputs = wrapper.findAll('input[type="text"]')
    expect(textInputs.length).toBeGreaterThanOrEqual(5)
  })

  it('renders show fireworks checkbox', () => {
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })
})
