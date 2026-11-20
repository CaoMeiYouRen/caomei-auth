import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    channel: '',
    sendPhone: vi.fn(),
    sendEmail: vi.fn(),
}))

vi.mock('@/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return {
        ...actual,
        get PHONE_CHANNEL() {
            return state.channel
        },
    }
})

vi.mock('@/server/utils/sms', () => ({
    sendPhoneOtp: state.sendPhone,
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendTwoFactorOTP: state.sendEmail,
        sendChannelChangeNotification: vi.fn(),
    },
}))

const {
    consumeLatestTwoFactorDelivery,
    deliverTwoFactorOtp,
    isPhoneChannelConfigured,
    resetTwoFactorDeliveryRecords,
    sendPasswordResetOtp,
} = await import('@/server/utils/recovery-channels')

describe('server/utils/recovery-channels', () => {
    beforeEach(() => {
        state.channel = ''
        state.sendPhone.mockReset()
        state.sendEmail.mockReset()
        resetTwoFactorDeliveryRecords()
    })

    it('rejects SMS password reset when the channel is not configured', async () => {
        expect(isPhoneChannelConfigured()).toBe(false)
        await expect(sendPasswordResetOtp('+8613800138000', '123456')).rejects.toMatchObject({
            body: { code: 'CHANNEL_NOT_CONFIGURED' },
        })
        expect(state.sendPhone).not.toHaveBeenCalled()
    })

    it('sends SMS password reset when configured', async () => {
        state.channel = 'twilio'
        state.sendPhone.mockResolvedValue({})
        await sendPasswordResetOtp('+8613800138000', '123456')
        expect(state.sendPhone).toHaveBeenCalledWith('+8613800138000', '123456')
    })

    it('prefers email for two-factor OTP', async () => {
        state.sendEmail.mockResolvedValue(undefined)
        const delivery = await deliverTwoFactorOtp({
            id: 'u1',
            email: 'a@example.com',
            emailVerified: true,
            phoneNumber: '+8613800138000',
            phoneNumberVerified: true,
        }, '123456')
        expect(delivery).toEqual({ channel: 'email', fallback: false })
        expect(consumeLatestTwoFactorDelivery()).toMatchObject({ delivery })
        expect(consumeLatestTwoFactorDelivery()).toBeNull()
    })

    it('falls back to the verified phone when email delivery fails', async () => {
        state.channel = 'twilio'
        state.sendEmail.mockRejectedValue(new Error('smtp down'))
        state.sendPhone.mockResolvedValue({})
        const delivery = await deliverTwoFactorOtp({
            id: 'u1',
            email: 'a@example.com',
            emailVerified: true,
            phoneNumber: '+8613800138000',
            phoneNumberVerified: true,
        }, '123456')
        expect(delivery).toEqual({ channel: 'phone', fallback: true })
    })

    it('reports SEND_FAILED when no channel can deliver and records the reason', async () => {
        state.sendEmail.mockRejectedValue(new Error('smtp down'))
        await expect(deliverTwoFactorOtp({
            id: 'u1',
            email: 'a@example.com',
            emailVerified: true,
        }, '123456')).rejects.toMatchObject({ body: { code: 'SEND_FAILED' } })
        expect(consumeLatestTwoFactorDelivery()?.error).toContain('smtp down')
    })

    it('uses verified phone directly when email is not verified', async () => {
        state.channel = 'twilio'
        state.sendPhone.mockResolvedValue({})
        const delivery = await deliverTwoFactorOtp({
            id: 'u1',
            email: 'a@example.com',
            emailVerified: false,
            phoneNumber: '+8613800138000',
            phoneNumberVerified: true,
        }, '123456')
        expect(delivery).toEqual({ channel: 'phone', fallback: false })
    })
})
