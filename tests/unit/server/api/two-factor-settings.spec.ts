import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
vi.mock('@/lib/auth', () => ({
    auth: { api: { enableTwoFactor: state.enable, disableTwoFactor: state.disable } },
}))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))

const enableHandler = (await import('@/server/api/security/two-factor/enable.post')).default
const disableHandler = (await import('@/server/api/security/two-factor/disable.post')).default

describe('2FA settings endpoints audit (M1)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { twoFactorEnabled: false } })
        state.enable.mockResolvedValue({ method: 'totp', totpURI: 'otpauth://x', backupCodes: ['a'] })
        state.disable.mockResolvedValue({ status: true })
    })

    it('records twoFactor.enable with before / after state', async () => {
        state.readBody.mockResolvedValue({ password: 'secret123', method: 'totp' })
        const event = { headers: new Headers(), context: {}, node: { req: { headers: {} } } }
        const result = await enableHandler(event as never)

        expect(result).toMatchObject({ method: 'totp' })
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'twoFactor.enable',
            actorId: 'u1',
            before: { twoFactorEnabled: false },
            after: { twoFactorEnabled: true, method: 'totp' },
        }))
    })

    it('records twoFactor.disable', async () => {
        state.readBody.mockResolvedValue({ password: 'secret123' })
        const event = { headers: new Headers(), context: {}, node: { req: { headers: {} } } }
        await disableHandler(event as never)

        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'twoFactor.disable',
            after: { twoFactorEnabled: false },
        }))
    })

    it('rejects a missing password without calling better-auth', async () => {
        state.readBody.mockResolvedValue({ password: '' })
        await expect(enableHandler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({ statusCode: 400 })
        expect(state.enable).not.toHaveBeenCalled()
    })
})
