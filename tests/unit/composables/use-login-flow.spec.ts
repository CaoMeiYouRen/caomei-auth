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
})
