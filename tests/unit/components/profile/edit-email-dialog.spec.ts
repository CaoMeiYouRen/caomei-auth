import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useI18nText } from '@/tests/mocks/i18n-text'
import EditEmailDialog from '@/components/profile/dialogs/edit-email-dialog.vue'
const captchaState = vi.hoisted(() => ({ enabled: true }))
vi.mock('@/composables/use-captcha', async () => {
    const { computed } = await import('vue')
    return { useCaptchaEnabled: () => computed(() => captchaState.enabled) }
})


const { toast, fetchMock, resolveCaptchaToken } = vi.hoisted(() => ({
    toast: { success: vi.fn(), danger: vi.fn(), warning: vi.fn(), info: vi.fn() },
    fetchMock: vi.fn(),
    resolveCaptchaToken: vi.fn(async (): Promise<{ token: string } | null> => ({ token: 'captcha-token' })),
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => toast }
})

vi.mock('@/utils/web/captcha', () => ({
    resolveCaptchaToken,
    isCaptchaEnabled: vi.fn(() => true),
}))

vi.mock('@/composables/core/use-form', () => ({
    useForm: ({ initialValues }: { initialValues: Record<string, unknown> }) => {
        const values = ref({ ...initialValues })
        return {
            values,
            errors: ref({}),
            submitting: ref(false),
            handleSubmit: async (fn: (vals: Record<string, unknown>) => Promise<void>) => {
                await fn(values.value)
            },
            reset: () => {
                values.value = { ...initialValues }
            },
            setField: (field: string, value: unknown) => {
                values.value[field] = value
            },
        }
    },
}))

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))
mockNuxtImport('$fetch', () => fetchMock)

const SlotStub = { template: '<div><slot /></div>' }
const InputStub = { template: '<input />' }
const ButtonStub = { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' }

const mountOptions = {
    global: {
        renderStubDefaultSlot: true,
        stubs: {
            BaseDialogV2: SlotStub,
            BaseTooltip: SlotStub,
            BaseInputV2: InputStub,
            CaomeiButton: ButtonStub,
            CaomeiMessage: SlotStub,
            Captcha: { template: '<div />' },
        },
    },
}

describe('components/profile/dialogs/edit-email-dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        captchaState.enabled = true
        resolveCaptchaToken.mockResolvedValue({ token: 'captcha-token' })
    })

    it('4xx / 5xx 时提示失败且不关闭对话框', async () => {
        fetchMock.mockRejectedValueOnce({ data: { message: '该邮箱已被占用' } })

        const wrapper = mount(EditEmailDialog, {
            props: { user: { email: 'old@example.com', emailVerified: true }, visible: true },
            ...mountOptions,
        })

        await wrapper.find('button').trigger('click')
        await vi.waitFor(() => expect(toast.danger).toHaveBeenCalled(), { timeout: 5000 })

        expect(resolveCaptchaToken).toHaveBeenCalledWith(expect.anything(), false)
        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({
            description: '该邮箱已被占用',
        }))
        expect(toast.success).not.toHaveBeenCalled()
        expect(wrapper.emitted('update:user')).toBeFalsy()
        expect(wrapper.emitted('update:visible')).toBeFalsy()
    })

    it('验证码未启用时不要求验证码即可提交', async () => {
        captchaState.enabled = false
        resolveCaptchaToken.mockResolvedValueOnce(null)
        fetchMock.mockResolvedValueOnce({ status: true })

        const wrapper = mount(EditEmailDialog, {
            props: { user: { email: 'old@example.com', emailVerified: false }, visible: true },
            ...mountOptions,
        })

        await wrapper.find('button').trigger('click')
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalled(), { timeout: 5000 })

        expect(resolveCaptchaToken).toHaveBeenCalledWith(expect.anything(), true)
        expect(fetchMock).toHaveBeenCalledWith('/api/security/change-email', expect.objectContaining({
            headers: undefined,
        }))
        expect(toast.danger).not.toHaveBeenCalled()
    })

    it('成功时保留既有成功文案与本地更新', async () => {
        fetchMock.mockResolvedValueOnce({ status: true })

        const wrapper = mount(EditEmailDialog, {
            props: { user: { email: 'old@example.com', emailVerified: false }, visible: true },
            ...mountOptions,
        })

        await wrapper.find('button').trigger('click')
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalled(), { timeout: 5000 })

        expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
            title: '验证邮件已发送',
        }))
        expect(toast.danger).not.toHaveBeenCalled()
        expect(wrapper.emitted('update:user')).toBeTruthy()
    })
})
