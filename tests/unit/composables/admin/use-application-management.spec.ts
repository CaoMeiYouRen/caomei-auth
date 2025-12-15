import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useApplicationManagement } from '@/composables/admin/use-application-management'

// Mock dependencies
const toast = { add: vi.fn() }
const confirm = { require: vi.fn() }

vi.mock('primevue/usetoast', () => ({
    useToast: () => toast,
}))

vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => confirm,
}))

// Mock $fetch
const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

describe('useApplicationManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
        const app = { id: '1', disabled: false }

        fetchMock.mockResolvedValueOnce({ success: true }) // For the PUT request
        fetchMock.mockResolvedValueOnce({ success: true, data: [], total: 0 }) // For the refresh

        await toggleApplicationStatus(app)

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/oauth/applications/1', expect.objectContaining({
            method: 'PUT',
            body: {
                disabled: true,
            },
        }))
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
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
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: '删除成功',
        }))
    })
})
