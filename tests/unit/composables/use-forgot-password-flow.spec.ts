import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, reactive } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useForgotPasswordFlow } from '@/composables/use-forgot-password-flow'

// Mocks
const { mockUseUrlSearchParams, mockUseToast, mockNavigateTo, mockUseRuntimeConfig, mockAuthClient, mockUseEmailOtp, mockUsePhoneOtp } = vi.hoisted(() => ({
    mockUseUrlSearchParams: vi.fn(),
    mockUseToast: vi.fn(),
    mockNavigateTo: vi.fn(),
    mockUseRuntimeConfig: vi.fn(),
    mockAuthClient: {
        emailOtp: {
            resetPassword: vi.fn(),
        },
        phoneNumber: {
            resetPassword: vi.fn(),
        },
    },
    mockUseEmailOtp: vi.fn(),
    mockUsePhoneOtp: vi.fn(),
}))

// Mock dependencies
vi.mock('@vueuse/core', () => ({
    useUrlSearchParams: (...args: any[]) => mockUseUrlSearchParams(...args),
}))

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockUseToast(),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: mockAuthClient,
}))

vi.mock('@/composables/use-otp', () => ({
    useEmailOtp: () => mockUseEmailOtp(),
    usePhoneOtp: () => mockUsePhoneOtp(),
}))

// Mock Vue to handle onMounted
vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>()
    return {
        ...actual,
        onMounted: (fn: () => void) => fn(),
    }
})

// Mock Nuxt composables
mockNuxtImport('useRuntimeConfig', () => mockUseRuntimeConfig)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('useForgotPasswordFlow', () => {
    let toastAdd: any
    let sendEmailOtp: any
    let sendPhoneOtp: any
    let urlParams: any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        // Setup default mocks
        mockUseRuntimeConfig.mockReturnValue({
            public: {
                phoneEnabled: true,
            },
        })

        urlParams = reactive({ mode: 'email' })
        mockUseUrlSearchParams.mockReturnValue(urlParams)

        toastAdd = vi.fn()
        mockUseToast.mockReturnValue({ add: toastAdd })

        sendEmailOtp = vi.fn()
        mockUseEmailOtp.mockReturnValue({
            send: sendEmailOtp,
            sending: ref(false),
        })

        sendPhoneOtp = vi.fn()
        mockUsePhoneOtp.mockReturnValue({
            send: sendPhoneOtp,
            sending: ref(false),
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should initialize with default values', () => {
        const { email, phone, activeTab } = useForgotPasswordFlow()
        expect(email.value).toBe('')
        expect(phone.value).toBe('')
        expect(activeTab.value).toBe('email')
    })

    it('should respect phoneEnabled config', () => {
        mockUseRuntimeConfig.mockReturnValue({
            public: {
                phoneEnabled: false,
            },
        })

        const { phoneEnabled } = useForgotPasswordFlow()
        expect(phoneEnabled).toBe(false)
    })

    it('should switch modes', () => {
        const { activeTab, changeMode } = useForgotPasswordFlow()

        changeMode('phone')
        expect(activeTab.value).toBe('phone')
        expect(urlParams.mode).toBe('phone')

        changeMode('email')
        expect(activeTab.value).toBe('email')
        expect(urlParams.mode).toBe('email')
    })

    describe('Validation', () => {
        it('should validate email before sending code', async () => {
            const { email, sendEmailCode, errors } = useForgotPasswordFlow()

            // Empty email
            email.value = ''

            // Mock implementation to execute the validator callback
            sendEmailOtp.mockImplementation(async (_val: string, _type: string, _captcha: any, validator: () => boolean) => {
                if (!validator()) {
                    // do nothing
                }
            })

            await sendEmailCode()
            expect(errors.value.email).toBeTruthy()
        })
    })

    describe('Reset Password', () => {
        it('should validate empty fields for email mode', async () => {
            const { resetPassword, errors } = useForgotPasswordFlow()

            await resetPassword()
            expect(errors.value.email).toBe('请输入邮箱')
        })

        it('should validate invalid email', async () => {
            const { email, resetPassword, errors } = useForgotPasswordFlow()
            email.value = 'invalid-email'

            await resetPassword()
            expect(errors.value.email).toContain('有效')
        })

        it('should validate empty code', async () => {
            const { email, resetPassword, errors } = useForgotPasswordFlow()
            email.value = 'test@example.com'

            await resetPassword()
            expect(errors.value.emailCode).toBe('请输入邮箱验证码')
        })

        it('should validate password match', async () => {
            const { email, emailCode, newPassword, confirmPassword, resetPassword, errors } = useForgotPasswordFlow()
            email.value = 'test@example.com'
            emailCode.value = '123456'
            newPassword.value = 'Password123!'
            confirmPassword.value = 'Password1234!' // Mismatch

            await resetPassword()
            expect(errors.value.confirmPassword).toBeTruthy()
        })

        it('should call authClient.emailOtp.resetPassword on success', async () => {
            const { email, emailCode, newPassword, confirmPassword, resetPassword } = useForgotPasswordFlow()
            email.value = 'test@example.com'
            emailCode.value = '123456'
            newPassword.value = 'Password123!'
            confirmPassword.value = 'Password123!'

            mockAuthClient.emailOtp.resetPassword.mockResolvedValue({ error: null })

            await resetPassword()

            expect(mockAuthClient.emailOtp.resetPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                otp: '123456',
                password: 'Password123!',
            })
            expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))

            vi.advanceTimersByTime(1600)
            expect(mockNavigateTo).toHaveBeenCalledWith('/login?mode=email')
        })

        it('should handle reset password error', async () => {
            const { email, emailCode, newPassword, confirmPassword, resetPassword } = useForgotPasswordFlow()
            email.value = 'test@example.com'
            emailCode.value = '123456'
            newPassword.value = 'Password123!'
            confirmPassword.value = 'Password123!'

            mockAuthClient.emailOtp.resetPassword.mockResolvedValue({
                error: { message: 'Invalid code' },
            })

            await resetPassword()

            expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Invalid code' }))
        })
    })

    describe('Phone Mode', () => {
        beforeEach(() => {
            urlParams.mode = 'phone'
        })

        it('should validate empty fields for phone mode', async () => {
            const { changeMode, resetPassword, errors } = useForgotPasswordFlow()
            changeMode('phone')

            await resetPassword()
            expect(errors.value.phone).toBe('请输入手机号')
        })

        it('should call authClient.phoneNumber.resetPassword on success', async () => {
            const { changeMode, phone, phoneCode, newPassword, confirmPassword, resetPassword, errors } = useForgotPasswordFlow()
            changeMode('phone')

            phone.value = '+8613800138000'
            phoneCode.value = '123456'
            newPassword.value = 'Password123!'
            confirmPassword.value = 'Password123!'

            mockAuthClient.phoneNumber.resetPassword.mockResolvedValue({
                data: { status: true },
            })

            await resetPassword()

            if (Object.keys(errors.value).length > 0) {
                console.log('Errors:', errors.value)
            }

            expect(mockAuthClient.phoneNumber.resetPassword).toHaveBeenCalledWith({
                phoneNumber: '+8613800138000',
                otp: '123456',
                newPassword: 'Password123!',
            })
            expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
    })
})
