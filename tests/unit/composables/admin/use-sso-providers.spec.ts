import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSsoProviders } from '@/composables/admin/use-sso-providers'

// Mock dependencies
const toast = { add: vi.fn() }

vi.mock('primevue/usetoast', () => ({
    useToast: () => toast,
}))

// Mock $fetch
const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

describe('useSsoProviders', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockResolvedValue({
            success: true,
            data: [],
            total: 0,
        })
    })

    it('initializes and loads data', async () => {
        const { loading, providers, total } = useSsoProviders()

        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(loading.value).toBe(false)
        expect(providers.value).toEqual([])
        expect(total.value).toBe(0)
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sso/providers', expect.any(Object))
    })

    it('handles search', async () => {
        const { searchQuery, refreshProviders } = useSsoProviders()

        searchQuery.value = 'github'
        await refreshProviders()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sso/providers', expect.objectContaining({
            query: expect.objectContaining({
                search: 'github',
            }),
        }))
    })

    it('toggles provider status', async () => {
        const { toggleProviderStatus } = useSsoProviders()
        const provider = { id: '1', enabled: true }

        fetchMock.mockResolvedValueOnce({ success: true }) // PUT
        fetchMock.mockResolvedValueOnce({ success: true, data: [], total: 0 }) // Refresh

        await toggleProviderStatus(provider)

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sso/providers/1', expect.objectContaining({
            method: 'PUT',
            body: { enabled: false },
        }))
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
        }))
    })

    it('refreshes providers', async () => {
        const { handleRefreshProviders } = useSsoProviders()

        await handleRefreshProviders()

        expect(fetchMock).toHaveBeenCalled()
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            summary: '刷新成功',
        }))
    })
})
