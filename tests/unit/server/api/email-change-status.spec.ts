import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    getUserSession: vi.fn(),
    repository: { find: vi.fn(), save: vi.fn(async (item) => item) },
    userRepository: { findOne: vi.fn() },
    applyDue: vi.fn(),
    notify: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
vi.mock('@/server/utils/i18n', () => ({
    createLocalizedError: async (_event: unknown, options: { statusCode: number, key: string, data?: unknown }) => {
        const error = new Error(options.key) as Error & { statusCode: number, data?: unknown }
        error.statusCode = options.statusCode
        error.data = options.data
        return error
    },
}))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/server/utils/channel-change-apply', () => ({ applyDueChannelChanges: state.applyDue }))
vi.mock('@/server/utils/channel-change-notify', () => ({ notifyChannelChangeLifecycle: state.notify }))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: (entity: any) => (entity?.name === 'User' ? state.userRepository : state.repository),
    },
}))

const getHandler = (await import('@/server/api/security/email/change-with-proof/index.get')).default
const cancelHandler = (await import('@/server/api/security/email/change-with-proof/cancel.post')).default

const NOW = Date.now()

describe('self-service email change status API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { id: 'u1' }, session: { session: { createdAt: new Date() } } })
        state.applyDue.mockResolvedValue({ applied: false, reason: 'NOT_DUE' })
        state.repository.find.mockResolvedValue([])
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', email: 'old@example.com' })
        state.notify.mockResolvedValue(true)
    })

    it('reports none when no self-service request exists', async () => {
        const response = await getHandler({ headers: new Headers() } as any)
        expect(response).toEqual({ status: true, data: { state: 'none' } })
        expect(state.applyDue).toHaveBeenCalledWith('u1')
    })

    it('returns pending state with remaining cooling-off time', async () => {
        state.repository.find.mockResolvedValue([{
            id: 'req-1',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: new Date(NOW + 2 * 60 * 60 * 1000),
            createdAt: new Date(NOW - 60_000),
            cancelledAt: null,
            proofFactor: 'recovery-code',
        }])
        const response = await getHandler({ headers: new Headers() } as any)
        expect(response.data).toMatchObject({
            state: 'pending',
            requestId: 'req-1',
            maskedTarget: 'n***@example.com',
            proofFactor: 'recovery-code',
        })
        expect(response.data.remainingMs).toBeGreaterThan(60 * 60 * 1000)
    })

    it('reports confirmed and expired states from the shared resolver', async () => {
        state.repository.find.mockResolvedValue([{
            id: 'req-1',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: new Date(NOW - 1000),
            createdAt: new Date(NOW - 86_400_000),
            cancelledAt: null,
        }])
        expect((await getHandler({ headers: new Headers() } as any)).data.state).toBe('confirmed')

        state.repository.find.mockResolvedValue([{
            id: 'req-2',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: null,
            createdAt: new Date(NOW - 11 * 60 * 1000),
            cancelledAt: null,
        }])
        expect((await getHandler({ headers: new Headers() } as any)).data.state).toBe('expired')
    })

    it('cancels a pending cooling-off request and notifies both channels', async () => {
        const request = {
            id: 'req-1',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: new Date(NOW + 60_000),
            createdAt: new Date(NOW - 60_000),
            cancelledAt: null,
        }
        state.repository.find.mockResolvedValue([request])
        const response = await cancelHandler({ headers: new Headers() } as any)
        expect(response.data.state).toBe('cancelled')
        expect(state.repository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'email.change.cancel' }))
        expect(state.notify).toHaveBeenCalledWith(expect.objectContaining({ event: 'cancel', oldEmail: 'old@example.com' }))
    })

    it('refuses cancellation for missing, expired or already effective requests', async () => {
        await expect(cancelHandler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 404,
            data: { code: 'NO_PENDING_REQUEST' },
        })

        state.repository.find.mockResolvedValue([{
            id: 'req-1',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: new Date(NOW - 1000),
            createdAt: new Date(NOW - 86_400_000),
            cancelledAt: null,
        }])
        await expect(cancelHandler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 409,
            data: { code: 'ALREADY_EFFECTIVE' },
        })

        state.repository.find.mockResolvedValue([{
            id: 'req-2',
            userId: 'u1',
            channel: 'email',
            source: 'user',
            status: 'pending',
            newValue: 'new@example.com',
            scheduledAt: null,
            createdAt: new Date(NOW - 11 * 60 * 1000),
            cancelledAt: null,
        }])
        await expect(cancelHandler({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode: 409 })
        expect(state.repository.save).not.toHaveBeenCalled()
    })
})
