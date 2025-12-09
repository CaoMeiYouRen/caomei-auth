import logger from '../logger'
import { resolveSmsProvider } from './providers'
import { limiterStorage } from '@/server/database/storage'
import {
    PHONE_DAILY_LIMIT,
    PHONE_SINGLE_USER_DAILY_LIMIT,
    PHONE_LIMIT_WINDOW,
    PHONE_CHANNEL,
    PHONE_EXPIRES_IN,
} from '@/utils/shared/env'
import { RATE_LIMIT_KEYS, getRateLimitError } from '@/utils/shared/rate-limit'

type LimiterStorage = typeof limiterStorage
type PhoneLogger = typeof logger

let limiter: LimiterStorage = limiterStorage
let phoneLogger: PhoneLogger = logger
let smsProviderFactory = resolveSmsProvider

export function injectSmsDeps(deps: {
    limiter?: LimiterStorage
    logger?: PhoneLogger
    resolveProvider?: typeof resolveSmsProvider
} = {}) {
    if (deps.limiter) {
        limiter = deps.limiter
    }
    if (deps.logger) {
        phoneLogger = deps.logger
    }
    if (deps.resolveProvider) {
        smsProviderFactory = deps.resolveProvider
    }
}

export function resetSmsDeps() {
    limiter = limiterStorage
    phoneLogger = logger
    smsProviderFactory = resolveSmsProvider
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
    const smsProvider = smsProviderFactory(PHONE_CHANNEL)

    // 验证手机号格式
    if (!smsProvider.validatePhoneNumber(phoneNumber)) {
        throw new Error('不支持的国家或地区手机号格式')
    }

    // 检查全局限流
    const globalCount = await limiter.increment(
        RATE_LIMIT_KEYS.GLOBAL_PHONE,
        PHONE_LIMIT_WINDOW,
    )
    if (globalCount > PHONE_DAILY_LIMIT) {
        phoneLogger.phone.rateLimited({ limitType: 'global', remainingTime: PHONE_DAILY_LIMIT })
        throw new Error(getRateLimitError('global', 'phone'))
    }

    // 检查单个手机号限流
    const singleUserLimitKey = RATE_LIMIT_KEYS.SINGLE_PHONE(phoneNumber)
    const singleUserCount = await limiter.increment(
        singleUserLimitKey,
        PHONE_LIMIT_WINDOW,
    )
    if (singleUserCount > PHONE_SINGLE_USER_DAILY_LIMIT) {
        phoneLogger.phone.rateLimited({ phone: phoneNumber, limitType: 'user', remainingTime: PHONE_DAILY_LIMIT })
        throw new Error(getRateLimitError('user', 'phone'))
    }

    try {
        // 发送短信
        const result = await smsProvider.sendOtp(phoneNumber, code, expiresInMinutes)

        // 记录成功日志
        phoneLogger.phone.sent({
            type: 'verification',
            phone: phoneNumber,
            success: true,
            sid: result.sid,
            channel: PHONE_CHANNEL.toLowerCase(),
            // 传递 Twilio 特有字段（如果存在）
            status: result.status,
            direction: result.direction,
            numSegments: result.numSegments,
            price: result.price,
            priceUnit: result.priceUnit,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
        })

        return result
    } catch (error) {
        // 记录失败日志
        phoneLogger.phone.failed({
            type: 'verification',
            phone: phoneNumber,
            error: error instanceof Error ? error.message : String(error),
            channel: PHONE_CHANNEL.toLowerCase(),
        })
        throw error
    }
}
