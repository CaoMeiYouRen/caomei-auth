import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQuickLoginFlow } from '@/composables/use-quick-login-flow'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            emailOtp: vi.fn(),
        },
    },
}))

const addToastMock = vi.fn()
vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: addToastMock,
    }),
}))

const paramsMock = { tab: 'email' }
vi.mock('@vueuse/core', () => ({
    useUrlSearchParams: () => paramsMock,
}))

const { sendEmailSpy, sendPhoneSpy } = vi.hoisted(() => ({
    sendEmailSpy: vi.fn(),
    sendPhoneSpy: vi.fn(),
}))

vi.mock('@/composables/use-otp', () => ({
    useEmailOtp: () => ({ send: sendEmailSpy, sending: ref(false) }),
    usePhoneOtp: () => ({ send: sendPhoneSpy, sending: ref(false) }),
}))

vi.mock('@/utils/web/navigation', () => ({
    navigateAfterLoginWithDelay: vi.fn(),
}))

const useRuntimeConfigMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

describe('useQuickLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRuntimeConfigMock.mockReturnValue({ public: { phoneEnabled: true } })
        paramsMock.tab = 'email'
    })

    it('should initialize with email tab by default', () => {
        const { activeTab } = useQuickLoginFlow()
        expect(activeTab.value).toBe('email')
    })

    it('should validate email before sending code', async () => {
        const { email, sendEmailVerificationCode, errors } = useQuickLoginFlow()

        // Empty email
        email.value = ''
        await sendEmailVerificationCode()
        expect(errors.value.email).toBe('请输入有效的邮箱地址')
        expect(sendEmailSpy).not.toHaveBeenCalled()

        // Invalid email
        email.value = 'invalid-email'
        await sendEmailVerificationCode()
        expect(errors.value.email).toBe('请输入有效的邮箱地址')
        expect(sendEmailSpy).not.toHaveBeenCalled()

        // Valid email
        email.value = 'test@example.com'
        sendEmailSpy.mockResolvedValue(true)
        await sendEmailVerificationCode()
        expect(sendEmailSpy).toHaveBeenCalled()
        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('should handle email code sending failure', async () => {
        const { email, sendEmailVerificationCode, errors } = useQuickLoginFlow()
        email.value = 'test@example.com'
        sendEmailSpy.mockResolvedValue(false)

        await sendEmailVerificationCode()

        expect(errors.value.email).toBe('验证码发送失败')
    })

    it('should validate phone before sending code', async () => {
        const { phone, sendPhoneVerificationCode, errors } = useQuickLoginFlow()

        // Empty phone
        phone.value = ''
        await sendPhoneVerificationCode()
        expect(errors.value.phone).toBe('请输入有效的手机号')
        expect(sendPhoneSpy).not.toHaveBeenCalled()

        // Invalid phone
        phone.value = '123'
        await sendPhoneVerificationCode()
        expect(errors.value.phone).toBe('请输入有效的手机号')
        expect(sendPhoneSpy).not.toHaveBeenCalled()

        // Valid phone
        phone.value = '+8613800138000'
        sendPhoneSpy.mockResolvedValue(true)
        await sendPhoneVerificationCode()
        expect(sendPhoneSpy).toHaveBeenCalled()
        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('should handle phone code sending failure', async () => {
        const { phone, sendPhoneVerificationCode, errors } = useQuickLoginFlow()
        phone.value = '+8613800138000'
        sendPhoneSpy.mockResolvedValue(false)

        await sendPhoneVerificationCode()

        expect(errors.value.phone).toBe('验证码发送失败')
    })

    it('should switch tabs correctly', () => {
        const { activeTab, changeTab, errors } = useQuickLoginFlow()

        // Set some errors
        errors.value.email = 'some error'

        changeTab('phone')
        expect(activeTab.value).toBe('phone')
        expect(paramsMock.tab).toBe('phone')
        expect(errors.value).toEqual({}) // Should clear errors

        changeTab('email')
        expect(activeTab.value).toBe('email')
        expect(paramsMock.tab).toBe('email')
    })

    it('should prevent switching to phone if disabled', () => {
        useRuntimeConfigMock.mockReturnValue({ public: { phoneEnabled: false } })
        const { activeTab, changeTab } = useQuickLoginFlow()

        changeTab('phone')

        expect(activeTab.value).toBe('email')
        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '功能未启用',
        }))
    })

    it('should handle email login validation', async () => {
        const { email, loginWithEmail, errors } = useQuickLoginFlow()

        // Invalid email
        email.value = 'invalid'
        await loginWithEmail()
        expect(errors.value.email).toBe('请输入有效的邮箱地址')

        // Missing code
        email.value = 'test@example.com'
        await loginWithEmail()
        expect(errors.value.emailCode).toBe('请输入验证码')
    })

    it('should handle successful email login', async () => {
        const { email, emailCode, loginWithEmail } = useQuickLoginFlow()

        email.value = 'test@example.com'
        emailCode.value = '123456'
        vi.mocked(authClient.signIn.emailOtp).mockResolvedValue({ data: {}, error: null } as any)

        await loginWithEmail()

        expect(authClient.signIn.emailOtp).toHaveBeenCalledWith({
            email: 'test@example.com',
            otp: '123456',
        })
        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('should handle failed email login', async () => {
        const { email, emailCode, loginWithEmail, errors } = useQuickLoginFlow()

        email.value = 'test@example.com'
        emailCode.value = '123456'
        vi.mocked(authClient.signIn.emailOtp).mockResolvedValue({
            data: null,
            error: { message: 'Invalid code' },
        } as any)

        await loginWithEmail()

        expect(errors.value.emailCode).toBe('Invalid code')
    })
})
