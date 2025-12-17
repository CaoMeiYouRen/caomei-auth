import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSecuritySettings } from '@/composables/use-security-settings'

// --- Mocks ---

const {
    mockUseToast,
    mockAuthClient,
    mockGenerateQRCode,
    mockGetBrowser,
    mockGetOs,
    mockNavigateTo,
} = vi.hoisted(() => ({
    mockUseToast: {
        add: vi.fn(),
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
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockUseToast,
}))

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

global.URL = {
    createObjectURL: vi.fn(() => 'blob:url'),
    revokeObjectURL: vi.fn(),
} as any

global.Blob = class {} as any

describe('useSecuritySettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()

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

    describe('2FA Flow', () => {
        it('should open password dialog for enabling 2FA', () => {
            const { enable2FA, showPasswordDialog, passwordDialogMode } = useSecuritySettings()

            enable2FA()

            expect(showPasswordDialog.value).toBe(true)
            expect(passwordDialogMode.value).toBe('enable')
        })

        it('should open password dialog for disabling 2FA', () => {
            const { disable2FA, showPasswordDialog, passwordDialogMode } = useSecuritySettings()

            disable2FA()

            expect(showPasswordDialog.value).toBe(true)
            expect(passwordDialogMode.value).toBe('disable')
        })

        it('should warn if password is empty on confirm', async () => {
            const { onPasswordConfirm, password } = useSecuritySettings()

            password.value = ''
            await onPasswordConfirm()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warn',
                summary: '警告',
            }))
            expect(mockAuthClient.twoFactor.enable).not.toHaveBeenCalled()
        })

        it('should enable 2FA successfully', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showTotpSetup, totpUri, qrCodeUrl, backupCodes } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'enable'

            mockAuthClient.twoFactor.enable.mockResolvedValue({
                data: {
                    totpURI: 'otpauth://totp/test',
                    backupCodes: ['code1', 'code2'],
                },
                error: null,
            })

            mockGenerateQRCode.mockResolvedValue('data:image/png;base64,...')

            await onPasswordConfirm()

            expect(mockAuthClient.twoFactor.enable).toHaveBeenCalledWith({ password: 'password123' })
            expect(totpUri.value).toBe('otpauth://totp/test')
            expect(qrCodeUrl.value).toBe('data:image/png;base64,...')
            expect(backupCodes.value).toEqual(['code1', 'code2'])
            expect(showTotpSetup.value).toBe(true)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'info',
            }))
        })

        it('should handle enable 2FA error', async () => {
            const { onPasswordConfirm, password, passwordDialogMode } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'enable'

            mockAuthClient.twoFactor.enable.mockResolvedValue({
                data: null,
                error: { message: 'Invalid password' },
            })

            await onPasswordConfirm()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: expect.stringContaining('Invalid password'),
            }))
        })

        it('should disable 2FA successfully', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showPasswordDialog } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'disable'
            showPasswordDialog.value = true

            mockAuthClient.twoFactor.disable.mockResolvedValue({
                error: null,
            })

            await onPasswordConfirm()

            expect(mockAuthClient.twoFactor.disable).toHaveBeenCalledWith({ password: 'password123' })
            expect(showPasswordDialog.value).toBe(false)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should verify TOTP and show backup codes', async () => {
            const { verifyAndEnable2FA, verificationCode, showTotpSetup, showBackupCodes } = useSecuritySettings()

            verificationCode.value = '123456'
            showTotpSetup.value = true

            mockAuthClient.twoFactor.verifyTotp.mockResolvedValue({
                error: null,
            })

            await verifyAndEnable2FA()

            expect(mockAuthClient.twoFactor.verifyTotp).toHaveBeenCalledWith({ code: '123456' })
            expect(showTotpSetup.value).toBe(false)
            expect(showBackupCodes.value).toBe(true)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should warn if verification code is empty', async () => {
            const { verifyAndEnable2FA, verificationCode } = useSecuritySettings()

            verificationCode.value = ''

            await verifyAndEnable2FA()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'warn',
            }))
            expect(mockAuthClient.twoFactor.verifyTotp).not.toHaveBeenCalled()
        })

        it('should copy backup codes', () => {
            const { copyBackupCodes, backupCodes } = useSecuritySettings()

            backupCodes.value = ['code1', 'code2']

            copyBackupCodes()

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('code1\ncode2')
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
        })

        it('should download backup codes', () => {
            // Mock document methods
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
            }
            const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
            const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any))
            const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any))

            const { downloadBackupCodes, backupCodes } = useSecuritySettings()

            backupCodes.value = ['code1', 'code2']

            downloadBackupCodes()

            expect(global.URL.createObjectURL).toHaveBeenCalled()
            expect(mockLink.download).toContain('2fa-backup-codes.txt')
            expect(mockLink.click).toHaveBeenCalled()
            expect(global.URL.revokeObjectURL).toHaveBeenCalled()

            // Cleanup spies
            createElementSpy.mockRestore()
            appendChildSpy.mockRestore()
            removeChildSpy.mockRestore()
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
    })
})
