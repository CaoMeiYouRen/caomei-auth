import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSsoLoginFlow } from '@/composables/use-sso-login-flow'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            sso: vi.fn(),
        },
    },
}))

const addToastMock = vi.fn()
vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: addToastMock,
    }),
}))

// Mock onMounted to execute immediately
vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>()
    return {
        ...actual,
        onMounted: (fn: () => void) => fn(),
    }
})

// Stub globals
const useRouteMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRoute', () => useRouteMock)

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

describe('useSsoLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRouteMock.mockReturnValue({ query: {} })
        fetchMock.mockResolvedValue({ success: true, data: [] })
    })

    it('should load available providers on mount', async () => {
        const mockProviders = [{ id: 'p1', name: 'Provider 1' }]
        fetchMock.mockResolvedValue({ success: true, data: mockProviders })

        const { availableProviders } = useSsoLoginFlow()

        // Wait for async fetch (triggered by onMounted)
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(fetchMock).toHaveBeenCalledWith('/api/sso/providers/available', { method: 'GET' })
        expect(availableProviders.value).toEqual(mockProviders)
    })

    it('should handle load providers failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue(new Error('Network error'))

        const { availableProviders } = useSsoLoginFlow()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(availableProviders.value).toEqual([])
        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
    })

    it('should show error toast if query param exists', () => {
        useRouteMock.mockReturnValue({ query: { error: 'sso_failed' } })
        useSsoLoginFlow()
        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: 'SSO 登录失败',
        }))
    })

    it('should handle email sign in success', async () => {
        const { signInWithEmail, emailForm } = useSsoLoginFlow()

        emailForm.value.email = 'test@example.com'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        const promise = signInWithEmail()
        expect(emailForm.value.loading).toBe(true)
        await promise
        expect(emailForm.value.loading).toBe(false)

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            email: 'test@example.com',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle email sign in failure', async () => {
        const { signInWithEmail, emailForm } = useSsoLoginFlow()

        emailForm.value.email = 'test@example.com'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({
            data: null,
            error: { message: 'Invalid email' },
        } as any)

        await signInWithEmail()

        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid email',
        }))
        expect(emailForm.value.loading).toBe(false)
    })

    it('should handle domain sign in success', async () => {
        const { signInWithDomain, domainForm } = useSsoLoginFlow()

        domainForm.value.domain = 'example.com'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        await signInWithDomain()

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            domain: 'example.com',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle domain sign in failure', async () => {
        const { signInWithDomain, domainForm } = useSsoLoginFlow()

        domainForm.value.domain = 'example.com'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({
            data: null,
            error: { message: 'Invalid domain' },
        } as any)

        await signInWithDomain()

        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid domain',
        }))
    })

    it('should handle organization sign in success', async () => {
        const { signInWithOrganization, orgForm } = useSsoLoginFlow()

        orgForm.value.organizationSlug = 'my-org'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        await signInWithOrganization()

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            organizationSlug: 'my-org',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle organization sign in failure', async () => {
        const { signInWithOrganization, orgForm } = useSsoLoginFlow()

        orgForm.value.organizationSlug = 'my-org'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({
            data: null,
            error: { message: 'Invalid org' },
        } as any)

        await signInWithOrganization()

        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid org',
        }))
    })

    it('should handle provider ID sign in success', async () => {
        const { signInWithProvider, providerForm } = useSsoLoginFlow()

        providerForm.value.providerId = 'provider-123'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        await signInWithProvider()

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            providerId: 'provider-123',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle provider ID sign in failure', async () => {
        const { signInWithProvider, providerForm } = useSsoLoginFlow()

        providerForm.value.providerId = 'provider-123'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({
            data: null,
            error: { message: 'Invalid provider' },
        } as any)

        await signInWithProvider()

        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Invalid provider',
        }))
    })

    it('should handle specific provider sign in success', async () => {
        const { signInWithSpecificProvider, specificProviderLoading } = useSsoLoginFlow()
        const provider = { providerId: 'p1', name: 'Provider 1' }

        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        const promise = signInWithSpecificProvider(provider)
        expect(specificProviderLoading.value).toBe('p1')
        await promise
        expect(specificProviderLoading.value).toBe('')

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            providerId: 'p1',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle specific provider sign in failure', async () => {
        const { signInWithSpecificProvider } = useSsoLoginFlow()
        const provider = { providerId: 'p1', name: 'Provider 1' }

        vi.mocked(authClient.signIn.sso).mockResolvedValue({
            data: null,
            error: { message: 'Failed' },
        } as any)

        await signInWithSpecificProvider(provider)

        expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Failed',
        }))
    })
})
