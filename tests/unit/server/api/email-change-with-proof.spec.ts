import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    userRepository: { findOne: vi.fn() },
    channelRepository: { save: vi.fn(async (item) => item) },
    manager: { getRepository: vi.fn() },
    transaction: vi.fn(),
    verify: vi.fn(),
    consume: vi.fn(),
    createRequest: vi.fn(),
    sendCode: vi.fn(),
    notifyLifecycle: vi.fn(),
    evaluateRegistration: vi.fn(),
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
vi.mock('@/server/utils/registration-policy', () => ({ evaluateRegistration: state.evaluateRegistration }))
vi.mock('@/server/utils/email/service', () => ({
    emailService: { sendChannelChangeCode: state.sendCode },
}))
vi.mock('@/server/utils/channel-change-notify', () => ({
    notifyChannelChangeLifecycle: state.notifyLifecycle,
}))
vi.mock('@/server/utils/recovery-proof', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-proof')>()
    return { ...actual, verifyRecoveryProof: state.verify, consumeProofFactor: state.consume }
})
vi.mock('@/server/utils/channel-change', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/channel-change')>()
    return { ...actual, createChannelChangeRequest: state.createRequest }
})
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: (entity: any) => (entity?.name === 'ChannelChangeRequest' ? state.channelRepository : state.userRepository),
        transaction: state.transaction,
    },
}))

const handler = (await import('@/server/api/security/email/change-with-proof.post')).default

describe('POST /api/security/email/change-with-proof', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.readBody.mockResolvedValue({
            newEmail: 'New@Example.com',
            password: 'pw',
            factor: 'recovery-code',
            code: 'AAAA-BBBB-CCCC-DDDD',
        })
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { id: 'u1' }, session: { session: { createdAt: new Date() } } })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com' }
            }
            return null
        })
        state.evaluateRegistration.mockResolvedValue({ allowed: true })
        state.verify.mockResolvedValue({ ok: true, factor: 'recovery-code' })
        state.consume.mockResolvedValue({ ok: true })
        state.createRequest.mockResolvedValue({
            request: { id: 'req-1', status: 'pending', source: 'user' },
            code: '654321',
        })
        state.manager.getRepository.mockReturnValue(state.channelRepository)
        state.transaction.mockImplementation(async (callback: any) => callback(state.manager))
        state.sendCode.mockResolvedValue(undefined)
        state.notifyLifecycle.mockResolvedValue(true)
    })

    it('consumes the proof, creates a pending request and sends the ownership code', async () => {
        const response = await handler({ headers: new Headers() } as any)
        expect(response).toEqual({
            status: true,
            data: {
                requestId: 'req-1',
                maskedTarget: 'n***@example.com',
                factor: 'recovery-code',
                scheduledAt: null,
                requiresVerify: true,
            },
        })
        expect(state.consume).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', factor: 'recovery-code', manager: state.manager }))
        expect(state.createRequest).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u1',
            channel: 'email',
            value: 'new@example.com',
            source: 'user',
            proofFactor: 'recovery-code',
        }))
        expect(state.sendCode).toHaveBeenCalledWith('new@example.com', '654321', 'n***@example.com', 10, expect.anything())
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'email.change.request' }))
        expect(state.notifyLifecycle).toHaveBeenCalledWith(expect.objectContaining({
            event: 'request',
            oldEmail: 'old@example.com',
            newEmail: 'new@example.com',
        }))
    })

    it('rejects an invalid password before touching the database transaction', async () => {
        state.verify.mockResolvedValue({ ok: false, reason: 'PASSWORD_INVALID' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'PASSWORD_INVALID' },
        })
        expect(state.transaction).not.toHaveBeenCalled()
    })

    it('rejects a taken target email', async () => {
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com' }
            }
            return { id: 'u2', email: 'new@example.com' }
        })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 409,
            data: { code: 'TARGET_TAKEN' },
        })
    })

    it('rejects an unchanged email and disallowed registration targets', async () => {
        state.readBody.mockResolvedValue({ newEmail: 'old@example.com', password: 'pw', factor: 'totp', code: '123456' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'TARGET_INVALID' },
        })

        state.readBody.mockResolvedValue({ newEmail: 'blocked@example.com', password: 'pw', factor: 'totp', code: '123456' })
        state.evaluateRegistration.mockResolvedValue({ allowed: false })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'REGISTRATION_NOT_ALLOWED' },
        })
    })

    it('returns PROOF_CONSUMED when the factor was consumed concurrently', async () => {
        state.consume.mockResolvedValue({ ok: false, reason: 'PROOF_CONSUMED' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'PROOF_CONSUMED' },
        })
        expect(state.createRequest).not.toHaveBeenCalled()
    })

    it('cancels the request when the ownership code cannot be delivered', async () => {
        state.sendCode.mockRejectedValue(new Error('smtp down'))
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 502,
            data: { code: 'SEND_FAILED' },
        })
        expect(state.channelRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'req-1',
            status: 'cancelled',
        }))
    })
})
