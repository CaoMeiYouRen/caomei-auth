import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    getUserSession: vi.fn(),
    userRepository: { findOne: vi.fn() },
    issue: vi.fn(),
    canSend: vi.fn(),
    markSent: vi.fn(),
    generate: vi.fn(),
    sendOtp: vi.fn(),
    isPhoneChannelConfigured: vi.fn(),
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
vi.mock('@/server/utils/recovery-channels', () => ({
    isPhoneChannelConfigured: state.isPhoneChannelConfigured,
}))
vi.mock('@/server/utils/sms', () => ({ sendPhoneOtp: state.sendOtp }))
vi.mock('@/server/utils/proof-otp', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/proof-otp')>()
    return {
        ...actual,
        issueProofOtp: state.issue,
        canSendProofOtp: state.canSend,
        markProofOtpSent: state.markSent,
        generateProofOtp: state.generate,
    }
})
vi.mock('@/server/database', () => ({ dataSource: { getRepository: () => state.userRepository } }))

const handler = (await import('@/server/api/security/proof-otp.post')).default

describe('POST /api/security/proof-otp', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { id: 'u1' }, session: { session: { createdAt: new Date() } } })
        state.userRepository.findOne.mockResolvedValue({
            id: 'u1',
            phoneNumber: '+8613800138000',
            phoneNumberVerified: true,
        })
        state.isPhoneChannelConfigured.mockReturnValue(true)
        state.canSend.mockReturnValue(true)
        state.generate.mockReturnValue('123456')
        state.issue.mockResolvedValue(undefined)
        state.sendOtp.mockResolvedValue(undefined)
    })

    it('issues and sends a proof OTP to a verified phone', async () => {
        const response = await handler({ headers: new Headers() } as any)
        expect(response).toEqual({ status: true, data: { channel: 'phone', expiresInSeconds: 600 } })
        expect(state.issue).toHaveBeenCalledWith({ userId: 'u1', phoneNumber: '+8613800138000', code: '123456' })
        expect(state.sendOtp).toHaveBeenCalledWith('+8613800138000', '123456', 600)
        expect(state.markSent).toHaveBeenCalledWith('u1')
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'proof.otp.send' }))
    })

    it('refuses unverified phones, missing SMS channel and throttled users', async () => {
        state.userRepository.findOne.mockResolvedValue({ id: 'u1', phoneNumber: '+8613800138000', phoneNumberVerified: false })
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'PHONE_NOT_VERIFIED' },
        })

        state.userRepository.findOne.mockResolvedValue({ id: 'u1', phoneNumber: '+8613800138000', phoneNumberVerified: true })
        state.isPhoneChannelConfigured.mockReturnValue(false)
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'CHANNEL_NOT_CONFIGURED' },
        })

        state.isPhoneChannelConfigured.mockReturnValue(true)
        state.canSend.mockReturnValue(false)
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode: 429 })
        expect(state.issue).not.toHaveBeenCalled()
    })

    it('audits delivery failures and reports SEND_FAILED', async () => {
        state.sendOtp.mockRejectedValue(new Error('gateway down'))
        await expect(handler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 502,
            data: { code: 'SEND_FAILED' },
        })
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'proof.otp.send',
            result: 'failure',
        }))
        expect(state.markSent).not.toHaveBeenCalled()
    })
})
