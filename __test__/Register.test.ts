import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const mockAddOnePerson = vi.fn().mockResolvedValue(undefined)

const registerPageData = ref({
  bgStart: '#6366f1',
  bgMid: '#8b5cf6',
  bgEnd: '#a78bfa',
  cardBgStart: '#f5f3ff',
  cardBgEnd: '#ede9fe',
  textColor: '#4c1d95',
  titleText: '测试抽奖',
  promptText: '请填写资料参与',
  bottomHint: '祝您好运！',
  nameLabel: '姓名',
  phoneLabel: '手机号',
  namePlaceholder: '请输入姓名',
  phonePlaceholder: '请输入手机号',
  buttonText: '立即参与',
  btnBgStart: '#7c3aed',
  btnBgEnd: '#a855f7',
  successMessage: '参与成功！',
  showFireworks: false,
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('vue-toast-notification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../src/store', () => ({
  default: () => ({
    personConfig: { addOnePerson: mockAddOnePerson },
    globalConfig: {
      getRegisterPage: registerPageData,
      setRegisterPage: vi.fn(),
      setRegisterPageField: vi.fn(),
    },
  }),
}))
vi.mock('../src/api/person', () => ({
  api_submitPerson: vi.fn().mockResolvedValue({ code: 0, msg: 'ok' }),
}))

import Register from '../src/views/Register/index.vue'

describe('Register component', () => {
  let wrapper: any

  beforeEach(() => {
    mockAddOnePerson.mockClear()
    wrapper = mount(Register, {
      global: {
        stubs: {},
      },
    })
  })

  it('renders dynamic title and prompt from config', () => {
    expect(wrapper.html()).toContain('测试抽奖')
    expect(wrapper.html()).toContain('请填写资料参与')
  })

  it('renders dynamic form labels and placeholders from config', () => {
    expect(wrapper.html()).toContain('姓名')
    expect(wrapper.html()).toContain('手机号')
    expect(wrapper.find('input[placeholder="请输入姓名"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="请输入手机号"]').exists()).toBe(true)
  })

  it('renders dynamic button text from config', () => {
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.text()).toContain('立即参与')
  })

  it('submits valid form successfully', async () => {
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('张三')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('13912345678')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockAddOnePerson).toHaveBeenCalled()
    expect(wrapper.html()).toContain('参与成功！')
  })

  it('shows validation error for invalid phone and does not submit', async () => {
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('李四')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('1234')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockAddOnePerson).not.toHaveBeenCalled()
    expect(wrapper.html()).toContain('手机号格式不正确')
  })

  it('handles API failure gracefully', async () => {
    const apiModuleBefore = await import('../src/api/person')
    apiModuleBefore.api_submitPerson = vi.fn().mockRejectedValueOnce(new Error('fail'))

    const wrapper = mount(Register, {
      global: {
        stubs: {},
      },
    })

    await wrapper.find('input[placeholder="请输入姓名"]').setValue('王五')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('13800000000')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.html()).not.toContain('参与成功！')
  })

  it('shows dynamic bottom hint from config', () => {
    expect(wrapper.html()).toContain('祝您好运！')
  })
})
