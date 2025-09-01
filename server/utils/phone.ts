import twilio from 'twilio'
import logger from './logger'
import { limiterStorage } from '@/server/database/storage'
import { validatePhone } from '@/utils/validate'
import {
    PHONE_DAILY_LIMIT,
    PHONE_SINGLE_USER_DAILY_LIMIT,
    PHONE_LIMIT_WINDOW,
    PHONE_CHANNEL,
    SPUG_TEMPLATE_ID,
    PHONE_SENDER_NAME,
    PHONE_EXPIRES_IN,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
} from '@/utils/env'

const PHONE_LIMIT_KEY = 'phone_global_limit'

/**
 * 短信发送结果
 */
export interface SmsResult {
    success: boolean
    message: string
    sid?: string
    code?: number
}

/**
 * 短信发送渠道接口
 */
export interface SmsProvider {
    /**
     * 发送短信验证码
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @param expiresInMinutes 过期时间（分钟）
     * @returns 发送结果
     */
    sendOtp(phoneNumber: string, code: string, expiresInMinutes: number): Promise<SmsResult>

    /**
     * 验证手机号格式
     * @param phoneNumber 手机号码
     * @returns 是否有效
     */
    validatePhoneNumber(phoneNumber: string): boolean
}

/**
 * Spug 短信平台实现
 */
class SpugSmsProvider implements SmsProvider {
    validatePhoneNumber(phoneNumber: string): boolean {
        // Spug 平台只支持中国大陆手机号
        return validatePhone(phoneNumber, 'zh-CN')
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
        const result = await resp.json() as { code: number, msg: string }

        if (result.code === 200) {
            return {
                success: true,
                message: result.msg,
                code: result.code,
            }
        }
        throw new Error(`短信发送失败: ${result.msg}`)
    }
}

/**
 * Twilio 短信平台实现
 */
class TwilioSmsProvider implements SmsProvider {
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
        }
    }
}

/**
 * 获取短信发送渠道实例
 * @param channel 渠道名称
 * @returns 短信发送实例
 */
function getSmsProvider(channel: string): SmsProvider {
    switch (channel.toLowerCase()) {
        case 'spug':
            return new SpugSmsProvider()
        case 'twilio':
            return new TwilioSmsProvider()
        default:
            throw new Error(`未知的短信发送渠道: ${channel}`)
    }
}

/**
 * 支持多种短信渠道：Spug、Twilio
 * 发送短信验证码
 *
 * @author CaoMeiYouRen
 * @date 2025-06-26
 * @export
 * @param phoneNumber 手机号码
 * @param code 验证码
 * @param expiresIn 验证码有效时间，单位秒，默认 300 秒 (5 分钟)
 * @throws {Error} 如果超过了全局或单个手机号的发送限制，或发送失败
 */
export async function sendPhoneOtp(phoneNumber: string, code: string, expiresIn = PHONE_EXPIRES_IN) {
    const expiresInMinutes = Math.floor(expiresIn / 60)

    // 检查是否配置了短信渠道
    if (!PHONE_CHANNEL) {
        throw new Error('未匹配到短信发送渠道，请切换到其他登录方式或实现短信发送功能')
    }

    // 获取短信发送实例
    const smsProvider = getSmsProvider(PHONE_CHANNEL)

    // 验证手机号格式
    if (!smsProvider.validatePhoneNumber(phoneNumber)) {
        throw new Error('不支持的国家或地区手机号格式')
    }

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

    try {
        // 发送短信
        const result = await smsProvider.sendOtp(phoneNumber, code, expiresInMinutes)

        // 记录成功日志
        logger.phone.sent({
            type: 'verification',
            phone: phoneNumber,
            success: true,
            sid: result.sid,
        })

        return result
    } catch (error) {
        // 记录失败日志
        logger.phone.failed({
            type: 'verification',
            phone: phoneNumber,
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    }
}
