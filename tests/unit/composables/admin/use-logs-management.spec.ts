import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useLogsManagement } from '@/composables/admin/use-logs-management'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
const toast = { success: vi.fn(), danger: vi.fn(), warning: vi.fn() }

vi.mock('caomei-ui', () => ({
    useToast: () => toast,
}))

// Mock $fetch
const fetchMock = vi.hoisted(() => vi.fn())
vi.mock('#build/fetch.mjs', () => ({
    $fetch: fetchMock,
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        admin: {
            revokeUserSession: vi.fn(),
        },
    },
}))

const emptySessionsResponse = {
    success: true,
    data: {
        sessions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
}

describe('useLogsManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockResolvedValue(emptySessionsResponse)
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

    it('按状态筛选并清空后不再携带 status', async () => {
        const { selectedStatus } = useLogsManagement()

        selectedStatus.value = 'expired'
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/logs/sessions', expect.objectContaining({
            query: expect.objectContaining({ status: 'expired' }),
        }))

        selectedStatus.value = undefined
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 0))

        const query = fetchMock.mock.calls.at(-1)?.[1]?.query ?? {}
        expect(query).not.toHaveProperty('status')
    })

    it('日期区间两端齐全时下发 startDate / endDate，清空后不再携带', async () => {
        const { dateRange } = useLogsManagement()
        const start = new Date('2026-06-01T00:00:00.000Z')
        const end = new Date('2026-06-15T00:00:00.000Z')

        dateRange.value = [start, end]
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/logs/sessions', expect.objectContaining({
            query: expect.objectContaining({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            }),
        }))

        dateRange.value = null
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 0))

        const query = fetchMock.mock.calls.at(-1)?.[1]?.query ?? {}
        expect(query).not.toHaveProperty('startDate')
        expect(query).not.toHaveProperty('endDate')
    })

    it('revokes session', async () => {
        const { revokeSession } = useLogsManagement()
        const session = { sessionToken: 'token123' }

        ;(authClient.admin.revokeUserSession as any).mockResolvedValue({ success: true })
        fetchMock.mockResolvedValue(emptySessionsResponse) // For reload

        await revokeSession(session as any)

        expect(authClient.admin.revokeUserSession).toHaveBeenCalledWith({
            sessionToken: 'token123',
        })
        expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
            title: '撤销成功',
        }))
    })

    it('撤销失败时使用 danger 语气', async () => {
        const { revokeSession, revokingSessionId } = useLogsManagement()

        ;(authClient.admin.revokeUserSession as any).mockRejectedValue(new Error('会话不存在'))

        await revokeSession({ sessionToken: 'token123' } as any)

        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({
            title: '撤销失败',
            description: '会话不存在',
        }))
        expect(revokingSessionId.value).toBe('')
    })
})
