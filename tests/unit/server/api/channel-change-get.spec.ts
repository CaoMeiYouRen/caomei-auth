import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    validateParamsSafe: vi.fn(),
    repository: { findOne: vi.fn(), save: vi.fn(async (item) => item) },
}))

vi.mock('@/server/utils/validation', () => ({ validateParamsSafe: state.validateParamsSafe }))
vi.mock('@/server/database', () => ({
    dataSource: { getRepository: () => state.repository },
}))

const handler = (await import('@/server/api/channel-change/[id].get')).default

describe('channel change read-only API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.validateParamsSafe.mockResolvedValue({ success: true, data: { id: 'req-1' } })
    })

    it('returns masked pending request info without consuming the code', async () => {
        state.repository.findOne.mockResolvedValue({
            id: 'req-1',
            channel: 'email',
            newValue: 'new@example.com',
            status: 'pending',
            expiresAt: new Date(Date.now() + 60000),
        })
        const result = await handler({ path: '/api/channel-change/req-1', context: {} } as never)

        expect(result.data).toMatchObject({
            id: 'req-1',
            channel: 'email',
            maskedTarget: 'n***@example.com',
            status: 'pending',
        })
        expect(state.repository.save).not.toHaveBeenCalled()
    })

    it('marks an expired pending request as expired', async () => {
        const request = {
            id: 'req-1',
            channel: 'phone',
            newValue: '+8613800138000',
            status: 'pending',
            expiresAt: new Date(Date.now() - 1),
        }
        state.repository.findOne.mockResolvedValue(request)
        const result = await handler({ path: '/api/channel-change/req-1', context: {} } as never)

        expect(state.repository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'expired' }))
        expect(result.data.status).toBe('expired')
    })

    it('returns 404 for a missing request', async () => {
        state.repository.findOne.mockResolvedValue(null)
        await expect(handler({ path: '/api/channel-change/missing', context: {} } as never)).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it('refuses to render self-service requests (source gate)', async () => {
        state.repository.findOne.mockResolvedValue({
            id: 'req-1',
            channel: 'email',
            newValue: 'new@example.com',
            status: 'pending',
            source: 'user',
            expiresAt: new Date(Date.now() + 60000),
        })
        await expect(handler({ path: '/api/channel-change/req-1', context: {} } as never)).rejects.toMatchObject({
            statusCode: 403,
        })
    })
})
