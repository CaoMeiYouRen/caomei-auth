import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQuickLoginFlow } from '@/composables/use-quick-login-flow'

vi.mock('@/lib/auth-client', () => ({ authClient: {} }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@vueuse/core', () => ({ useUrlSearchParams: () => ({ tab: 'email' }) }))

const { sendEmailSpy, sendPhoneSpy } = vi.hoisted(() => ({
    sendEmailSpy: vi.fn(),
    sendPhoneSpy: vi.fn(),
}))

vi.mock('@/composables/use-otp', () => ({
    useEmailOtp: () => ({ send: sendEmailSpy, sending: ref(false) }),
    usePhoneOtp: () => ({ send: sendPhoneSpy, sending: ref(false) }),
}))

const useRuntimeConfigMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

describe('useQuickLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRuntimeConfigMock.mockReturnValue({ public: { phoneEnabled: true } })
    })

    it('should initialize with email tab by default', () => {
        const { activeTab } = useQuickLoginFlow()
        expect(activeTab.value).toBe('email')
    })

    it('should validate email before sending code', async () => {
        const { email, sendEmailVerificationCode } = useQuickLoginFlow()
        email.value = 'test@example.com'
        await sendEmailVerificationCode()
        expect(sendEmailSpy).toHaveBeenCalled()
    })

    it('should switch tabs correctly', () => {
        const { activeTab, changeTab } = useQuickLoginFlow()
        changeTab('phone')
        expect(activeTab.value).toBe('phone')
        changeTab('email')
        expect(activeTab.value).toBe('email')
    })

    it('should prevent switching to phone if disabled', () => {
        useRuntimeConfigMock.mockReturnValue({ public: { phoneEnabled: false } })
        const { activeTab, changeTab } = useQuickLoginFlow()
        changeTab('phone')
        expect(activeTab.value).toBe('email')
    })
})
