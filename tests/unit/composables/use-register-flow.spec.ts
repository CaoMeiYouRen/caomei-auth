import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRegisterFlow } from '@/composables/use-register-flow'

// Mock Nuxt composables
const { config, useToastMock, toastAddMock } = vi.hoisted(() => {
    const addMock = vi.fn()
    return {
        config: {
            public: {
                phoneEnabled: true,
                usernameEnabled: true,
            },
        },
        toastAddMock: addMock,
        useToastMock: vi.fn(() => ({
            add: addMock,
        })),
    }
})

mockNuxtImport('useRuntimeConfig', () => () => config)

vi.mock('primevue/usetoast', () => ({
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
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))

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
})
