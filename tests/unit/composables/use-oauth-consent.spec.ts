import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useOAuthConsent } from '@/composables/use-oauth-consent'

vi.mock('@/lib/auth-client', () => ({ authClient: {} }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }))

const useFetchMock = vi.hoisted(() => vi.fn())
const useRouteMock = vi.hoisted(() => vi.fn())
const useRuntimeConfigMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRoute', () => useRouteMock)
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

describe('useOAuthConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useRouteMock.mockReturnValue({
            query: {
                client_id: 'client-123',
                scope: 'openid profile',
                redirect_uri: 'http://localhost/cb',
                state: 'xyz',
                response_type: 'code',
            },
        })
        useRuntimeConfigMock.mockReturnValue({})
    })

    it('should parse query parameters', async () => {
        useFetchMock.mockResolvedValue({
            data: ref({ success: true, data: { name: 'Test App' } }),
            pending: ref(false),
            error: ref(null),
        })

        const { oauthParams, parsedScopes } = await useOAuthConsent()

        expect(oauthParams.value.clientId).toBe('client-123')
        expect(parsedScopes.value.map((s) => s.scope)).toEqual(['openid', 'profile'])
    })

    it('should fetch application info', async () => {
        const mockApp = { name: 'My App', clientId: 'client-123' }
        useFetchMock.mockResolvedValue({
            data: ref({ success: true, data: mockApp }),
            pending: ref(false),
            error: ref(null),
        })

        const { application } = await useOAuthConsent()

        expect(application.value.name).toBe('My App')
    })

    it('should provide fallback application info on error', async () => {
        useFetchMock.mockResolvedValue({
            data: ref(null),
            pending: ref(false),
            error: ref(new Error('Failed')),
        })

        const { application } = await useOAuthConsent()

        expect(application.value.name).toBe('第三方应用')
    })
})
