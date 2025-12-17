import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useOAuthConsent } from '@/composables/use-oauth-consent'

// --- Mocks ---

const {
    mockUseToast,
    mockUseFetch,
    mockUseRoute,
    mockUseRuntimeConfig,
    mockNavigateTo,
    mockAuthClient,
} = vi.hoisted(() => ({
    mockUseToast: {
        add: vi.fn(),
    },
    mockUseFetch: vi.fn(),
    mockUseRoute: vi.fn(),
    mockUseRuntimeConfig: vi.fn(),
    mockNavigateTo: vi.fn(),
    mockAuthClient: {
        oauth2: {
            consent: vi.fn(),
        },
    },
}))

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockUseToast,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: mockAuthClient,
}))

mockNuxtImport('useFetch', () => mockUseFetch)
mockNuxtImport('useRoute', () => mockUseRoute)
mockNuxtImport('useRuntimeConfig', () => mockUseRuntimeConfig)
mockNuxtImport('navigateTo', () => mockNavigateTo)

// Mock window.location
const originalLocation = window.location
delete (window as any).location
window.location = { ...originalLocation, href: '' } as any

describe('useOAuthConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Default route mock
        mockUseRoute.mockReturnValue({
            query: {
                client_id: 'client123',
                redirect_uri: 'https://app.com/cb',
                state: 'state123',
                response_type: 'code',
                scope: 'openid profile',
            },
        })

        // Default useFetch mock
        mockUseFetch.mockResolvedValue({
            data: ref({ success: true, data: { name: 'Test App', clientId: 'client123' } }),
            pending: ref(false),
            error: ref(null),
        })

        // Default runtime config
        mockUseRuntimeConfig.mockReturnValue({})

        // Reset window.location.href
        window.location.href = ''
    })

    describe('Initialization', () => {
        it('should parse query parameters', async () => {
            const { oauthParams, parsedScopes } = await useOAuthConsent()

            expect(oauthParams.value).toEqual({
                clientId: 'client123',
                redirectUri: 'https://app.com/cb',
                state: 'state123',
                responseType: 'code',
                scope: 'openid profile',
            })

            expect(parsedScopes.value).toHaveLength(2)
            expect(parsedScopes.value[0]?.scope).toBe('openid')
            expect(parsedScopes.value[1]?.scope).toBe('profile')
        })

        it('should fetch application info', async () => {
            const { application, applicationName } = await useOAuthConsent()

            expect(mockUseFetch).toHaveBeenCalledWith('/api/oauth/client/client123', expect.objectContaining({
                key: 'oauth-client-client123',
                server: true,
                lazy: false,
            }), expect.anything())
            expect(application.value?.name).toBe('Test App')
            expect(applicationName.value).toBe('Test App')
        })

        it('should handle missing client_id', async () => {
            mockUseRoute.mockReturnValue({ query: {} })

            const { hasError } = await useOAuthConsent()

            // Wait for watch to trigger
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(hasError.value).toBe(true)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: '缺少必需参数：client_id',
            }))
        })

        it('should handle fetch error (404)', async () => {
            const errorRef = ref(null)
            mockUseFetch.mockResolvedValue({
                data: ref(null),
                pending: ref(false),
                error: errorRef,
            })

            const { hasError } = await useOAuthConsent()

            // Simulate error
            errorRef.value = { statusCode: 404 } as any

            // Wait for watch
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(hasError.value).toBe(true)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: '应用不存在，请检查授权链接是否正确',
            }))
        })

        it('should handle fetch error (403)', async () => {
            const errorRef = ref(null)
            mockUseFetch.mockResolvedValue({
                data: ref(null),
                pending: ref(false),
                error: errorRef,
            })

            const { hasError } = await useOAuthConsent()

            // Simulate error
            errorRef.value = { statusCode: 403 } as any

            // Wait for watch
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(hasError.value).toBe(true)
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: '该应用已被禁用，无法进行授权',
            }))
        })
    })

    describe('Consent Actions', () => {
        it('should allow consent successfully', async () => {
            const { allowConsent } = await useOAuthConsent()

            mockAuthClient.oauth2.consent.mockResolvedValue({
                data: { redirectURI: 'https://app.com/cb?code=123' },
                error: null,
            })

            await allowConsent()

            expect(mockAuthClient.oauth2.consent).toHaveBeenCalledWith({ accept: true })
            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'success',
            }))
            expect(window.location.href).toBe('https://app.com/cb?code=123')
        })

        it('should handle allow consent error', async () => {
            const { allowConsent } = await useOAuthConsent()

            mockAuthClient.oauth2.consent.mockResolvedValue({
                data: null,
                error: { message: 'Consent failed' },
            })

            await allowConsent()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Consent failed',
            }))
        })

        it('should deny consent successfully (redirect)', async () => {
            const { denyConsent } = await useOAuthConsent()

            mockAuthClient.oauth2.consent.mockResolvedValue({
                data: { redirectURI: 'https://app.com/cb?error=access_denied' },
                error: null,
            })

            await denyConsent()

            expect(mockAuthClient.oauth2.consent).toHaveBeenCalledWith({ accept: false })
            expect(window.location.href).toBe('https://app.com/cb?error=access_denied')
        })

        it('should deny consent successfully (no redirect)', async () => {
            vi.useFakeTimers()
            const { denyConsent } = await useOAuthConsent()

            mockAuthClient.oauth2.consent.mockResolvedValue({
                data: { redirectURI: null },
                error: null,
            })

            await denyConsent()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'info',
                summary: '已拒绝授权',
            }))

            vi.runAllTimers()
            expect(mockNavigateTo).toHaveBeenCalledWith('/profile')
            vi.useRealTimers()
        })

        it('should handle deny consent error', async () => {
            const { denyConsent } = await useOAuthConsent()

            mockAuthClient.oauth2.consent.mockResolvedValue({
                data: null,
                error: { message: 'Deny failed' },
            })

            await denyConsent()

            expect(mockUseToast.add).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Deny failed',
            }))
        })
    })

    describe('Navigation', () => {
        it('should navigate home', async () => {
            const { handleGoHome } = await useOAuthConsent()

            handleGoHome()

            expect(mockNavigateTo).toHaveBeenCalledWith('/profile')
        })
    })
})
