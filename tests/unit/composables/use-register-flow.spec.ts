import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { useRegisterFlow } from '@/composables/use-register-flow'

// Mock Nuxt composables
const { config, useToastMock, toastMocks } = vi.hoisted(() => {
    const hoistedToastMocks = { show: vi.fn(), success: vi.fn(), danger: vi.fn(), warning: vi.fn(), info: vi.fn() }
    return {
        config: {
            public: {
                phoneEnabled: true,
                usernameEnabled: true,
            },
        },
        toastMocks: hoistedToastMocks,
        useToastMock: vi.fn(() => hoistedToastMocks),
    }
})

vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return {
        ...actual,
        useRuntimeConfig: () => config,
    }
})

vi.mock('caomei-ui', () => ({
    useToast: useToastMock,
}))

vi.mock('@vueuse/core', () => ({
    useUrlSearchParams: vi.fn(() => reactive({ mode: 'email' })),
}))

vi.mock('@/composables/core/use-form', () => ({
    useForm: vi.fn(({ initialValues }) => {
        const values = ref({ ...initialValues })
        const errors = ref({})
        return {
            values,
            errors,
            submitting: ref(false),
            handleSubmit: vi.fn((fn) => fn(values.value)),
            setErrors: vi.fn((newErrors) => { errors.value = newErrors }),
            setField: vi.fn((field, value) => { values.value[field] = value }),
        }
    }),
}))

vi.mock('@/composables/use-otp', () => ({
    usePhoneOtp: vi.fn(() => ({ send: vi.fn(), sending: ref(false) })),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signUp: {
            email: vi.fn(),
        },
    },
}))

vi.mock('@/utils/web/captcha', () => ({
    resolveCaptchaToken: vi.fn(),
}))

describe('useRegisterFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with default values', () => {
        const { activeTab, email, username, phone } = useRegisterFlow()
        expect(activeTab.value).toBe('email')
        expect(email.value).toBe('')
        expect(username.value).toBe('')
        expect(phone.value).toBe('')
    })


    it('handles phone disabled', () => {
        config.public.phoneEnabled = false

        const { activeTab, changeMode } = useRegisterFlow()

        changeMode('phone')

        expect(activeTab.value).not.toBe('phone')
        expect(toastMocks.danger).toHaveBeenCalled()

        // Reset config
        config.public.phoneEnabled = true
    })

    it('updates fields correctly', () => {
        const { email, username, password } = useRegisterFlow()

        email.value = 'test@example.com'
        expect(email.value).toBe('test@example.com')

        username.value = 'testuser'
        expect(username.value).toBe('testuser')

        password.value = 'password123'
        expect(password.value).toBe('password123')
    })

    it('handles email registration success', async () => {
        const { activeTab, email, password, confirmPassword, agreedToTerms, register } = useRegisterFlow()
        activeTab.value = 'email'
        email.value = 'test@example.com'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const signUpMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signUp.email = signUpMock

        await register()

        expect(signUpMock).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            name: '',
            username: '',
        }, undefined)
    })

    it('handles phone registration success', async () => {
        const { activeTab, phone, phoneCode, password, confirmPassword, agreedToTerms, register } = useRegisterFlow()
        activeTab.value = 'phone'
        phone.value = '+8613800138000'
        phoneCode.value = '123456'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const verifyMock = vi.fn().mockResolvedValue({ data: { status: true }, error: null })
        const updateUserMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.phoneNumber = { verify: verifyMock } as any
        authClient.updateUser = updateUserMock

        await register()

        expect(verifyMock).toHaveBeenCalledWith({
            phoneNumber: '+8613800138000',
            code: '123456',
        })
        expect(updateUserMock).toHaveBeenCalled()
    })

    it('switches mode and clears errors', () => {
        const { activeTab, errors, changeMode } = useRegisterFlow()

        changeMode('phone')

        expect(activeTab.value).toBe('phone')
        expect(errors.value).toEqual({})
    })

    it('stops registration when captcha is not resolved', async () => {
        const { email, password, confirmPassword, agreedToTerms, errors, register } = useRegisterFlow()
        email.value = 'test@example.com'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const { resolveCaptchaToken } = await import('@/utils/web/captcha')
        vi.mocked(resolveCaptchaToken).mockRejectedValue(new Error('请先完成验证码验证'))

        const { authClient } = await import('@/lib/auth-client')
        const signUpMock = vi.fn()
        authClient.signUp.email = signUpMock

        await register()

        expect(signUpMock).not.toHaveBeenCalled()
        expect(errors.value.captcha).toBe('请先完成验证码验证')
        expect(toastMocks.warning).toHaveBeenCalled()
    })

    it('reports email registration api error', async () => {
        const { email, password, confirmPassword, agreedToTerms, register } = useRegisterFlow()
        email.value = 'test@example.com'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const { resolveCaptchaToken } = await import('@/utils/web/captcha')
        vi.mocked(resolveCaptchaToken).mockResolvedValue(null)

        const { authClient } = await import('@/lib/auth-client')
        authClient.signUp.email = vi.fn().mockResolvedValue({ error: { message: '邮箱已存在' } })

        await register()

        expect(toastMocks.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '邮箱已存在' }))
    })

    it('reports phone verification failure', async () => {
        const { activeTab, phone, phoneCode, password, confirmPassword, agreedToTerms, register } = useRegisterFlow()
        activeTab.value = 'phone'
        phone.value = '+8613800138000'
        phoneCode.value = '123456'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const { authClient } = await import('@/lib/auth-client')
        authClient.phoneNumber = { verify: vi.fn().mockResolvedValue({ data: { status: false } }) } as any

        await register()

        expect(toastMocks.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '手机号码验证失败' }))
    })

    it('reports update user failure after phone verification', async () => {
        const { activeTab, phone, phoneCode, password, confirmPassword, agreedToTerms, register } = useRegisterFlow()
        activeTab.value = 'phone'
        phone.value = '+8613800138000'
        phoneCode.value = '123456'
        password.value = 'password123'
        confirmPassword.value = 'password123'
        agreedToTerms.value = true

        const { authClient } = await import('@/lib/auth-client')
        authClient.phoneNumber = { verify: vi.fn().mockResolvedValue({ data: { status: true } }) } as any
        authClient.updateUser = vi.fn().mockResolvedValue({ error: { message: '更新失败' } })

        await register()

        expect(toastMocks.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '更新失败' }))
    })

    it('validates phone before sending the register code', async () => {
        const phoneSend = vi.fn()
        const { usePhoneOtp } = await import('@/composables/use-otp')
        vi.mocked(usePhoneOtp).mockReturnValue({ send: phoneSend, sending: ref(false) } as any)

        const { sendPhoneCode, phone, errors } = useRegisterFlow()
        phone.value = '123'
        await sendPhoneCode()

        const validate = phoneSend.mock.calls[0]?.[3] as () => boolean
        expect(validate()).toBe(false)
        expect(errors.value.phone).toBeTruthy()
    })
})
