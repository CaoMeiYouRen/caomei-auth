import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    generateBackupCodes: vi.fn(),
    sendTwoFactorOTP: vi.fn(),
    changeEmail: vi.fn(),
    consumeDelivery: vi.fn(),
    audit: vi.fn(),
    requireCaptcha: vi.fn(),
    findOne: vi.fn(),
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
            changeEmail: state.changeEmail,
        },
    },
}))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/captcha-guard', () => ({ requireCaptcha: state.requireCaptcha }))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: () => ({ findOne: state.findOne }),
    },
}))
vi.mock('@/server/entities/user', () => ({ User: class User {} }))
vi.mock('@/server/utils/recovery-channels', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-channels')>()
    return {
        ...actual,
        consumeLatestTwoFactorDelivery: state.consumeDelivery,
    }
})

const regenerateHandler = (await import('@/server/api/security/backup-codes/regenerate.post')).default
const sendOtpHandler = (await import('@/server/api/security/two-factor/send-otp.post')).default
const changeEmailHandler = (await import('@/server/api/security/change-email.post')).default

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
        state.requireCaptcha.mockResolvedValue(undefined)
        state.findOne.mockResolvedValue({ id: 'u1', email: 'old@example.com' })
        state.changeEmail.mockResolvedValue({ status: true })
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

    /* 阶段 17 M2.2 / M2.3：验证码门禁先于业务动作，被拒时不得触达上游 */
    it('修改邮箱在验证码被拒时不查库、不调上游', async () => {
        state.readBody.mockResolvedValue({ newEmail: 'new@example.com' })
        state.requireCaptcha.mockRejectedValue(Object.assign(new Error('captcha'), {
            statusCode: 400,
            data: { code: 'CAPTCHA_INVALID' },
        }))

        await expect(changeEmailHandler({ headers: new Headers(), context: {}, node: { req: { headers: {} } } } as never))
            .rejects.toMatchObject({ statusCode: 400, data: { code: 'CAPTCHA_INVALID' } })
        expect(state.requireCaptcha).toHaveBeenCalled()
        expect(state.findOne).not.toHaveBeenCalled()
        expect(state.changeEmail).not.toHaveBeenCalled()
    })

    it('修改邮箱在验证码通过后执行业务并透传 headers', async () => {
        state.readBody.mockResolvedValue({ newEmail: 'new@example.com' })
        const event = { headers: new Headers({ 'x-captcha-response': 'token' }), context: {}, node: { req: { headers: {} } } }

        await expect(changeEmailHandler(event as never)).resolves.toEqual({ status: true })
        expect(state.requireCaptcha).toHaveBeenCalledWith(event)
        expect(state.changeEmail).toHaveBeenCalledWith({
            body: { newEmail: 'new@example.com', callbackURL: undefined },
            headers: event.headers,
        })
    })

    it('2FA 发送验证码在验证码被拒时不调用上游、不消费投递记录', async () => {
        state.requireCaptcha.mockRejectedValue(Object.assign(new Error('captcha'), {
            statusCode: 400,
            data: { code: 'CAPTCHA_REQUIRED' },
        }))

        await expect(sendOtpHandler({ headers: new Headers(), context: {} } as never))
            .rejects.toMatchObject({ statusCode: 400, data: { code: 'CAPTCHA_REQUIRED' } })
        expect(state.sendTwoFactorOTP).not.toHaveBeenCalled()
        expect(state.consumeDelivery).not.toHaveBeenCalled()
    })
})
