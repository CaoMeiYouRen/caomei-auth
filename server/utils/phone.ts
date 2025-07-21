import { limiterStorage } from '@/server/database/storage'
import { validatePhone } from '@/utils/validate'
import {
    PHONE_DAILY_LIMIT,
    PHONE_SINGLE_USER_DAILY_LIMIT,
    PHONE_LIMIT_WINDOW,
    PHONE_CHANNEL,
    PHONE_SPUG_TEMPLATE_ID,
    PHONE_SENDER_NAME,
    PHONE_EXPIRES_IN,
} from '@/utils/env'

const PHONE_LIMIT_KEY = 'phone_global_limit'

/**
 *  TODO：支持更多短信渠道
 *  发送短信验证码
 *
 * @author CaoMeiYouRen
 * @date 2025-06-26
 * @export
 * @param phoneNumber
 * @param code
 * @param expiresIn 验证码有效时间，单位秒，默认 300 秒 (5 分钟)
 * @throws {Error} 如果超过了全局或单个手机号的发送限制，
 */
export async function sendPhoneOtp(phoneNumber: string, code: string, expiresIn = PHONE_EXPIRES_IN) {
    const expiresInMinutes = Math.floor(expiresIn / 60)
    // console.info(`Sending OTP ${code} to phone number ${phoneNumber}`)
    // 检查全局限流
    const globalCount = await limiterStorage.increment(
        PHONE_LIMIT_KEY,
        PHONE_LIMIT_WINDOW,
    )
    if (globalCount > PHONE_DAILY_LIMIT) {
        throw new Error('今日短信验证码发送次数已达全局上限')
    }

    // 检查单个手机号限流
    const singleUserLimitKey = `phone_single_user_limit:${phoneNumber}`
    const singleUserCount = await limiterStorage.increment(
        singleUserLimitKey,
        PHONE_LIMIT_WINDOW,
    )
    if (singleUserCount > PHONE_SINGLE_USER_DAILY_LIMIT) {
        throw new Error('您的手机号今日验证码发送次数已达上限')
    }
    switch (PHONE_CHANNEL) {
        case 'spug': {
            // 目前 Spug 平台只支持中国大陆手机号
            if (!validatePhone(phoneNumber, 'zh-CN')) {
                throw new Error('不支持的国家或地区手机号格式')
            }
            // Spug 平台不用国家或地区代码，所以去除开头的 +86
            phoneNumber = phoneNumber.replace(/^\+86/, '')
            // 请在 Spug 平台中选择下文的短信模板
            // ${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
            const body = JSON.stringify({
                key1: PHONE_SENDER_NAME, // 短信发件人名称
                key2: code, // 验证码
                key3: expiresInMinutes, // 验证码有效时间(分钟)
                targets: phoneNumber,
            })
            const resp = await fetch(`https://push.spug.cc/send/${PHONE_SPUG_TEMPLATE_ID}`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            })
            // {"code": 200, "msg": "请求成功"}
            return resp.json() as Promise<{ code: number, msg: string }>
        }
        default:
            throw new Error(
                '未匹配到短信发送渠道，请切换到其他登录方式或实现短信发送功能',
            )
    }

}
