import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecoveryCodePanel, { type RecoveryCodeApi } from '@/components/security/recovery-code-panel.vue'

const { toast } = vi.hoisted(() => ({
    toast: { success: vi.fn(), danger: vi.fn(), warning: vi.fn() },
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => toast }
})

vi.mock('@/composables/utils/use-i18n-text', async () => {
    const { useI18nText } = await import('@/tests/mocks/i18n-text')
    return { useI18nText: () => useI18nText() }
})

const ButtonStub = {
    props: ['disabled', 'variant', 'tone'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>',
}
const MessageStub = { template: '<div class="message-stub"><slot /></div>' }
const FormItemStub = { template: '<div class="form-item-stub"><slot /></div>' }
const InputStub = {
    props: ['modelValue'],
    emits: ['update:model-value'],
    template: '<input class="input-stub" :value="modelValue" @input="$emit(\'update:model-value\', $event.target.value)">',
}
const SelectStub = {
    props: ['modelValue', 'options'],
    emits: ['update:model-value'],
    template: '<select class="select-stub" :value="modelValue" @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
}
const DialogStub = {
    props: ['visible', 'title'],
    emits: ['update:visible', 'hide'],
    template: '<div v-if="visible" class="dialog-stub"><p class="dialog-title">{{ title }}</p><slot /><slot name="footer" /></div>',
}

const global = {
    stubs: {
        CaomeiButton: ButtonStub,
        CaomeiMessage: MessageStub,
        CaomeiFormItem: FormItemStub,
        CaomeiInput: InputStub,
        CaomeiSelect: SelectStub,
        BaseDialogV2: DialogStub,
    },
}

function createApi(overrides: Partial<RecoveryCodeApi> = {}): RecoveryCodeApi {
    return {
        status: vi.fn(async () => ({ remaining: 3, total: 10, codes: [] })),
        regenerate: vi.fn(async () => ({ recoveryCodes: ['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-GGGG-HHHH'], remaining: 2 })),
        ...overrides,
    }
}

describe('components/security/recovery-code-panel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads and shows the remaining count without exposing plaintext', async () => {
        const api = createApi()
        const wrapper = mount(RecoveryCodePanel, { props: { api }, global })
        await flushPromises()
        expect(wrapper.text()).toContain('剩余可用：3 条')
        expect(wrapper.text()).not.toContain('AAAA-BBBB')
        expect(api.status).toHaveBeenCalled()
    })

    it('regenerates without a factor when 2FA is disabled and shows codes once', async () => {
        const api = createApi()
        const wrapper = mount(RecoveryCodePanel, { props: { api }, global })
        await flushPromises()

        await wrapper.findAll('button').find((button) => button.text().includes('恢复码'))!.trigger('click')
        expect(wrapper.find('.dialog-stub').text()).toContain('重新签发会立即让全部旧恢复码失效')

        await wrapper.findAll('button').find((button) => button.text() === '确认')!.trigger('click')
        await flushPromises()

        expect(api.regenerate).toHaveBeenCalledWith({})
        expect(wrapper.text()).toContain('AAAA-BBBB-CCCC-DDDD')
        expect(wrapper.text()).toContain('EEEE-FFFF-GGGG-HHHH')
        expect(wrapper.text()).toContain('关闭后无法再次查看')

        /* 关闭后明文从内存与界面清除 */
        await wrapper.findAll('button').find((button) => button.text() === '完成')!.trigger('click')
        await flushPromises()
        expect(wrapper.text()).not.toContain('AAAA-BBBB-CCCC-DDDD')
    })

    it('requires a second factor when 2FA is enabled', async () => {
        const api = createApi()
        const wrapper = mount(RecoveryCodePanel, { props: { api, twoFactorEnabled: true }, global })
        await flushPromises()

        await wrapper.findAll('button').find((button) => button.text().includes('恢复码'))!.trigger('click')
        const confirmButton = wrapper.findAll('button').find((button) => button.text() === '确认')!
        expect(confirmButton.attributes('disabled')).toBeDefined()

        await wrapper.find('input.input-stub').setValue('123456')
        await confirmButton.trigger('click')
        await flushPromises()
        expect(api.regenerate).toHaveBeenCalledWith({ factor: 'totp', code: '123456' })
    })

    it('reports load failures without crashing', async () => {
        const api = createApi({
            status: vi.fn(async () => {
                throw new Error('boom')
            }),
        })
        mount(RecoveryCodePanel, { props: { api }, global })
        await flushPromises()
        expect(toast.danger).toHaveBeenCalled()
    })
})
