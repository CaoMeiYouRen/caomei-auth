import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useI18nText } from '@/tests/mocks/i18n-text'
import TimezoneSettings from '@/components/profile/timezone-settings.vue'

const { updateUser, toast } = vi.hoisted(() => ({
    updateUser: vi.fn(async () => ({ data: {}, error: null })),
    toast: { success: vi.fn(), danger: vi.fn() },
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => toast }
})
vi.mock('@/lib/auth-client', () => ({ authClient: { updateUser } }))

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))

const SelectStub = {
    props: ['modelValue', 'options'],
    emits: ['update:model-value'],
    template: '<button class="select-stub" @click="$emit(\'update:model-value\', options[1].value)">{{ modelValue }}</button>',
}

describe('components/profile/timezone-settings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('未设置时展示跟随浏览器哨兵，选择后写入时区', async () => {
        const wrapper = mount(TimezoneSettings, {
            props: { timezone: null },
            global: { stubs: { CaomeiSelect: SelectStub } },
        })

        const select = wrapper.findComponent(SelectStub)
        expect(select.props('modelValue')).toBe('__browser__')
        expect(select.props('options')[0].value).toBe('__browser__')

        await select.trigger('click')
        expect(updateUser).toHaveBeenCalledWith({ timezone: expect.any(String) })
        expect(updateUser.mock.calls[0]![0].timezone).not.toBe('__browser__')
        expect(wrapper.emitted('saved')).toBeTruthy()
    })

    it('保存失败时提示错误且不触发 saved', async () => {
        updateUser.mockRejectedValueOnce(new Error('boom'))
        const wrapper = mount(TimezoneSettings, {
            props: { timezone: 'Asia/Tokyo' },
            global: { stubs: { CaomeiSelect: SelectStub } },
        })

        await wrapper.findComponent(SelectStub).trigger('click')
        await vi.waitFor(() => expect(toast.danger).toHaveBeenCalled())
        expect(wrapper.emitted('saved')).toBeFalsy()
    })
})
