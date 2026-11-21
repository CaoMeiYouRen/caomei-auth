import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    request: null as any,
    user: null as any,
    sessions: [] as any[],
    update: vi.fn(),
    saveRequest: vi.fn(async (item: any) => item),
    saveUser: vi.fn(async (item: any) => item),
    deleteSessions: vi.fn(),
    findSessions: vi.fn(),
    evaluateRegistration: vi.fn(),
    notify: vi.fn(),
    audit: vi.fn(),
    cacheDelete: vi.fn(),
    transaction: vi.fn(),
    dueRequests: [] as any[],
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        transaction: state.transaction,
        getRepository: () => ({ find: vi.fn(async () => state.dueRequests) }),
    },
}))
vi.mock('@/server/utils/registration-policy', () => ({ evaluateRegistration: state.evaluateRegistration }))
vi.mock('@/server/utils/email/service', () => ({
    emailService: { sendChannelChangeNotification: state.notify },
}))
vi.mock('@/server/utils/audit-log', () => ({ writeAuditEvent: state.audit }))
vi.mock('@/lib/auth', () => ({
    auth: { $context: Promise.resolve({ secondaryStorage: { delete: state.cacheDelete } }) },
}))

const {
    applyChannelChangeBeforeSession,
    applyDueChannelChanges,
    applyScheduledChannelChange,
} = await import('@/server/utils/channel-change-apply')

const NOW = new Date('2026-11-21T12:00:00Z').getTime()

function createManager() {
    const requestRepository = {
        findOne: vi.fn(async () => state.request),
        update: state.update,
        save: state.saveRequest,
    }
    const userRepository = {
        findOne: vi.fn(async ({ where }: any) => {
            if (state.request && where.id === state.request.userId) {
                return state.user
            }
            return null
        }),
        save: state.saveUser,
    }
    return {
        getRepository: (entity: any) => (entity?.name === 'User' ? userRepository : requestRepository),
        find: state.findSessions,
        delete: state.deleteSessions,
    }
}

describe('server/utils/channel-change-apply', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.request = {
            id: 'req-1',
            userId: 'u1',
            channel: 'email',
            newValue: 'new@example.com',
            status: 'pending',
            source: 'user',
            scheduledAt: new Date(NOW - 1000),
            confirmedAt: null,
            cancelledAt: null,
        }
        state.user = { id: 'u1', email: 'old@example.com', emailVerified: false }
        state.sessions = [{ id: 's1', token: 'token-1' }, { id: 's2', token: 'token-2' }]
        state.update.mockResolvedValue({ affected: 1 })
        state.findSessions.mockImplementation(async () => state.sessions)
        state.evaluateRegistration.mockResolvedValue({ allowed: true })
        state.notify.mockResolvedValue(undefined)
        state.transaction.mockImplementation(async (callback: any) => callback(createManager()))
        state.dueRequests = []
    })

    it('applies the change atomically and revokes sessions plus cached tokens', async () => {
        const result = await applyScheduledChannelChange('req-1', { now: NOW })
        expect(result).toMatchObject({
            applied: true,
            requestId: 'req-1',
            userId: 'u1',
            oldEmail: 'old@example.com',
            newEmail: 'new@example.com',
        })
        expect(state.update).toHaveBeenCalledWith(
            { id: 'req-1', status: 'pending' },
            expect.objectContaining({ status: 'confirmed' }),
        )
        expect(state.user).toMatchObject({ email: 'new@example.com', emailVerified: true })
        expect(state.saveUser).toHaveBeenCalledWith(state.user)
        expect(state.deleteSessions).toHaveBeenCalledWith(expect.anything(), { userId: 'u1' })
        expect(state.cacheDelete).toHaveBeenCalledWith('active-sessions-u1')
        expect(state.cacheDelete).toHaveBeenCalledWith('token-1')
        expect(state.cacheDelete).toHaveBeenCalledWith('token-2')
        expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'email.change.apply', targetUserId: 'u1' }))
        expect(state.notify).toHaveBeenCalledTimes(1)
        expect(state.notify).toHaveBeenCalledWith('old@example.com', expect.stringContaining('n***@example.com'))
    })

    it('does nothing before the scheduled time', async () => {
        state.request.scheduledAt = new Date(NOW + 1000)
        const result = await applyScheduledChannelChange('req-1', { now: NOW })
        expect(result).toEqual({ applied: false, reason: 'NOT_DUE', requestId: 'req-1' })
        expect(state.update).not.toHaveBeenCalled()
        expect(state.deleteSessions).not.toHaveBeenCalled()
    })

    it('ignores requests without scheduledAt or already handled', async () => {
        state.request.scheduledAt = null
        expect(await applyScheduledChannelChange('req-1', { now: NOW }))
            .toMatchObject({ applied: false, reason: 'ALREADY_HANDLED' })

        state.request.scheduledAt = new Date(NOW - 1000)
        state.request.status = 'cancelled'
        expect(await applyScheduledChannelChange('req-1', { now: NOW }))
            .toMatchObject({ applied: false, reason: 'ALREADY_HANDLED' })

        /* 状态仍为 pending 但已写 cancelledAt：按已撤销处理，不得生效 */
        state.request.status = 'pending'
        state.request.cancelledAt = new Date(NOW - 500)
        expect(await applyScheduledChannelChange('req-1', { now: NOW }))
            .toMatchObject({ applied: false, reason: 'ALREADY_HANDLED' })
        expect(state.update).not.toHaveBeenCalled()
    })

    it('loses the race without touching user fields', async () => {
        state.update.mockResolvedValue({ affected: 0 })
        const result = await applyScheduledChannelChange('req-1', { now: NOW })
        expect(result).toMatchObject({ applied: false, reason: 'RACE_LOST' })
        expect(state.saveUser).not.toHaveBeenCalled()
        expect(state.deleteSessions).not.toHaveBeenCalled()
    })

    it('cancels when the target became unavailable or the policy changed', async () => {
        const userRepositoryFindOne = [] as any[]
        state.dueRequests = []
        /* 目标被其他用户占用 */
        const manager = createManager()
        manager.getRepository = (entity: any) => {
            if (entity?.name === 'User') {
                return {
                    findOne: vi.fn(async ({ where }: any) => (
                        where.email ? { id: 'u2', email: 'new@example.com' } : state.user
                    )),
                    save: state.saveUser,
                }
            }
            return {
                findOne: vi.fn(async () => state.request),
                update: state.update,
                save: state.saveRequest,
            }
        }
        state.transaction.mockImplementation(async (callback: any) => callback(manager))

        expect(await applyScheduledChannelChange('req-1', { now: NOW }))
            .toMatchObject({ applied: false, reason: 'TARGET_TAKEN' })
        expect(state.saveRequest).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
        expect(state.update).not.toHaveBeenCalled()
        expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ result: 'failure', reason: 'target-taken' }))
        expect(userRepositoryFindOne).toHaveLength(0)
    })

    it('falls back to the new email when notifying the old one fails', async () => {
        state.notify.mockRejectedValueOnce(new Error('old mailbox gone')).mockResolvedValueOnce(undefined)
        const result = await applyScheduledChannelChange('req-1', { now: NOW })
        expect(result.applied).toBe(true)
        expect(state.notify).toHaveBeenCalledTimes(2)
        expect(state.notify).toHaveBeenLastCalledWith('new@example.com', expect.any(String))
        expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'channel.change.notify',
            result: 'failure',
            reason: expect.stringContaining('old-email'),
        }))
    })

    it('does not write audit or notify when the transaction throws', async () => {
        state.saveUser.mockRejectedValueOnce(new Error('db down'))
        await expect(applyScheduledChannelChange('req-1', { now: NOW })).rejects.toThrow('db down')
        expect(state.audit).not.toHaveBeenCalled()
        expect(state.notify).not.toHaveBeenCalled()
        expect(state.cacheDelete).not.toHaveBeenCalled()
    })

    it('applies due self-service requests per user and stops login when applied', async () => {
        state.dueRequests = [{ ...state.request }]
        const applied = await applyDueChannelChanges('u1', { now: NOW })
        expect(applied.applied).toBe(true)

        state.request = {
            ...state.request,
            status: 'pending',
            confirmedAt: null,
            scheduledAt: new Date(Date.now() - 1000),
        }
        state.dueRequests = [{ ...state.request }]
        state.update.mockResolvedValue({ affected: 1 })
        await expect(applyChannelChangeBeforeSession('u1')).rejects.toMatchObject({
            body: { code: 'CHANNEL_CHANGE_APPLIED' },
        })
    })

    it('returns NOT_DUE when no request is due', async () => {
        state.dueRequests = []
        expect(await applyDueChannelChanges('u1', { now: NOW })).toEqual({ applied: false, reason: 'NOT_DUE' })
    })
})
