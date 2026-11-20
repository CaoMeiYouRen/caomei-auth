import { APIError } from 'better-auth/api'
import { emailService } from './email/service'
import { sendPhoneOtp } from './sms'
import { resolveRecoveryMessage } from './recovery-messages'
import { PHONE_CHANNEL } from '@/utils/shared/env'
import type { ChannelChangeType } from '@/server/entities/channel-change-request'

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

/** 把改绑验证码投递到新通道；未配置短信时抛出 CHANNEL_NOT_CONFIGURED */
export async function deliverChannelChangeCode(
    channel: ChannelChangeType,
    target: string,
    code: string,
    request?: RequestLike | null,
): Promise<void> {
    if (channel === 'email') {
        await emailService.sendChannelChangeCode(
            target,
            code,
            target,
            10,
            { request: request as Request | null | undefined },
        )
        return
    }
    if (!PHONE_CHANNEL) {
        throw new APIError('BAD_REQUEST', {
            message: resolveRecoveryMessage(request, 'channelNotConfigured'),
            code: 'CHANNEL_NOT_CONFIGURED',
        })
    }
    await sendPhoneOtp(target, code, 600)
}
