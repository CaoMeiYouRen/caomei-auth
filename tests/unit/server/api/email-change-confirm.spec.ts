import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    repository: { find: vi.fn(), save: vi.fn(async (item) => item) },
    verify: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
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
vi.mock('@/server/database', () => ({ dataSource: { getRepository: () => state.repository } }))
vi.mock('@/server/utils/channel-change', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/channel-change')>()
    return { ...actual, verifyChannelChangeRequest: state.verify }
})

const handler = (await import('@/server/api/security/email/change-with-proof/confirm.post')).default

describe('POST /api/security/email/change-with-proof/confirm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.readBody.mockResolvedValue({ code: '123456' })
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { id: 'u1' }, session: { session: { createdAt: new Date() } } })
        state.repository.find.mockResolvedValue([
            { id: 'req-1', userId: 'u1', channel: 'email', source: 'user', status: 'pending', scheduledAt: null, createdAt: new Date('2026-11-21T00:00:00Z') },
        ])
        state.verify.mockResolvedValue({ ok: true, request: { id: 'req-1' } })
    })

    it('writes scheduledAt after ownership verification and audits it', async () => {
        const response = await handler({ headers: new Headers() } as any)
        expect(state.verify).toHaveBeenCalledWith({ id: 'req-1', code: '123456' })
        const saved = state.repository.save.mock.calls[0]![0]
        expect(saved.scheduledAt).toBeInstanceOf(Date)
        expect(saved.scheduledAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000)
        expect(saved.expiresAt).toBeUndefined()
        expect(saved.confirmedAt).toBeUndefined()
        expect(response.data.status).toBe('pending')
        expect(response.data.coolingOffHours).toBe(24)
        expect(response.data.remainingMs).toBeGreaterThan(0)
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'email.change.confirm' }))
    })

    it('returns the current state idempotently without consuming the code again', async () => {
        const scheduledAt = new Date(Date.now() + 60 * 60 * 1000)
        state.repository.find.mockResolvedValue([
            { id: 'req-1', userId: 'u1', channel: 'email', source: 'user', status: 'pending', scheduledAt, createdAt: new Date() },
        ])
        const response = await handler({ headers: new Headers() } as any)
        expect(response.data.scheduledAt).toEqual(scheduledAt)
        expect(state.verify).not.toHaveBeenCalled()
        expect(state.repository.save).not.toHaveBeenCalled()
    })

    it('rejects when there is no pending self-service request', async () => {
        state.repository.find.mockResolvedValue([])
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 404,
            data: { code: 'NO_PENDING_REQUEST' },
        })
    })

    it('propagates expired / invalid / over-limit verification failures without scheduling', async () => {
        for (const [reason, statusCode] of [['CODE_EXPIRED', 410], ['CODE_INVALID', 400], ['TOO_MANY_ATTEMPTS', 429]] as const) {
            state.verify.mockResolvedValue({ ok: false, reason })
            await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode, data: { code: reason } })
        }
        expect(state.repository.save).not.toHaveBeenCalled()
        expect(state.audit).not.toHaveBeenCalled()
    })
})
