import type { SmsProvider, SmsResult } from './types'
import { cnPhoneSchema } from '@/utils/shared/validators'
import { PHONE_SENDER_NAME, SPUG_TEMPLATE_ID } from '@/utils/shared/env'

export class SpugSmsProvider implements SmsProvider {
    validatePhoneNumber(phoneNumber: string): boolean {
        // Spug 平台只支持中国大陆手机号
        return cnPhoneSchema.safeParse(phoneNumber).success
    }

    async sendOtp(phoneNumber: string, code: string, expiresInMinutes: number): Promise<SmsResult> {
        if (!SPUG_TEMPLATE_ID) {
            throw new Error('Spug 配置不完整，请检查 SPUG_TEMPLATE_ID')
        }

        // Spug 平台不用国家或地区代码，所以去除开头的 +86
        const cleanPhoneNumber = phoneNumber.replace(/^\+86/, '')

        // 请在 Spug 平台中选择下文的短信模板
        // ${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
        const body = JSON.stringify({
            key1: PHONE_SENDER_NAME, // 短信发件人名称
            key2: code, // 验证码
            key3: expiresInMinutes, // 验证码有效时间(分钟)
            targets: cleanPhoneNumber,
        })

        const resp = await fetch(`https://push.spug.cc/send/${SPUG_TEMPLATE_ID}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        })

        // {"code": 200, "msg": "请求成功"}
        const result = await resp.json() as { code: number, msg: string, request_id: string }

        if (result.code === 200) {
            return {
                success: true,
                message: result.msg,
                code: result.code,
                sid: result.request_id,
            }
        }
        throw new Error(`短信发送失败: ${result.msg}`)
    }
}
