import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSecuritySettings } from '@/composables/use-security-settings'

// Mock Nuxt composables
const mocks = vi.hoisted(() => ({
    useToast: vi.fn(() => ({
        add: vi.fn(),
    })),
    useRuntimeConfig: vi.fn(() => ({
        public: {},
    })),
}))

mockNuxtImport('useRuntimeConfig', () => mocks.useRuntimeConfig)

vi.mock('primevue/usetoast', () => ({
    useToast: mocks.useToast,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => ref({ data: { user: { id: '1' } } })),
        twoFactor: {
            enable: vi.fn(),
            disable: vi.fn(),
        },
        listSessions: vi.fn(),
        revokeSession: vi.fn(),
        revokeOtherSessions: vi.fn(),
        revokeSessions: vi.fn(),
    },
}))

vi.mock('@/utils/shared/qrcode', () => ({
    generateQRCode: vi.fn(() => Promise.resolve('data:image/png;base64,...')),
}))

vi.mock('@/utils/shared/useragent', () => ({
    getBrowser: vi.fn(() => 'Chrome'),
    getOs: vi.fn(() => 'Windows'),
}))

describe('useSecuritySettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes correctly', () => {
        const { showTotpSetup, showBackupCodes } = useSecuritySettings()
        expect(showTotpSetup.value).toBe(false)
        expect(showBackupCodes.value).toBe(false)
    })

    it('enables 2FA flow', () => {
        const { enable2FA, showPasswordDialog, passwordDialogMode } = useSecuritySettings()

        enable2FA()
        expect(showPasswordDialog.value).toBe(true)
        expect(passwordDialogMode.value).toBe('enable')
    })

    it('disables 2FA flow', () => {
        const { disable2FA, showPasswordDialog, passwordDialogMode } = useSecuritySettings()

        disable2FA()
        expect(showPasswordDialog.value).toBe(true)
        expect(passwordDialogMode.value).toBe('disable')
    })
})
