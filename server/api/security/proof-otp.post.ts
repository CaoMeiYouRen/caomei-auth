import { defineEventHandler } from 'h3'
import { rateLimit } from '@/server/utils/rate-limit'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { getUserSession } from '@/server/utils/get-user-session'
import { createLocalizedError } from '@/server/utils/i18n'
import { auditFromEvent } from '@/server/utils/audit-log'
import { isPhoneChannelConfigured } from '@/server/utils/recovery-channels'
import { sendPhoneOtp } from '@/server/utils/sms'
import { canSendProofOtp, generateProofOtp, issueProofOtp, markProofOtpSent } from '@/server/utils/proof-otp'

/**
 * 发送受控证明短信验证码（阶段 10 M2.3）。
 *
 * 只向已通过验证的手机号投递；邮件仅用于通知，不作为证明因子。
 * 未配置短信通道、手机未验证时返回明确错误，不假装已发送。
 */
export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 60, max: 3 })
    const { userId } = await getUserSession(event)
    if (!canSendProofOtp(userId)) {
        throw await createLocalizedError(event, {
            statusCode: 429,
            key: 'errors.auth.rateLimited',
            data: { code: 'RATE_LIMITED' },
        })
    }

    const user = await dataSource.getRepository(User).findOne({ where: { id: userId } })
    if (!user) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.userNotFound' })
    }
    if (!user.phoneNumber || !user.phoneNumberVerified) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.proofOtpPhoneRequired',
            data: { code: 'PHONE_NOT_VERIFIED' },
        })
    }
    if (!isPhoneChannelConfigured()) {
        throw await createLocalizedError(event, {
            statusCode: 400,
            key: 'errors.recovery.channelNotConfigured',
            data: { code: 'CHANNEL_NOT_CONFIGURED' },
        })
    }

    const code = generateProofOtp()
    await issueProofOtp({ userId, phoneNumber: user.phoneNumber, code })
    try {
        await sendPhoneOtp(user.phoneNumber, code, 600)
    } catch (error) {
        auditFromEvent(event, {
            action: 'proof.otp.send',
            actorId: userId,
            targetUserId: userId,
            result: 'failure',
            reason: error instanceof Error ? error.message : String(error),
            source: 'web',
        })
        throw await createLocalizedError(event, {
            statusCode: 502,
            key: 'errors.recovery.sendFailed',
            data: { code: 'SEND_FAILED' },
        })
    }
    markProofOtpSent(userId)

    auditFromEvent(event, {
        action: 'proof.otp.send',
        actorId: userId,
        targetUserId: userId,
        after: { channel: 'phone' },
        source: 'web',
    })

    return {
        status: true,
        data: { channel: 'phone', expiresInSeconds: 600 },
    }
})
