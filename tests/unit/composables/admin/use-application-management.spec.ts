import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApplicationManagement } from '@/composables/admin/use-application-management'

// Mock dependencies
const toast = { success: vi.fn(), danger: vi.fn(), warning: vi.fn() }
const confirm = { open: vi.fn() }

vi.mock('caomei-ui', () => ({
    useToast: () => toast,
    useConfirm: () => confirm,
}))

// Mock $fetch
const fetchMock = vi.hoisted(() => vi.fn())
vi.mock('#build/fetch.mjs', () => ({
    $fetch: fetchMock,
}))

describe('useApplicationManagement', () => {
    beforeEach(() => {
        /* reset 而非 clear：清空 mockResolvedValueOnce 队列，避免残留值串到下一个用例 */
        vi.resetAllMocks()
        // Default mock for list
        fetchMock.mockResolvedValue({
            success: true,
            data: [],
            total: 0,
        })
    })

    it('initializes and loads data', async () => {
        const { loading, applications, total } = useApplicationManagement()

        // Wait for the promise to resolve
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(loading.value).toBe(false)
        expect(applications.value).toEqual([])
        expect(total.value).toBe(0)
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications', expect.any(Object))
    })

    it('handles search', async () => {
        const { searchQuery, refreshApplications } = useApplicationManagement()

        searchQuery.value = 'test app'
        await refreshApplications()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications', expect.objectContaining({
            query: expect.objectContaining({
                search: 'test app',
            }),
        }))
    })

    it('toggles application status', async () => {
        const { toggleApplicationStatus } = useApplicationManagement()
        const app = { id: '1', clientId: 'client-1', name: '测试应用', createdAt: '2026-01-01T00:00:00.000Z', disabled: false }

        fetchMock.mockResolvedValueOnce({ success: true }) // For the PUT request
        fetchMock.mockResolvedValueOnce({ success: true, data: [], total: 0 }) // For the refresh

        await toggleApplicationStatus(app)

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications/1', expect.objectContaining({
            method: 'PUT',
            body: {
                disabled: true,
            },
        }))
        expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
            title: '成功',
        }))
    })

    it('deletes application', async () => {
        const { deleteApplication } = useApplicationManagement()

        fetchMock.mockResolvedValueOnce({ success: true }) // For DELETE
        fetchMock.mockResolvedValueOnce({ success: true, data: [], total: 0 }) // For refresh

        await deleteApplication('1')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications/1', expect.objectContaining({
            method: 'DELETE',
        }))
        expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({
            title: '删除成功',
        }))
    })

    it('跳过删除且不提示，当用户在确认框取消', async () => {
        const { confirmDelete } = useApplicationManagement()

        confirm.open.mockResolvedValueOnce(false)

        await confirmDelete({ id: '1', clientId: 'client-1', name: '测试应用', createdAt: '2026-01-01T00:00:00.000Z', disabled: false })

        expect(confirm.open).toHaveBeenCalledWith(expect.objectContaining({
            title: '确认删除',
            tone: 'danger',
        }))
        expect(fetchMock).not.toHaveBeenCalledWith('/api/admin/oauth/applications/1', expect.objectContaining({
            method: 'DELETE',
        }))
        expect(toast.success).not.toHaveBeenCalledWith(expect.objectContaining({ title: '删除成功' }))
        expect(toast.danger).not.toHaveBeenCalled()
        /* 只有 composable 初始化时的列表请求，取消后不再发请求 */
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('确认后删除应用并刷新列表', async () => {
        const { confirmDelete } = useApplicationManagement()

        confirm.open.mockResolvedValueOnce(true)
        fetchMock.mockResolvedValueOnce({ success: true }) // DELETE
        fetchMock.mockResolvedValueOnce({ success: true, data: [], total: 0 }) // 刷新

        await confirmDelete({ id: '1', clientId: 'client-1', name: '测试应用', createdAt: '2026-01-01T00:00:00.000Z', disabled: false })

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications/1', expect.objectContaining({
            method: 'DELETE',
        }))
        expect(toast.success).toHaveBeenCalledWith(expect.objectContaining({ title: '删除成功' }))
        /* 初始化列表 + DELETE + 删除后刷新列表 */
        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/admin/oauth/applications')
    })
})
