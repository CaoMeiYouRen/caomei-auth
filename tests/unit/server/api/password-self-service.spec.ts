import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    verify: vi.fn(),
    consume: vi.fn(),
    hash: vi.fn(),
    findCredentialAccount: vi.fn(),
    updateAccount: vi.fn(),
    linkAccount: vi.fn(),
    sessionRepository: { find: vi.fn(), delete: vi.fn() },
    cacheDelete: vi.fn(),
    audit: vi.fn(),
    writeAudit: vi.fn(),
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
vi.mock('@/server/utils/audit-log', () => ({
    auditFromEvent: state.audit,
    writeAuditEvent: state.writeAudit,
}))
vi.mock('@/server/utils/recovery-proof', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-proof')>()
    return { ...actual, verifyRecoveryProof: state.verify, consumeProofFactor: state.consume }
})
vi.mock('@/lib/auth', () => ({
    auth: {
        $context: Promise.resolve({
            password: { hash: state.hash },
            internalAdapter: {
                findCredentialAccount: state.findCredentialAccount,
                updateAccount: state.updateAccount,
                linkAccount: state.linkAccount,
            },
            secondaryStorage: { delete: state.cacheDelete },
        }),
    },
}))
vi.mock('@/server/database', () => ({
    dataSource: { getRepository: () => state.sessionRepository },
}))

const handler = (await import('@/server/api/security/password/self-service.post')).default

describe('POST /api/security/password/self-service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.readBody.mockResolvedValue({ newPassword: 'new-password', factor: 'totp', code: '123456' })
        state.getUserSession.mockResolvedValue({
            userId: 'u1',
            user: { id: 'u1' },
            session: { session: { token: 'current-token', createdAt: new Date() } },
        })
        state.verify.mockResolvedValue({ ok: true, factor: 'totp', timeStep: 100 })
        state.consume.mockResolvedValue({ ok: true })
        state.hash.mockResolvedValue('hashed-password')
        state.findCredentialAccount.mockResolvedValue(null)
        state.sessionRepository.find.mockResolvedValue([
            { id: 's1', token: 'current-token' },
            { id: 's2', token: 'other-token' },
        ])
        state.sessionRepository.delete.mockResolvedValue({ affected: 1 })
        state.cacheDelete.mockResolvedValue(undefined)
    })

    it('links a credential account for OAuth-only users and revokes other sessions', async () => {
        const response = await handler({ headers: new Headers() } as any)
        expect(state.verify).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u1',
            purpose: 'self-service-password',
            factor: 'totp',
        }))
        expect(state.linkAccount).toHaveBeenCalledWith({
            userId: 'u1',
            providerId: 'credential',
            accountId: 'u1',
            password: 'hashed-password',
        })
        expect(state.sessionRepository.delete).toHaveBeenCalledWith({ id: 's2' })
        expect(state.sessionRepository.delete).not.toHaveBeenCalledWith({ id: 's1' })
        expect(state.cacheDelete).toHaveBeenCalledWith('other-token')
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'password.set.selfService',
            targetUserId: 'u1',
        }))
        expect(response).toEqual({ status: true, data: { factor: 'totp', otherSessionsRevoked: true } })
    })

    it('updates the password when a credential account already exists', async () => {
        state.findCredentialAccount.mockResolvedValue({ id: 'acc-1', password: null })
        await handler({ headers: new Headers() } as any)
        expect(state.updateAccount).toHaveBeenCalledWith('acc-1', { password: 'hashed-password' })
        expect(state.linkAccount).not.toHaveBeenCalled()
    })

    it('rejects stale sessions, disallowed factors and missing proofs', async () => {
        for (const [reason, statusCode] of [
            ['SESSION_NOT_FRESH', 403],
            ['FACTOR_NOT_ALLOWED', 403],
            ['PROOF_REQUIRED', 403],
            ['TOO_MANY_ATTEMPTS', 429],
        ] as const) {
            state.verify.mockResolvedValue({ ok: false, reason })
            await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
                statusCode,
                data: { code: reason },
            })
        }
        expect(state.hash).not.toHaveBeenCalled()
        expect(state.linkAccount).not.toHaveBeenCalled()
    })

    it('rejects phone OTP as a factor through the service layer', async () => {
        state.readBody.mockResolvedValue({ newPassword: 'new-password', factor: 'phone-otp', code: '123456' })
        state.verify.mockResolvedValue({ ok: false, reason: 'FACTOR_NOT_ALLOWED' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'FACTOR_NOT_ALLOWED' },
        })
        expect(state.verify).toHaveBeenCalledWith(expect.objectContaining({
            purpose: 'self-service-password',
            factor: 'phone-otp',
        }))
    })

    it('rejects weak passwords before verifying the proof', async () => {
        state.readBody.mockResolvedValue({ newPassword: '123', factor: 'totp', code: '123456' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'PASSWORD_TOO_WEAK' },
        })
        expect(state.verify).not.toHaveBeenCalled()
    })

    it('stops when the factor was consumed concurrently and never writes the password', async () => {
        state.consume.mockResolvedValue({ ok: false, reason: 'PROOF_CONSUMED' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'PROOF_CONSUMED' },
        })
        expect(state.hash).not.toHaveBeenCalled()
        expect(state.audit).not.toHaveBeenCalled()
    })

    it('always operates on the session user, never on a client-provided userId (D8)', async () => {
        state.readBody.mockResolvedValue({
            newPassword: 'new-password',
            factor: 'totp',
            code: '123456',
            userId: 'someone-else',
        })
        await handler({ headers: new Headers() } as any)
        expect(state.verify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }))
        expect(state.linkAccount).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }))
    })
})
