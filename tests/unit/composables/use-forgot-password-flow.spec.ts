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
            // Schema uses 'code' field name, not 'emailCode'
            expect(errors.value.code).toBe('请输入邮箱验证码')
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

        it('should validate invalid phone number', async () => {
            const { changeMode, phone, resetPassword, errors } = useForgotPasswordFlow()
            changeMode('phone')

            phone.value = 'invalid-phone'

            await resetPassword()
            expect(errors.value.phone).toContain('有效')
        })

        it('should validate empty phone code', async () => {
            const { changeMode, phone, resetPassword, errors } = useForgotPasswordFlow()
            changeMode('phone')

            phone.value = '+8613800138000'

            await resetPassword()
            // Schema uses 'code' field name, not 'phoneCode'
            expect(errors.value.code).toBe('请输入短信验证码')
        })

        it('should handle phone reset password error', async () => {
            const { changeMode, phone, phoneCode, newPassword, confirmPassword, resetPassword } = useForgotPasswordFlow()
            changeMode('phone')

            phone.value = '+8613800138000'
            phoneCode.value = '123456'
            newPassword.value = 'Password123!'
            confirmPassword.value = 'Password123!'

            mockAuthClient.phoneNumber.resetPassword.mockResolvedValue({
                data: { status: false },
            })

            await resetPassword()

            expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
        })
    })

    describe('Computed Properties', () => {
        it('should compute canSendEmailCode correctly', () => {
            const { email, canSendEmailCode, errors } = useForgotPasswordFlow()

            // Empty email - should not be able to send
            email.value = ''
            expect(canSendEmailCode.value).toBe(false)

            // Valid email - should be able to send
            email.value = 'test@example.com'
            expect(canSendEmailCode.value).toBe(true)

            // Invalid email - should not be able to send
            email.value = 'invalid-email'
            expect(canSendEmailCode.value).toBe(false)

            // Email with error - should not be able to send
            email.value = 'test@example.com'
            errors.value.email = 'Some error'
            expect(canSendEmailCode.value).toBe(false)
        })

        it('should compute canSendPhoneCode correctly', () => {
            const { phone, canSendPhoneCode, errors } = useForgotPasswordFlow()

            // Empty phone - should not be able to send
            phone.value = ''
            expect(canSendPhoneCode.value).toBe(false)

            // Valid phone - should be able to send
            phone.value = '+8613800138000'
            expect(canSendPhoneCode.value).toBe(true)

            // Invalid phone - should not be able to send
            phone.value = '123'
            expect(canSendPhoneCode.value).toBe(false)

            // Phone with error - should not be able to send
            phone.value = '+8613800138000'
            errors.value.phone = 'Some error'
            expect(canSendPhoneCode.value).toBe(false)
        })
    })

    describe('Send Code Functions', () => {
        it('should call sendEmailOtp with correct params', async () => {
            const { email, sendEmailCode } = useForgotPasswordFlow()

            email.value = 'test@example.com'

            sendEmailOtp.mockImplementation(async () => {})

            await sendEmailCode()

            expect(sendEmailOtp).toHaveBeenCalledWith(
                'test@example.com',
                'forget-password',
                expect.anything(),
                expect.any(Function),
                expect.any(Function),
            )
        })

        it('should call sendPhoneOtp with correct params', async () => {
            const { phone, sendPhoneCode } = useForgotPasswordFlow()

            phone.value = '+8613800138000'

            sendPhoneOtp.mockImplementation(async () => {})

            await sendPhoneCode()

            expect(sendPhoneOtp).toHaveBeenCalledWith(
                '+8613800138000',
                'forget-password',
                expect.anything(),
                expect.any(Function),
                expect.any(Function),
            )
        })

        it('should set error on invalid email when sending code', async () => {
            const { email, sendEmailCode, errors } = useForgotPasswordFlow()

            email.value = 'invalid-email'

            sendEmailOtp.mockImplementation(async (_val: string, _type: string, _captcha: any, validator: () => boolean) => {
                if (!validator()) {
                    // do nothing
                }
            })

            await sendEmailCode()

            expect(errors.value.email).toBeTruthy()
        })

        it('should set error on invalid phone when sending code', async () => {
            const { phone, sendPhoneCode, errors } = useForgotPasswordFlow()

            phone.value = 'invalid-phone'

            sendPhoneOtp.mockImplementation(async (_val: string, _type: string, _captcha: any, validator: () => boolean) => {
                if (!validator()) {
                    // do nothing
                }
            })

            await sendPhoneCode()

            expect(errors.value.phone).toBeTruthy()
        })
    })

    describe('Password Validation', () => {
        it('should validate weak password', async () => {
            const { email, emailCode, newPassword, confirmPassword, resetPassword, errors } = useForgotPasswordFlow()
            email.value = 'test@example.com'
            emailCode.value = '123456'
            newPassword.value = '123' // Too weak
            confirmPassword.value = '123'

            await resetPassword()
            expect(Object.keys(errors.value).length).toBeGreaterThan(0)
        })

        it('should validate password length', async () => {
            const { email, emailCode, newPassword, confirmPassword, resetPassword, errors } = useForgotPasswordFlow()
            email.value = 'test@example.com'
            emailCode.value = '123456'
            newPassword.value = 'Pa1!' // Too short (min 6 chars)
            confirmPassword.value = 'Pa1!'

            await resetPassword()
            expect(errors.value.newPassword).toBe('密码长度不能少于 6 位')
        })
    })
})
