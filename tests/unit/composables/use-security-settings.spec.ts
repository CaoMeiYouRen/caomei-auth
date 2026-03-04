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
            const consoleSpy = vi.spyOn(console, 'error')
            mockAuthClient.revokeSession.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeSession, revokeSingleSession } = useSecuritySettings()
            confirmRevokeSession('token123')

            await revokeSingleSession()

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('should handle revoke other sessions error', async () => {
            const consoleSpy = vi.spyOn(console, 'error')
            mockAuthClient.revokeOtherSessions.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeOtherSessions, revokeOtherSessions } = useSecuritySettings()
            confirmRevokeOtherSessions()

            await revokeOtherSessions()

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('should handle revoke all sessions error', async () => {
            const consoleSpy = vi.spyOn(console, 'error')
            mockAuthClient.revokeSessions.mockRejectedValue(new Error('Revoke failed'))

            const { confirmRevokeAllSessions, revokeAllSessions } = useSecuritySettings()
            confirmRevokeAllSessions()

            await revokeAllSessions()

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })

    describe('Utility Functions', () => {
        it('should clear password on dialog hide', () => {
            const { password, onPasswordDialogHide } = useSecuritySettings()

            password.value = 'test-password'
            onPasswordDialogHide()

            expect(password.value).toBe('')
        })

        it('should clear all state on finish setup', () => {
            const { password, verificationCode, totpUri, qrCodeUrl, backupCodes, showBackupCodes, finishSetup } = useSecuritySettings()

            password.value = 'test-password'
            verificationCode.value = '123456'
            totpUri.value = 'otpauth://totp/test'
            qrCodeUrl.value = 'data:image/png;base64,...'
            backupCodes.value = ['code1', 'code2']
            showBackupCodes.value = true

            finishSetup()

            expect(password.value).toBe('')
            expect(verificationCode.value).toBe('')
            expect(totpUri.value).toBe('')
            expect(qrCodeUrl.value).toBe('')
            expect(backupCodes.value).toEqual([])
            expect(showBackupCodes.value).toBe(false)
        })

        it('should navigate to profile', () => {
            const { goProfile } = useSecuritySettings()

            goProfile()

            expect(mockNavigateTo).toHaveBeenCalledWith('/profile')
        })
    })

    describe('Session List Computed', () => {
        it('should format session list with correct properties', async () => {
            const mockDate = new Date('2024-01-01T12:00:00Z')
            mockAuthClient.listSessions.mockResolvedValue({
                data: [
                    {
                        id: 'session1',
                        token: 'token1',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                        ipAddress: '192.168.1.1',
                        createdAt: mockDate,
                        updatedAt: mockDate,
                        expiresAt: mockDate,
                        userId: 'user1',
                    },
                ],
            })
            mockGetBrowser.mockReturnValue('Chrome')
            mockGetOs.mockReturnValue('Windows')

            const { sessionList } = useSecuritySettings()

            // Wait for the async listSessions to complete
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(sessionList.value).toHaveLength(1)
            expect(sessionList.value[0]!.browser).toBe('Chrome')
            expect(sessionList.value[0]!.os).toBe('Windows')
            expect(sessionList.value[0]!.createdAt).toContain('2024')
        })
    })

    describe('Disable 2FA Error Handling', () => {
        it('should handle disable 2FA error', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showPasswordDialog } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'disable'
            showPasswordDialog.value = true

            mockAuthClient.twoFactor.disable.mockResolvedValue({
                error: { message: 'Invalid password' },
            })

            await onPasswordConfirm()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: expect.stringContaining('Invalid password'),
            }))
        })
    })

    describe('Verify TOTP Error Handling', () => {
        it('should handle verify TOTP error', async () => {
            const { verifyAndEnable2FA, verificationCode, showTotpSetup } = useSecuritySettings()

            verificationCode.value = '123456'
            showTotpSetup.value = true

            mockAuthClient.twoFactor.verifyTotp.mockResolvedValue({
                error: { message: 'Invalid code' },
            })

            await verifyAndEnable2FA()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: expect.stringContaining('Invalid code'),
            }))
            expect(showTotpSetup.value).toBe(true)
        })
    })
})
