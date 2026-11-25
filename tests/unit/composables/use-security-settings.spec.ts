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

describe('useSecuritySettings', () => {
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

            expect(mockUseToast.warning).toHaveBeenCalledWith(expect.objectContaining({
                title: '警告',
            }))
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should enable 2FA successfully', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showTotpSetup, totpUri, qrCodeUrl, backupCodes } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'enable'

            mockFetch.mockResolvedValue({
                method: 'totp',
                totpURI: 'otpauth://totp/test',
                backupCodes: ['code1', 'code2'],
            })

            mockGenerateQRCode.mockResolvedValue('data:image/png;base64,...')

            await onPasswordConfirm()

            expect(mockFetch).toHaveBeenCalledWith('/api/security/two-factor/enable', {
                method: 'POST',
                body: { password: 'password123', method: 'totp' },
            })
            expect(totpUri.value).toBe('otpauth://totp/test')
            expect(qrCodeUrl.value).toBe('data:image/png;base64,...')
            expect(backupCodes.value).toEqual(['code1', 'code2'])
            expect(showTotpSetup.value).toBe(true)
            expect(mockUseToast.info).toHaveBeenCalled()
        })

        it('should handle enable 2FA error', async () => {
            const { onPasswordConfirm, password, passwordDialogMode } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'enable'

            mockFetch.mockRejectedValue(Object.assign(new Error('bad'), { data: { message: 'Invalid password' } }))

            await onPasswordConfirm()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('Invalid password'),
            }))
        })

        it('should disable 2FA successfully', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showPasswordDialog } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'disable'
            showPasswordDialog.value = true

            mockFetch.mockResolvedValue({ status: true })

            await onPasswordConfirm()

            expect(mockFetch).toHaveBeenCalledWith('/api/security/two-factor/disable', {
                method: 'POST',
                body: { password: 'password123' },
            })
            expect(showPasswordDialog.value).toBe(false)
            expect(mockUseToast.success).toHaveBeenCalled()
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
            expect(mockUseToast.success).toHaveBeenCalled()
        })

        it('should warn if verification code is empty', async () => {
            const { verifyAndEnable2FA, verificationCode } = useSecuritySettings()

            verificationCode.value = ''

            await verifyAndEnable2FA()

            expect(mockUseToast.warning).toHaveBeenCalled()
            expect(mockAuthClient.twoFactor.verifyTotp).not.toHaveBeenCalled()
        })

        it('should copy backup codes', () => {
            const { copyBackupCodes, backupCodes } = useSecuritySettings()

            backupCodes.value = ['code1', 'code2']

            copyBackupCodes()

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('code1\ncode2')
            expect(mockUseToast.success).toHaveBeenCalled()
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

        it('should navigate to authorized apps', () => {
            const { goOAuthClients } = useSecuritySettings()

            goOAuthClients()

            expect(mockNavigateTo).toHaveBeenCalledWith('/oauth/clients')
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
            // 日期按 locale 格式化，不再是固定 `YYYY-MM-DD HH:mm:ss`
            expect(sessionList.value[0]!.createdAt).not.toMatch(/^\d{4}-\d{2}-\d{2} /)
        })
    })

    describe('Locale Formatting', () => {
        it('reformats session dates when the locale changes', async () => {
            mockAuthClient.listSessions.mockResolvedValue({
                data: [
                    {
                        id: 'session1',
                        token: 'token1',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        ipAddress: '127.0.0.1',
                        createdAt: new Date('2024-01-01T12:00:00Z'),
                        updatedAt: new Date('2024-01-01T12:00:00Z'),
                        expiresAt: new Date('2024-01-01T12:00:00Z'),
                        userId: 'user1',
                    },
                ],
            })
            mockGetBrowser.mockReturnValue('Chrome')
            mockGetOs.mockReturnValue('Windows')

            const { $i18n } = useNuxtApp()
            $i18n.locale.value = 'zh-CN'
            const { sessionList } = useSecuritySettings()
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(sessionList.value[0]!.createdAt).toMatch(/^\d{4}\//u)

            $i18n.locale.value = 'en-US'
            await nextTick()

            expect(sessionList.value[0]!.createdAt).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}/u)
            expect(sessionList.value[0]!.createdAt).toMatch(/(AM|PM)/u)
        })
    })

    describe('Disable 2FA Error Handling', () => {
        it('should handle disable 2FA error', async () => {
            const { onPasswordConfirm, password, passwordDialogMode, showPasswordDialog } = useSecuritySettings()

            password.value = 'password123'
            passwordDialogMode.value = 'disable'
            showPasswordDialog.value = true

            mockFetch.mockRejectedValue(Object.assign(new Error('bad'), { data: { message: 'Invalid password' } }))

            await onPasswordConfirm()

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('Invalid password'),
            }))
        })
    })

    describe('Backup code regeneration', () => {
        it('regenerates backup codes after password confirmation and shows them once', async () => {
            mockFetch.mockResolvedValue({ status: true, backupCodes: ['NEWCODE1', 'NEWCODE2'] })
            const { openBackupRegenerateDialog, confirmRegenerateBackupCodes, password, backupCodes, showBackupCodes, showBackupRegenerateDialog } = useSecuritySettings()

            openBackupRegenerateDialog()
            expect(showBackupRegenerateDialog.value).toBe(true)
            password.value = 'password123'

            await confirmRegenerateBackupCodes()

            expect(mockFetch).toHaveBeenCalledWith('/api/security/backup-codes/regenerate', {
                method: 'POST',
                body: { password: 'password123' },
            })
            expect(backupCodes.value).toEqual(['NEWCODE1', 'NEWCODE2'])
            expect(showBackupCodes.value).toBe(true)
            expect(showBackupRegenerateDialog.value).toBe(false)
            expect(mockUseToast.success).toHaveBeenCalled()
        })

        it('reports regeneration failures without exposing codes', async () => {
            mockFetch.mockRejectedValue(Object.assign(new Error('bad'), { data: { message: '密码错误' } }))
            const { openBackupRegenerateDialog, confirmRegenerateBackupCodes, password, backupCodes } = useSecuritySettings()

            openBackupRegenerateDialog()
            password.value = 'wrong'
            await confirmRegenerateBackupCodes()

            expect(backupCodes.value).toEqual([])
            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('密码错误'),
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

            expect(mockUseToast.danger).toHaveBeenCalledWith(expect.objectContaining({
                description: expect.stringContaining('Invalid code'),
            }))
            expect(showTotpSetup.value).toBe(true)
        })
    })
})
