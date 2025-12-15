import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useOAuthClients } from '@/composables/use-oauth-clients'

vi.mock('primevue/usetoast', () => ({
    useToast: () => ({ add: vi.fn() }),
}))

const useFetchMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useFetch', () => useFetchMock)

describe('useOAuthClients', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch authorized apps', async () => {
        const mockApps = [{ id: '1', clientId: 'c1', application: { name: 'App 1' } }]
        useFetchMock.mockResolvedValue({
            data: ref({ success: true, data: mockApps }),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
        })

        const { authorizedApps } = await useOAuthClients()

        expect(authorizedApps.value).toEqual(mockApps)
    })

    it('should handle empty list', async () => {
        useFetchMock.mockResolvedValue({
            data: ref({ success: false }),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
        })

        const { authorizedApps } = await useOAuthClients()

        expect(authorizedApps.value).toEqual([])
    })

    it('should translate scopes', async () => {
        useFetchMock.mockResolvedValue({
            data: ref({ success: true, data: [] }),
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
        })

        const { getScopeDescription } = await useOAuthClients()
        expect(getScopeDescription('openid')).toBe('基本身份信息')
    })
})
