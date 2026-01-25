import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock Vue Router and Toast
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('vue-toast-notification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

// Mock store and API
const mockAddOnePerson = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/store', () => ({
  default: () => ({
    personConfig: { addOnePerson: mockAddOnePerson },
  }),
}))
vi.mock('../../src/api/person', () => ({
  api_submitPerson: vi.fn().mockResolvedValue({ code: 0, msg: 'ok' }),
}))

import Register from '../../src/views/Register/index.vue'

describe('Register component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(Register, {
      global: {
        stubs: {},
      },
    })
  })

  it('submits valid form without navigation and shows success message', async () => {

    // fill form
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('张三')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('13912345678')
    // submit
    await wrapper.find('form').trigger('submit')
    // 等待所有异步任务完成
    await new Promise(resolve => setTimeout(resolve, 0))

    // Validate that the API call was made with correct payload
    expect(mockAddOnePerson).toHaveBeenCalled()
    // Ensure UI shows inline success message and no navigation occurred
    expect(wrapper.html()).toContain('报名成功！您已参与抽奖')
  })

  it('shows validation error for invalid phone and does not submit', async () => {

    // fill with invalid phone
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('李四')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('1234')
    // submit
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))

    // Ensure local submission not triggered
    expect(mockAddOnePerson).not.toHaveBeenCalled()
    // Ensure error message is shown in the UI
    expect(wrapper.html()).toContain('手机号格式不正确')
  })

  it('handles API failure gracefully and does not show success message', async () => {
    // Override API mock to reject
    const apiModuleBefore = await import('../../src/api/person')
    apiModuleBefore.api_submitPerson = vi.fn().mockRejectedValueOnce(new Error('fail'))

    const wrapper = mount(Register, {
      global: {
        stubs: {},
      },
    })

    // fill valid data
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('王五')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('13800000000')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should not show success message
    expect(wrapper.html()).not.toContain('报名成功！您已参与抽奖')
  })

  it('点击 再次报名 会重置表单并返回可提交状态', async () => {
    // 1) 提交一个有效表单，获得成功状态
    await wrapper.find('input[placeholder="请输入姓名"]').setValue('张三')
    await wrapper.find('input[placeholder="请输入手机号"]').setValue('13912345678')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 0))
    // 确认进入成功状态，存在再次报名按钮
    const btns = wrapper.findAll('button')
    const retryBtn = btns.find(b => b.text().includes('再次报名'))
    expect(retryBtn).toBeTruthy()
    // 2) 点击再次报名，重置表单
    await retryBtn!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    // 验证表单字段已清空
    const nameInput = wrapper.find('input[placeholder="请输入姓名"]')
    const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
    expect((nameInput.element as any).value).toBe('')
    expect((phoneInput.element as any).value).toBe('')
    // 确认未处于提交成功状态
    expect(wrapper.html()).not.toContain('报名成功！您已参与抽奖')
  })
})
