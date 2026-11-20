import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    generateBackupCodes: vi.fn(),
    sendTwoFactorOTP: vi.fn(),
    consumeDelivery: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            generateBackupCodes: state.generateBackupCodes,
            sendTwoFactorOTP: state.sendTwoFactorOTP,
        },
    },
}))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/recovery-channels', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-channels')>()
    return {
        ...actual,
        consumeLatestTwoFactorDelivery: state.consumeDelivery,
    }
})

const regenerateHandler = (await import('@/server/api/security/backup-codes/regenerate.post')).default
const sendOtpHandler = (await import('@/server/api/security/two-factor/send-otp.post')).default

describe('security endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1' })
        state.generateBackupCodes.mockResolvedValue({
            status: true,
            backupCodes: ['code-1', 'code-2'],
        })
        state.sendTwoFactorOTP.mockResolvedValue({ status: true })
        state.consumeDelivery.mockReturnValue({ at: Date.now(), delivery: { channel: 'email', fallback: false } })
    })

    it('regenerates backup codes and audits only the count', async () => {
        state.readBody.mockResolvedValue({ password: 'secret123' })
        const event = { headers: new Headers(), context: {}, node: { req: { headers: {} } } }
        const result = await regenerateHandler(event as never)

        expect(result).toEqual({ status: true, backupCodes: ['code-1', 'code-2'] })
        expect(state.generateBackupCodes).toHaveBeenCalledWith({
            body: { password: 'secret123' },
            headers: event.headers,
        })
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'backupCodes.regenerate',
            after: { count: 2 },
        }))
        expect(JSON.stringify(state.audit.mock.calls)).not.toContain('code-1')
    })

    it('rejects backup code regeneration without a password', async () => {
        state.readBody.mockResolvedValue({ password: '' })
        await expect(regenerateHandler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns the delivery channel after sending a 2FA OTP', async () => {
        const result = await sendOtpHandler({ headers: new Headers(), context: {} } as never)
        expect(result).toEqual({ status: true, channel: 'email', fallback: false })
        expect(state.sendTwoFactorOTP).toHaveBeenCalled()
    })

    it('surfaces a 502 when no channel could deliver the 2FA OTP', async () => {
        state.consumeDelivery.mockReturnValue({ at: Date.now(), error: 'smtp down' })
        await expect(sendOtpHandler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 502,
        })
    })

    it('returns a generic success when no delivery record is available', async () => {
        state.consumeDelivery.mockReturnValue(null)
        const result = await sendOtpHandler({ headers: new Headers(), context: {} } as never)
        expect(result).toEqual({ status: true, channel: null, fallback: false })
    })
})
