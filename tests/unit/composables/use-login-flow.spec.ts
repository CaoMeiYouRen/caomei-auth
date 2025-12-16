import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useLoginFlow } from '@/composables/use-login-flow'

// Mock Nuxt composables
const { config, useToastMock, useFetchMock, useNuxtAppMock, toastAddMock } = vi.hoisted(() => {
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
        useFetchMock: vi.fn(() => ({
            data: ref({ providers: [] }),
        })),
        useNuxtAppMock: vi.fn(() => ({
            $clarity: {},
        })),
    }
})

mockNuxtImport('useRuntimeConfig', () => () => config)

mockNuxtImport('useNuxtApp', () => useNuxtAppMock)

mockNuxtImport('useFetch', () => useFetchMock)

vi.mock('primevue/usetoast', () => ({
    useToast: useToastMock,
}))

vi.mock('@vueuse/core', () => ({
    useUrlSearchParams: vi.fn(() => reactive({ mode: 'username' })),
    useDark: vi.fn(() => ref(false)),
}))

vi.mock('@/composables/use-clarity', () => ({
    useClarity: vi.fn(() => ({
        event: vi.fn(),
        setTag: vi.fn(),
    })),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            email: vi.fn(),
            username: vi.fn(),
            phoneNumber: vi.fn(),
        },
    },
}))

vi.mock('@/composables/use-otp', () => ({
    useEmailOtp: vi.fn(() => ({ send: vi.fn(), sending: ref(false) })),
    usePhoneOtp: vi.fn(() => ({ send: vi.fn(), sending: ref(false) })),
}))

vi.mock('@/utils/web/captcha', () => ({
    resolveCaptchaToken: vi.fn(),
}))

vi.mock('@/utils/web/navigation', () => ({
    navigateAfterLoginWithDelay: vi.fn(),
}))

describe('useLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with default values', () => {
        const { activeTab, email, username, phone } = useLoginFlow()
        expect(activeTab.value).toBe('username')
        expect(email.value).toBe('')
        expect(username.value).toBe('')
        expect(phone.value).toBe('')
    })

    it('changes mode correctly', () => {
        const { activeTab, changeMode } = useLoginFlow()

        changeMode('email')
        expect(activeTab.value).toBe('email')

        changeMode('phone')
        expect(activeTab.value).toBe('phone')
    })

    it('validates disabled modes', () => {
        config.public.phoneEnabled = false
        config.public.usernameEnabled = false

        const { activeTab, changeMode } = useLoginFlow()

        changeMode('phone')
        expect(activeTab.value).toBe('username') // Should not change
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))

        // Reset config
        config.public.phoneEnabled = true
        config.public.usernameEnabled = true
    })

    it('handles username login success', async () => {
        const { activeTab, username, usernamePassword, login } = useLoginFlow()
        activeTab.value = 'username'
        username.value = 'testuser'
        usernamePassword.value = 'password123'

        // Mock authClient.signIn.username to resolve
        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signIn.username = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            username: 'testuser',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles login validation error', async () => {
        const { activeTab, username, login, errors } = useLoginFlow()
        activeTab.value = 'username'
        username.value = '' // Empty username

        await login()

        expect(errors.value.username).toBeTruthy()
    })

    it('handles email login success with password', async () => {
        const { activeTab, email, emailPassword, login } = useLoginFlow()
        activeTab.value = 'email'
        email.value = 'test@example.com'
        emailPassword.value = 'password123'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signIn.email = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles email login success with OTP', async () => {
        const { activeTab, email, emailCode, emailUseCode, login } = useLoginFlow()
        activeTab.value = 'email'
        emailUseCode.value = true
        email.value = 'test@example.com'
        emailCode.value = '123456'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signIn.emailOtp = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            email: 'test@example.com',
            otp: '123456',
        })
    })

    it('handles phone login success with password', async () => {
        const { activeTab, phone, phonePassword, login } = useLoginFlow()
        activeTab.value = 'phone'
        phone.value = '+8613800138000'
        phonePassword.value = 'password123'

        const signInMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signIn.phoneNumber = signInMock

        await login()

        expect(signInMock).toHaveBeenCalledWith({
            phoneNumber: '+8613800138000',
            password: 'password123',
            rememberMe: true,
        })
    })

    it('handles phone login success with OTP', async () => {
        const { activeTab, phone, phoneCode, phoneUseCode, login } = useLoginFlow()
        activeTab.value = 'phone'
        phoneUseCode.value = true
        phone.value = '+8613800138000'
        phoneCode.value = '123456'

        const verifyMock = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
        const { authClient } = await import('@/lib/auth-client')
        authClient.phoneNumber = { verify: verifyMock } as any

        await login()

        expect(verifyMock).toHaveBeenCalledWith({
            phoneNumber: '+8613800138000',
            code: '123456',
        })
    })

    it('handles login error', async () => {
        const { activeTab, username, usernamePassword, login } = useLoginFlow()
        activeTab.value = 'username'
        username.value = 'testuser'
        usernamePassword.value = 'wrongpassword'

        const signInMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } })
        const { authClient } = await import('@/lib/auth-client')
        authClient.signIn.username = signInMock

        await login()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid credentials',
        }))
    })
})
