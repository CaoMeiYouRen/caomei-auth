import { describe, it, expect, vi, beforeEach } from 'vitest'
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

vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: vi.fn(),
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
const useRouteMock = vi.fn()
const fetchMock = vi.fn()

vi.stubGlobal('useRoute', useRouteMock)
vi.stubGlobal('$fetch', fetchMock)

describe('useSsoLoginFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRouteMock.mockReturnValue({ query: {} })
    })

    it('should load available providers', async () => {
        const mockProviders = [{ id: 'p1', name: 'Provider 1' }]
        fetchMock.mockResolvedValue({ success: true, data: mockProviders })

        const { availableProviders } = useSsoLoginFlow()

        // Wait for async fetch (triggered by onMounted)
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(fetchMock).toHaveBeenCalledWith('/api/sso/providers/available', { method: 'GET' })
        expect(availableProviders.value).toEqual(mockProviders)
    })

    it('should handle email sign in', async () => {
        const { signInWithEmail, emailForm } = useSsoLoginFlow()

        emailForm.value.email = 'test@example.com'
        vi.mocked(authClient.signIn.sso).mockResolvedValue({ data: {}, error: null } as any)

        await signInWithEmail()

        expect(authClient.signIn.sso).toHaveBeenCalledWith({
            email: 'test@example.com',
            callbackURL: '/profile',
            errorCallbackURL: '/sso-login?error=sso_failed',
        })
    })

    it('should handle domain sign in', async () => {
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
})
