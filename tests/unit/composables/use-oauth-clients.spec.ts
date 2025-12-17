import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useOAuthClients } from '@/composables/use-oauth-clients'

// --- Mocks ---

const {
    mockUseToast,
    mockUseFetch,
    mockFetch,
    mockNavigateTo,
} = vi.hoisted(() => ({
    mockUseToast: {
        add: vi.fn(),
    },
    mockUseFetch: vi.fn(),
    mockFetch: vi.fn(),
    mockNavigateTo: vi.fn(),
}))

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockUseToast,
}))

mockNuxtImport('useFetch', () => mockUseFetch)
mockNuxtImport('navigateTo', () => mockNavigateTo)

// Mock global $fetch
global.$fetch = mockFetch as any

// Mock window.open
global.window.open = vi.fn()

describe('useOAuthClients', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Default useFetch mock
        mockUseFetch.mockResolvedValue({
            data: ref({ success: true, data: [] }),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
        })
    })

    describe('Initialization', () => {
        it('should fetch authorized apps on init', async () => {
            const mockApps = [
                { id: '1', clientId: 'client1', application: { name: 'App 1' } },
            ]

            mockUseFetch.mockResolvedValue({
                data: ref({ success: true, data: mockApps }),
                pending: ref(false),
                error: ref(null),
                refresh: vi.fn(),
            })

            const { authorizedApps, loading } = await useOAuthClients()

            expect(mockUseFetch).toHaveBeenCalledWith('/api/oauth/consents', expect.objectContaining({
                server: true,
                lazy: false,
            }), expect.anything())
            expect(authorizedApps.value).toEqual(mockApps)
            expect(loading.value).toBe(false)
        })

        it('should handle empty response', async () => {
            mockUseFetch.mockResolvedValue({
                data: ref({ success: false }),
                pending: ref(false),
                error: ref(null),
                refresh: vi.fn(),
            })

            const { authorizedApps } = await useOAuthClients()

            expect(authorizedApps.value).toEqual([])
        })

        it('should handle fetch error', async () => {
            const errorRef = ref(null)
            mockUseFetch.mockResolvedValue({
                data: ref(null),
                pending: ref(false),
                error: errorRef,
                refresh: vi.fn(),
            })

            await useOAuthClients()

            // Simulate error update
            errorRef.value = { message: 'Network Error' } as any

            // Wait for watch to trigger
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Network Error',
            }))
        })
    })

    describe('Scope Descriptions', () => {
        it('should return correct description for known scopes', async () => {
            const { getScopeDescription } = await useOAuthClients()

            expect(getScopeDescription('openid')).toBe('基本身份信息')
            expect(getScopeDescription('profile')).toBe('个人资料信息')
            expect(getScopeDescription('user:read')).toBe('查看用户信息')
        })

        it('should return scope name for unknown scopes', async () => {
            const { getScopeDescription } = await useOAuthClients()

            expect(getScopeDescription('unknown:scope')).toBe('unknown:scope')
        })
    })

    describe('Revocation', () => {
        it('should open revoke dialog', async () => {
            const { confirmRevokeAuthorization, showRevokeDialog, selectedApp } = await useOAuthClients()
            const app = { id: '1', clientId: 'c1', application: { name: 'App 1' } } as any

            confirmRevokeAuthorization(app)

            expect(selectedApp.value).toEqual(app)
            expect(showRevokeDialog.value).toBe(true)
        })

        it('should revoke authorization successfully', async () => {
            const refreshMock = vi.fn()
            mockUseFetch.mockResolvedValue({
                data: ref({ success: true, data: [] }),
                pending: ref(false),
                error: ref(null),
                refresh: refreshMock,
            })

            const { confirmRevokeAuthorization, revokeAuthorization, showRevokeDialog, revokingApps } = await useOAuthClients()
            const app = { id: '1', clientId: 'c1', application: { name: 'App 1' } } as any

            confirmRevokeAuthorization(app)

            mockFetch.mockResolvedValue({ success: true })

            await revokeAuthorization()

            expect(mockFetch).toHaveBeenCalledWith('/api/oauth/revoke-consent', expect.objectContaining({
                method: 'POST',
                body: { clientId: 'c1' },
            }))

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
                detail: expect.stringContaining('App 1'),
            }))

            expect(refreshMock).toHaveBeenCalled()
            expect(showRevokeDialog.value).toBe(false)
            expect(revokingApps.value.has('c1')).toBe(false)
        })

        it('should handle revocation failure (API error)', async () => {
            const { confirmRevokeAuthorization, revokeAuthorization, showRevokeDialog } = await useOAuthClients()
            const app = { id: '1', clientId: 'c1', application: { name: 'App 1' } } as any

            confirmRevokeAuthorization(app)

            mockFetch.mockResolvedValue({ success: false, message: 'Revoke failed' })

            await revokeAuthorization()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Revoke failed',
            }))

            expect(showRevokeDialog.value).toBe(false)
        })

        it('should handle revocation failure (Exception)', async () => {
            const { confirmRevokeAuthorization, revokeAuthorization } = await useOAuthClients()
            const app = { id: '1', clientId: 'c1', application: { name: 'App 1' } } as any

            confirmRevokeAuthorization(app)

            mockFetch.mockRejectedValue(new Error('Network Error'))

            await revokeAuthorization()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Network Error',
            }))
        })

        it('should do nothing if no app selected', async () => {
            const { revokeAuthorization } = await useOAuthClients()

            await revokeAuthorization()

            expect(mockFetch).not.toHaveBeenCalled()
        })
    })

    describe('Navigation', () => {
        it('should navigate to profile', async () => {
            const { goProfile } = await useOAuthClients()

            goProfile()

            expect(mockNavigateTo).toHaveBeenCalledWith('/profile')
        })

        it('should open docs', async () => {
            const { goDocs } = await useOAuthClients()

            goDocs()

            expect(window.open).toHaveBeenCalledWith(
                'https://auth-docs.cmyr.dev/docs/usage/user-management',
                '_blank',
                'noopener,noreferrer',
            )
        })
    })
})
