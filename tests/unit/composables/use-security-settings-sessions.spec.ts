import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#app'
import { useSecuritySettings } from '@/composables/use-security-settings'

// --- Mocks ---

const {
    mockUseToast,
    mockAuthClient,
    mockGenerateQRCode,
    mockGetBrowser,
    mockGetOs,
    mockNavigateTo,
    mockFetch,
} = vi.hoisted(() => ({
    mockUseToast: {
        show: vi.fn(),
        success: vi.fn(),
        danger: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
    mockAuthClient: {
        useSession: vi.fn(),
        twoFactor: {
            enable: vi.fn(),
            disable: vi.fn(),
            verifyTotp: vi.fn(),
        },
        listSessions: vi.fn(),
        revokeSession: vi.fn(),
        revokeOtherSessions: vi.fn(),
        revokeSessions: vi.fn(),
    },
    mockGenerateQRCode: vi.fn(),
    mockGetBrowser: vi.fn(),
    mockGetOs: vi.fn(),
    mockNavigateTo: vi.fn(),
    mockFetch: vi.fn(),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

vi.mock('caomei-ui', () => ({
    useToast: () => mockUseToast,
}))

vi.mock('@/composables/utils/use-i18n-text', () => import('@/tests/mocks/i18n-text'))

vi.mock('@/lib/auth-client', () => ({
    authClient: mockAuthClient,
}))

vi.mock('@/utils/shared/qrcode', () => ({
    generateQRCode: mockGenerateQRCode,
}))

vi.mock('@/utils/shared/useragent', () => ({
    getBrowser: mockGetBrowser,
    getOs: mockGetOs,
}))

// Mock Vue onMounted to execute immediately
vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual as any,
        onMounted: (fn: () => void) => fn(),
    }
})

// Mock global objects
global.navigator = {
    clipboard: {
        writeText: vi.fn(),
    },
} as any

global.Blob = class {} as any

describe('useSecuritySettings 会话管理', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Patch URL methods after Nuxt setup (keep the URL constructor intact).
        // Vitest 默认 per-file 隔离，无需 afterEach 还原。
        ;(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:url')
        ;(globalThis as any).URL.revokeObjectURL = vi.fn()

        // Default session mock
        mockAuthClient.useSession.mockReturnValue({
            value: {
                data: { user: { id: 'user1' } },
            },
        })

        // Default listSessions mock
        mockAuthClient.listSessions.mockResolvedValue({
            data: [],
        })
    })
    describe('Session Management', () => {
        it('should list sessions on mount', () => {
            const consoleSpy = vi.spyOn(console, 'error')
            mockAuthClient.listSessions.mockResolvedValue({
                data: [
                    {
                        id: 'session1',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        expiresAt: new Date(),
                    },
                ],
            })
            mockGetBrowser.mockReturnValue('Chrome')
            mockGetOs.mockReturnValue('Windows')
            useSecuritySettings()

            // Since onMounted is mocked to run immediately, listSessions should have been called
            expect(mockAuthClient.listSessions).toHaveBeenCalled()
            expect(consoleSpy).not.toHaveBeenCalled()

            // Wait for promise resolution (microtask)
            // In a real component test we might need flushPromises, but here we can just check if the computed updates eventually
            // However, since listSessions is async, we might need to wait.
            // But useSecuritySettings calls listSessions without await in onMounted.
        })

        it('should revoke single session', async () => {
            const { confirmRevokeSession, revokeSingleSession, showRevokeSessionConfirm } = useSecuritySettings()

            confirmRevokeSession('token123')
            expect(showRevokeSessionConfirm.value).toBe(true)

            await revokeSingleSession()

            expect(mockAuthClient.revokeSession).toHaveBeenCalledWith({ token: 'token123' })
            expect(mockAuthClient.listSessions).toHaveBeenCalledTimes(2) // Once on mount, once after revoke
            expect(showRevokeSessionConfirm.value).toBe(false)
        })

        it('should revoke other sessions', async () => {
            const { confirmRevokeOtherSessions, revokeOtherSessions, showRevokeOtherSessionsConfirm } = useSecuritySettings()

            confirmRevokeOtherSessions()
            expect(showRevokeOtherSessionsConfirm.value).toBe(true)

            await revokeOtherSessions()

            expect(mockAuthClient.revokeOtherSessions).toHaveBeenCalled()
            expect(mockAuthClient.listSessions).toHaveBeenCalledTimes(2)
            expect(showRevokeOtherSessionsConfirm.value).toBe(false)
        })

        it('should revoke all sessions and redirect', async () => {
            const { confirmRevokeAllSessions, revokeAllSessions, showRevokeAllSessionsConfirm } = useSecuritySettings()

            confirmRevokeAllSessions()
            expect(showRevokeAllSessionsConfirm.value).toBe(true)

            await revokeAllSessions()

            expect(mockAuthClient.revokeSessions).toHaveBeenCalled()
            expect(mockAuthClient.listSessions).toHaveBeenCalledTimes(2)
            expect(showRevokeAllSessionsConfirm.value).toBe(false)
            expect(mockNavigateTo).toHaveBeenCalledWith('/login')
        })

        it('should handle list sessions error', async () => {
            const consoleSpy = vi.spyOn(console, 'error')
            mockAuthClient.listSessions.mockRejectedValue(new Error('Network error'))

            useSecuritySettings()

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('should handle revoke session error', async () => {
            mockAuthClient.revokeSession.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeSession, revokeSingleSession } = useSecuritySettings()
            confirmRevokeSession('token123')

            await revokeSingleSession()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('Revoke failed'),
            }))
        })

        it('should handle revoke other sessions error', async () => {
            mockAuthClient.revokeOtherSessions.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeOtherSessions, revokeOtherSessions } = useSecuritySettings()
            confirmRevokeOtherSessions()

            await revokeOtherSessions()

            expect(mockUseToast.danger).toHaveBeenCalled()
        })

        it('should handle revoke all sessions error', async () => {
            mockAuthClient.revokeSessions.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeAllSessions, revokeAllSessions } = useSecuritySettings()
            confirmRevokeAllSessions()

            await revokeAllSessions()

            expect(mockUseToast.danger).toHaveBeenCalled()
        })
        it('should not report success when revokeSession returns { error }', async () => {
            mockAuthClient.revokeSession.mockResolvedValue({ error: { message: '会话已失效' } })

            const { confirmRevokeSession, revokeSingleSession } = useSecuritySettings()
            confirmRevokeSession('token123')

            await revokeSingleSession()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('会话已失效'),
            }))
            expect(mockUseToast.success).not.toHaveBeenCalled()
        })

        it('should not report success when revokeOtherSessions returns { error }', async () => {
            mockAuthClient.revokeOtherSessions.mockResolvedValue({ error: { message: '撤销失败' } })

            const { confirmRevokeOtherSessions, revokeOtherSessions } = useSecuritySettings()
            confirmRevokeOtherSessions()

            await revokeOtherSessions()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('撤销失败'),
            }))
            expect(mockUseToast.success).not.toHaveBeenCalled()
        })

        it('should not redirect when revokeSessions returns { error }', async () => {
            mockAuthClient.revokeSessions.mockResolvedValue({ error: { message: '撤销全部失败' } })

            const { confirmRevokeAllSessions, revokeAllSessions, showRevokeAllSessionsConfirm } = useSecuritySettings()
            confirmRevokeAllSessions()

            await revokeAllSessions()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('撤销全部失败'),
            }))
            expect(mockUseToast.success).not.toHaveBeenCalled()
            expect(showRevokeAllSessionsConfirm.value).toBe(true)
            expect(mockNavigateTo).not.toHaveBeenCalledWith('/login')
        })
    })

    describe('Session revocation error handling', () => {
        it('keeps the dialog open and shows a localized error when revocation fails', async () => {
            mockAuthClient.revokeSession.mockResolvedValue({ error: { message: 'network down' } })
            const { confirmRevokeSession, revokeSingleSession, showRevokeSessionConfirm } = useSecuritySettings()
            confirmRevokeSession('token123')

            await revokeSingleSession()

            expect(showRevokeSessionConfirm.value).toBe(true)
            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                title: '撤销会话失败',
                description: expect.stringContaining('network down'),
            }))
        })

        it('reports other-session revocation failures', async () => {
            mockAuthClient.revokeOtherSessions.mockResolvedValue({ error: { message: 'denied' } })
            const { confirmRevokeOtherSessions, revokeOtherSessions } = useSecuritySettings()
            confirmRevokeOtherSessions()

            await revokeOtherSessions()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                title: '撤销会话失败',
            }))
        })
    })

})
