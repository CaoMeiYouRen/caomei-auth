import { APIError } from 'better-auth/api'
import { sendPhoneOtp } from './sms'
import { resolveRecoveryMessage } from './recovery-messages'
import { emailService } from './email/service'
import { PHONE_CHANNEL } from '@/utils/shared/env'

/** 短信通道是否已配置（阶段 9 C1：未配置即明确不可用，不引入新供应商） */
export function isPhoneChannelConfigured(): boolean {
    return Boolean(PHONE_CHANNEL)
}

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

/**
 * 发送短信密码重置验证码。
 * 未配置短信通道时抛出 `CHANNEL_NOT_CONFIGURED`，避免「提示已发送但实际未发送」。
 */
export async function sendPasswordResetOtp(
    phoneNumber: string,
    code: string,
    request?: RequestLike | null,
): Promise<void> {
    if (!isPhoneChannelConfigured()) {
        throw new APIError('BAD_REQUEST', {
            message: resolveRecoveryMessage(request, 'channelNotConfigured'),
            code: 'CHANNEL_NOT_CONFIGURED',
        })
    }
    await sendPhoneOtp(phoneNumber, code)
}

/** 两步验证验证码的投递结果（用于向前端说明发到了邮箱还是手机） */
export interface TwoFactorDelivery {
    channel: 'email' | 'phone'
    /** 是否因邮件投递失败而回落到手机 */
    fallback: boolean
}

interface DeliveryRecord {
    at: number
    delivery?: TwoFactorDelivery
    error?: string
}

let latestDelivery: DeliveryRecord | null = null

/** 仅供单测重置模块内状态 */
export function resetTwoFactorDeliveryRecords(): void {
    latestDelivery = null
}

/** 供前端查询最近一次两步验证码的投递结果 */
export function consumeLatestTwoFactorDelivery(maxAgeMs = 15000): DeliveryRecord | null {
    const record = latestDelivery
    latestDelivery = null
    if (!record || Date.now() - record.at > maxAgeMs) {
        return null
    }
    return record
}

/**
 * 发送两步验证验证码（阶段 9 M6）。
 *
 * 优先已验证邮箱；邮件投递失败时回落到已验证手机；两者都不可用时抛出 `SEND_FAILED`。
 * 上游 `/two-factor/send-otp` 会吞掉回调异常，因此这里同时记录投递结果，
 * 由 `/api/security/two-factor/send-otp` 读取后向前端返回明确的成功 / 失败。
 */
export async function deliverTwoFactorOtp(
    user: {
        id?: string | null
        email?: string | null
        emailVerified?: boolean | null
        phoneNumber?: string | null
        phoneNumberVerified?: boolean | null
    },
    otp: string,
    request?: RequestLike | null,
): Promise<TwoFactorDelivery> {
    const failures: string[] = []
    let attemptedEmail = false

    if (user.emailVerified && user.email) {
        attemptedEmail = true
        try {
            await emailService.sendTwoFactorOTP(user.email, otp, 1, { request: request as Request | null | undefined })
            const delivery: TwoFactorDelivery = { channel: 'email', fallback: false }
            latestDelivery = { at: Date.now(), delivery }
            return delivery
        } catch (error) {
            failures.push(`email:${error instanceof Error ? error.message : String(error)}`)
        }
    }

    if (user.phoneNumberVerified && user.phoneNumber) {
        try {
            await sendPhoneOtp(user.phoneNumber, otp, 60)
            const delivery: TwoFactorDelivery = { channel: 'phone', fallback: attemptedEmail }
            latestDelivery = { at: Date.now(), delivery }
            return delivery
        } catch (error) {
            failures.push(`phone:${error instanceof Error ? error.message : String(error)}`)
        }
    }

    const reason = failures.length ? failures.join('; ') : 'no-verified-channel'
    latestDelivery = { at: Date.now(), error: reason }
    throw new APIError('INTERNAL_SERVER_ERROR', {
        message: resolveRecoveryMessage(request, 'sendFailed'),
        code: 'SEND_FAILED',
    })
}
