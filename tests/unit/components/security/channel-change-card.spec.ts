import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelChangeCard from '@/components/security/channel-change-card.vue'
import type { ChannelChangeApi, ChannelChangeStatus } from '@/composables/use-channel-change'

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
const InputStub = {
    props: ['modelValue'],
    emits: ['update:model-value'],
    template: '<input class="input-stub" :value="modelValue" @input="$emit(\'update:model-value\', $event.target.value)">',
}
const EmailDialogStub = {
    props: ['visible', 'phoneVerified', 'api'],
    emits: ['update:visible', 'submitted'],
    template: '<div class="email-dialog-stub" :data-visible="visible"><button class="dialog-submit" @click="$emit(\'submitted\')">submit</button></div>',
}

const global = {
    stubs: {
        CaomeiButton: ButtonStub,
        CaomeiMessage: MessageStub,
        CaomeiInput: InputStub,
        EmailChangeDialog: EmailDialogStub,
    },
}

function createApi(status: ChannelChangeStatus, overrides: Partial<ChannelChangeApi> = {}): ChannelChangeApi {
    return {
        status: vi.fn(async () => status),
        request: vi.fn(async () => ({ requestId: 'req-1', maskedTarget: 'n***@example.com', factor: 'totp', requiresVerify: true })),
        confirm: vi.fn(async () => ({ status: 'pending' as const, scheduledAt: new Date().toISOString(), remainingMs: 1000, coolingOffHours: 24 })),
        cancel: vi.fn(async () => ({ state: 'cancelled' })),
        sendProofOtp: vi.fn(async () => ({ channel: 'phone', expiresInSeconds: 600 })),
        ...overrides,
    }
}

describe('components/security/channel-change-card', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the entry point when there is no request and refreshes after submitting', async () => {
        const api = createApi({ state: 'none' })
        const wrapper = mount(ChannelChangeCard, { props: { api }, global })
        await flushPromises()
        expect(wrapper.text()).toContain('更换邮箱')
        expect(wrapper.find('.email-dialog-stub').attributes('data-visible')).toBe('false')

        await wrapper.findAll('button').find((button) => button.text().includes('更换邮箱'))!.trigger('click')
        expect(wrapper.find('.email-dialog-stub').attributes('data-visible')).toBe('true')

        await wrapper.find('.dialog-submit').trigger('click')
        await flushPromises()
        expect(api.status).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })

    it('shows the cooling-off countdown and cancels the change', async () => {
        const api = createApi({
            state: 'pending',
            maskedTarget: 'n***@example.com',
            scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            remainingMs: 2 * 60 * 60 * 1000,
        })
        const wrapper = mount(ChannelChangeCard, { props: { api }, global })
        await flushPromises()
        expect(wrapper.text()).toContain('更换邮箱待生效')
        expect(wrapper.text()).toContain('2 小时 0 分')

        await wrapper.findAll('button').find((button) => button.text().includes('撤销更换'))!.trigger('click')
        await flushPromises()
        expect(api.cancel).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalled()
        wrapper.unmount()
    })

    it('verifies ownership when the request has no scheduled time yet', async () => {
        const api = createApi({
            state: 'pending',
            maskedTarget: 'n***@example.com',
            scheduledAt: null,
            remainingMs: 0,
        })
        const wrapper = mount(ChannelChangeCard, { props: { api }, global })
        await flushPromises()
        expect(wrapper.text()).toContain('验证新邮箱')

        await wrapper.find('input.input-stub').setValue('123456')
        await wrapper.findAll('button').find((button) => button.text() === '验证')!.trigger('click')
        await flushPromises()
        expect(api.confirm).toHaveBeenCalledWith('123456')
        wrapper.unmount()
    })

    it('shows the confirmed state and expired notice', async () => {
        const confirmed = mount(ChannelChangeCard, {
            props: { api: createApi({ state: 'confirmed', maskedTarget: 'n***@example.com', remainingMs: 0 }) },
            global,
        })
        await flushPromises()
        expect(confirmed.text()).toContain('邮箱已更换')
        expect(confirmed.text()).toContain('n***@example.com')
        confirmed.unmount()

        const expired = mount(ChannelChangeCard, {
            props: { api: createApi({ state: 'expired' }) },
            global,
        })
        await flushPromises()
        expect(expired.text()).toContain('更换邮箱申请已过期')
        expired.unmount()
    })

    it('reports status failures through a toast', async () => {
        const api = createApi({ state: 'none' }, {
            status: vi.fn(async () => {
                throw new Error('boom')
            }),
        })
        const wrapper = mount(ChannelChangeCard, { props: { api }, global })
        await flushPromises()
        expect(toast.danger).toHaveBeenCalled()
        wrapper.unmount()
    })
})
