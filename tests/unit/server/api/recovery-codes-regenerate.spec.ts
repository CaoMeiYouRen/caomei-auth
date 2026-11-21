import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    userRepository: { findOne: vi.fn() },
    generate: vi.fn(),
    checkTotp: vi.fn(),
    consumeTotp: vi.fn(),
    consumeBackup: vi.fn(),
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
vi.mock('@/server/database', () => ({
    dataSource: { getRepository: () => state.userRepository },
}))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/server/utils/recovery-code', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-code')>()
    return { ...actual, generateRecoveryCodes: state.generate }
})
vi.mock('@/server/utils/proof-factors', () => ({
    checkTotpFactor: state.checkTotp,
    consumeTotpFactor: state.consumeTotp,
    consumeBackupCodeFactor: state.consumeBackup,
}))

const handler = (await import('@/server/api/security/recovery-codes/regenerate.post')).default

describe('POST /api/security/recovery-codes/regenerate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.readBody.mockResolvedValue({})
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', twoFactorEnabled: false })
        state.generate.mockResolvedValue(['AAAA-BBBB-CCCC-DDDD'])
        state.getUserSession.mockResolvedValue({
            userId: 'u1',
            user: { id: 'u1' },
            session: { session: { createdAt: new Date() } },
        })
    })

    it('issues recovery codes for a fresh session without 2FA', async () => {
        const response = await handler({ headers: new Headers() } as any)
        expect(response).toEqual({ status: true, data: { recoveryCodes: ['AAAA-BBBB-CCCC-DDDD'], remaining: 1 } })
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'recoveryCodes.regenerate',
            after: expect.objectContaining({ count: 1 }),
        }))
    })

    it('rejects stale sessions', async () => {
        state.getUserSession.mockResolvedValue({
            userId: 'u1',
            user: { id: 'u1' },
            session: { session: { createdAt: new Date(Date.now() - 16 * 60 * 1000) } },
        })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'SESSION_NOT_FRESH' },
        })
        expect(state.generate).not.toHaveBeenCalled()
    })

    it('requires a second factor when 2FA is enabled', async () => {
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', twoFactorEnabled: true })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'PROOF_REQUIRED' },
        })
        expect(state.generate).not.toHaveBeenCalled()
    })

    it('verifies and consumes TOTP before regenerating', async () => {
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', twoFactorEnabled: true })
        state.readBody.mockResolvedValue({ factor: 'totp', code: '123456' })
        state.checkTotp.mockResolvedValue({ valid: true, timeStep: 42 })
        state.consumeTotp.mockResolvedValue(true)

        const response = await handler({ headers: new Headers() } as any)
        expect(response.status).toBe(true)
        expect(state.consumeTotp).toHaveBeenCalledWith('u1', 42)
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'proof.verify' }))
    })

    it('rejects an invalid or replayed TOTP', async () => {
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', twoFactorEnabled: true })
        state.readBody.mockResolvedValue({ factor: 'totp', code: '123456' })
        state.checkTotp.mockResolvedValue({ valid: false, reason: 'CODE_INVALID' })

        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'CODE_INVALID' },
        })
        expect(state.generate).not.toHaveBeenCalled()
    })

    it('consumes backup codes before regenerating', async () => {
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', twoFactorEnabled: true })
        state.readBody.mockResolvedValue({ factor: 'backup-code', code: 'AAAAA-BBBBB' })
        state.consumeBackup.mockResolvedValue({ ok: true })

        const response = await handler({ headers: new Headers() } as any)
        expect(response.status).toBe(true)
        expect(state.consumeBackup).toHaveBeenCalledWith('u1', 'AAAAA-BBBBB')
    })
})
