import twilio from 'twilio'
import logger from './logger'
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
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
} from '@/utils/env'


const PHONE_LIMIT_KEY = 'phone_global_limit'

/**
 *  支持多种短信渠道：Spug、Twilio
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
        logger.phone.rateLimited({ limitType: 'global', remainingTime: PHONE_DAILY_LIMIT })
        throw new Error('今日短信验证码发送次数已达全局上限')
    }

    // 检查单个手机号限流
    const singleUserLimitKey = `phone_single_user_limit:${phoneNumber}`
    const singleUserCount = await limiterStorage.increment(
        singleUserLimitKey,
        PHONE_LIMIT_WINDOW,
    )
    if (singleUserCount > PHONE_SINGLE_USER_DAILY_LIMIT) {
        logger.phone.rateLimited({ phone: phoneNumber, limitType: 'user', remainingTime: PHONE_DAILY_LIMIT })
        throw new Error('您的手机号今日验证码发送次数已达上限')
    }
    switch (PHONE_CHANNEL) {
        case 'spug': {
            try {
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
                const result = await resp.json() as { code: number, msg: string }

                if (result.code === 200) {
                    logger.phone.sent({ type: 'verification', phone: phoneNumber, success: true })
                } else {
                    logger.phone.failed({ type: 'verification', phone: phoneNumber, error: result.msg })
                    throw new Error(`短信发送失败: ${result.msg}`)
                }

                return result
            } catch (error) {
                logger.phone.failed({
                    type: 'verification',
                    phone: phoneNumber,
                    error: error instanceof Error ? error.message : String(error),
                })
                throw error
            }
        }
        case 'twilio': {
            try {

                if (!validatePhone(phoneNumber)) {
                    throw new Error('不支持的国家或地区手机号格式')
                }

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

                const result = {
                    success: true,
                    sid: message.sid,
                    message: '短信发送成功',
                }

                logger.phone.sent({
                    type: 'verification',
                    phone: phoneNumber,
                    success: true,
                    sid: message.sid,
                })

                return result
            } catch (error) {
                logger.phone.failed({
                    type: 'verification',
                    phone: phoneNumber,
                    error: error instanceof Error ? error.message : String(error),
                })
                throw new Error(`Twilio 短信发送失败: ${error instanceof Error ? error.message : '未知错误'}`)
            }
        }
        default:
            throw new Error(
                '未匹配到短信发送渠道，请切换到其他登录方式或实现短信发送功能',
            )
    }

}
