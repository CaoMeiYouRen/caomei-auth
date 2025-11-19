import twilio from 'twilio'
import type { SmsProvider, SmsResult } from './types'
import { validatePhone } from '@/utils/validate'
import { PHONE_SENDER_NAME, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '@/utils/env'

export class TwilioSmsProvider implements SmsProvider {
    validatePhoneNumber(phoneNumber: string): boolean {
        return validatePhone(phoneNumber)
    }

    async sendOtp(phoneNumber: string, code: string, expiresInMinutes: number): Promise<SmsResult> {
        // 验证必要配置
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            throw new Error('Twilio 配置不完整，请检查 TWILIO_ACCOUNT_SID、TWILIO_AUTH_TOKEN、TWILIO_PHONE_NUMBER')
        }

        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        // 构建短信内容
        const messageBody = `${PHONE_SENDER_NAME}欢迎您，您的验证码为${code}，${expiresInMinutes}分钟内有效，如非本人操作请忽略。`

        // 发送短信
        const message = await client.messages.create({
            body: messageBody,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        })

        return {
            success: true,
            sid: message.sid,
            message: '短信发送成功',
            // 返回额外的Twilio字段用于日志记录
            status: message.status,
            direction: message.direction,
            numSegments: message.numSegments,
            price: message.price,
            priceUnit: message.priceUnit,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
        }
    }
}
