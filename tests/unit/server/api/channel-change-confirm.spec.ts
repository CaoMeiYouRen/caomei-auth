import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    validateParamsSafe: vi.fn(),
    verify: vi.fn(),
    markConfirmed: vi.fn(),
    userRepository: { findOne: vi.fn(), save: vi.fn(async (item) => item) },
    channelRepository: { save: vi.fn(async (item) => item), findOne: vi.fn(async () => ({ id: 'req-1', source: 'admin' })) },
    deleteUserSessions: vi.fn(),
    sendNotification: vi.fn(),
    requestEmailReset: vi.fn(),
    requestPhoneReset: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/validation', () => ({ validateParamsSafe: state.validateParamsSafe }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: async () => ({ t: (key: string) => key }),
    createLocalizedError: async (_event: unknown, options: { statusCode: number, key: string, data?: unknown }) => {
        const error = new Error(options.key) as Error & { statusCode: number, data?: unknown }
        error.statusCode = options.statusCode
        error.data = options.data
        return error
    },
}))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: (entity: any) => (entity?.name === 'ChannelChangeRequest' ? state.channelRepository : state.userRepository),
    },
}))
vi.mock('@/server/utils/channel-change', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/channel-change')>()
    return {
        ...actual,
        verifyChannelChangeRequest: state.verify,
        markChannelChangeConfirmed: state.markConfirmed,
    }
})
vi.mock('@/server/utils/email/service', () => ({
    emailService: { sendChannelChangeNotification: state.sendNotification },
}))
vi.mock('@/server/utils/sms', () => ({ sendPhoneNotification: vi.fn(async () => true) }))
vi.mock('@/server/utils/registration-policy', () => ({ evaluateRegistration: vi.fn(async () => ({ allowed: true })) }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/lib/auth', () => ({
    auth: {
        $context: Promise.resolve({ internalAdapter: { deleteUserSessions: state.deleteUserSessions } }),
        api: {
            requestPasswordResetEmailOTP: state.requestEmailReset,
            requestPasswordResetPhoneNumber: state.requestPhoneReset,
        },
    },
}))

const handler = (await import('@/server/api/channel-change/[id].post')).default

describe('channel change confirmation API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.validateParamsSafe.mockResolvedValue({ success: true, data: { id: 'req-1' } })
        state.readBody.mockResolvedValue({ code: '123456' })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return {
                    id: 'u1',
                    email: 'old@example.com',
                    phoneNumber: '+8613800138000',
                    emailVerified: false,
                    phoneNumberVerified: true,
                    mustResetPassword: false,
                    twoFactorEnabled: true,
                }
            }
            return null
        })
        state.markConfirmed.mockImplementation(async (request: any) => {
            request.status = 'confirmed'
            await state.channelRepository.save(request)
        })
        state.sendNotification.mockResolvedValue(undefined)
        state.requestEmailReset.mockResolvedValue({ status: true })
        state.deleteUserSessions.mockResolvedValue(undefined)
        state.verify.mockResolvedValue({
            ok: true,
            request: {
                id: 'req-1',
                userId: 'u1',
                channel: 'email',
                newValue: 'new@example.com',
                status: 'pending',
                reason: 'user lost mailbox',
                expiresAt: new Date(Date.now() + 60000),
            },
        })
    })

    it('applies the change, revokes sessions, forces a password reset and audits', async () => {
        const event = { headers: new Headers(), context: {}, node: { req: { headers: {} } } }
        const result = await handler(event as never)

        expect(state.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'u1',
            email: 'new@example.com',
            emailVerified: true,
            mustResetPassword: true,
            twoFactorEnabled: true,
        }))
        expect(state.deleteUserSessions).toHaveBeenCalledWith('u1')
        expect(state.markConfirmed).toHaveBeenCalled()
        expect(state.sendNotification).toHaveBeenCalledWith('old@example.com', expect.stringContaining('n***@example.com'), expect.anything())
        expect(state.requestEmailReset).toHaveBeenCalledWith(expect.objectContaining({ body: { email: 'new@example.com' } }))
        expect(result.data).toMatchObject({ mustResetPassword: true, resetCodeSent: true, channel: 'email' })
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({ action: 'channel.change.confirm' }))
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({ action: 'password.reset.forced' }))
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({ action: 'channel.change.notify' }))
    })

    it('maps invalid codes to a localized 400 with CODE_INVALID', async () => {
        state.verify.mockResolvedValue({ ok: false, reason: 'CODE_INVALID' })
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'CODE_INVALID' },
        })
        expect(state.userRepository.save).not.toHaveBeenCalled()
    })

    it('does not touch 2FA or backup codes (M12)', async () => {
        await handler({ headers: new Headers(), context: {}, node: { req: { headers: {} } } } as never)
        const saved = (state.userRepository.save.mock.calls[0] as any[])[0]
        expect(saved.twoFactorEnabled).toBe(true)
        expect(saved.twoFactor).toBeUndefined()
        expect(state.channelRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed' }))
    })

    it('audits no-deliverable-channel when the old channel is missing (M2)', async () => {
        state.verify.mockResolvedValue({
            ok: true,
            request: {
                id: 'req-1',
                userId: 'u1',
                channel: 'phone',
                newValue: '+8613900139000',
                status: 'pending',
                reason: null,
                expiresAt: new Date(Date.now() + 60000),
            },
        })
        state.userRepository.findOne.mockResolvedValue({
            id: 'u1',
            email: 'old@example.com',
            phoneNumber: null,
            mustResetPassword: false,
            twoFactorEnabled: false,
        })
        state.requestPhoneReset.mockResolvedValue({ status: true })

        await handler({ headers: new Headers(), context: {}, node: { req: { headers: {} } } } as never)

        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'channel.change.notify',
            result: 'failure',
            reason: 'no-deliverable-channel',
        }))
    })

    it('still confirms when the reset code cannot be sent', async () => {
        state.requestEmailReset.mockRejectedValue(new Error('smtp down'))
        const result = await handler({ headers: new Headers(), context: {}, node: { req: { headers: {} } } } as never)
        expect(result.data).toMatchObject({ mustResetPassword: true, resetCodeSent: false, resetError: 'smtp down' })
    })

    it('still confirms when the old channel notification fails and audits the failure (M2)', async () => {
        state.sendNotification.mockRejectedValue(new Error('old inbox unavailable'))
        const result = await handler({ headers: new Headers(), context: {}, node: { req: { headers: {} } } } as never)
        expect(result.data).toMatchObject({ mustResetPassword: true })
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'channel.change.notify',
            result: 'failure',
            reason: 'old inbox unavailable',
        }))
    })

    it('rejects self-service requests before verifying the code (M2.1 source gate)', async () => {
        state.channelRepository.findOne.mockResolvedValue({ id: 'req-1', source: 'user' })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 403,
            data: { code: 'CHANNEL_CHANGE_KIND_MISMATCH' },
        })
        expect(state.verify).not.toHaveBeenCalled()
    })
})
