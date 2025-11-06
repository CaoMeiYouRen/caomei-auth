import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const fetchMock = vi.fn()

describe('utils/admin-role-client', () => {
    beforeEach(() => {
        vi.resetModules()
        fetchMock.mockReset()
        vi.stubGlobal('$fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('syncAdminRole sends sync action payload', async () => {
        fetchMock.mockResolvedValue({ success: true })
        const module = await import('@/utils/admin-role-client')
        const result = await module.syncAdminRole('user-1')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sync-admin-role', {
            method: 'POST',
            body: {
                userId: 'user-1',
                action: 'sync',
            },
        })
        expect(result).toEqual({ success: true })
    })

    it('addAdminRole requests add action', async () => {
        fetchMock.mockResolvedValue({ success: true })
        const module = await import('@/utils/admin-role-client')
        await module.addAdminRole('user-2')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sync-admin-role', {
            method: 'POST',
            body: {
                userId: 'user-2',
                action: 'add',
            },
        })
    })

    it('removeAdminRole requests remove action', async () => {
        fetchMock.mockResolvedValue({ success: true })
        const module = await import('@/utils/admin-role-client')
        await module.removeAdminRole('user-3')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/sync-admin-role', {
            method: 'POST',
            body: {
                userId: 'user-3',
                action: 'remove',
            },
        })
    })

    it('batchSyncAdminRole aggregates results', async () => {
        fetchMock
            .mockResolvedValueOnce({ success: true, message: 'ok' })
            .mockRejectedValueOnce(new Error('fail'))

        const module = await import('@/utils/admin-role-client')
        const results = await module.batchSyncAdminRole(['a', 'b'])

        expect(results).toEqual([
            { userId: 'a', success: true, message: 'ok' },
            { userId: 'b', success: false, message: 'Error: fail' },
        ])
    })
})
