import { SpugSmsProvider } from './spug'
import { TwilioSmsProvider } from './twilio'
import type { SmsProvider } from './types'

export * from './types'
export * from './spug'
export * from './twilio'

/**
 * 获取短信发送渠道实例
 * @param channel 渠道名称
 * @returns 短信发送实例
 */
export function resolveSmsProvider(channel: string): SmsProvider {
    switch (channel.toLowerCase()) {
        case 'spug':
            return new SpugSmsProvider()
        case 'twilio':
            return new TwilioSmsProvider()
        default:
            throw new Error(`未知的短信发送渠道: ${channel}`)
    }
}
