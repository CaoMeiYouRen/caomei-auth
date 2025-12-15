import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLogsManagement } from '@/composables/admin/use-logs-management'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
const toast = { add: vi.fn() }

vi.mock('primevue/usetoast', () => ({
    useToast: () => toast,
}))

// Mock $fetch
const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        admin: {
            revokeUserSession: vi.fn(),
        },
    },
}))

describe('useLogsManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockResolvedValue({
            data: {
                sessions: [],
                pagination: { total: 0 },
            },
        })
    })

    it('initializes and loads data', async () => {
        const { loading, sessions, total } = useLogsManagement()

        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(loading.value).toBe(false)
        expect(sessions.value).toEqual([])
        expect(total.value).toBe(0)
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/logs/sessions', expect.any(Object))
    })

    it('handles search', async () => {
        const { searchQuery, refreshSessions } = useLogsManagement()

        searchQuery.value = 'test log'
        await refreshSessions()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/logs/sessions', expect.objectContaining({
            query: expect.objectContaining({
                search: 'test log',
            }),
        }))
    })

    it('revokes session', async () => {
        const { revokeSession } = useLogsManagement()
        const session = { sessionToken: 'token123' }

        ;(authClient.admin.revokeUserSession as any).mockResolvedValue({ success: true })
        fetchMock.mockResolvedValue({ // For reload
            data: {
                sessions: [],
                pagination: { total: 0 },
            },
        })

        await revokeSession(session)

        expect(authClient.admin.revokeUserSession).toHaveBeenCalledWith({
            sessionToken: 'token123',
        })
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
        }))
    })
})
