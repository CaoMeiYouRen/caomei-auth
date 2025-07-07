import ms from 'ms'
import { limiterStorage } from '@/server/database/storage'

// 定义短信验证码的每日发送上限
const PHONE_DAILY_LIMIT = Number(process.env.PHONE_DAILY_LIMIT || 100)

const PHONE_LIMIT_KEY = 'phone_global_limit'

/**
 *  TODO：实现通过短信发送OTP验证码
 *  发送短信验证码
 *
 * @author CaoMeiYouRen
 * @date 2025-06-26
 * @export
 * @param phoneNumber
 * @param code
 */
export async function sendPhoneOtp(phoneNumber: string, code: string) {
    console.info(`Sending OTP ${code} to phone number ${phoneNumber}`)
    // 检查限流
    const count = await limiterStorage.increment(PHONE_LIMIT_KEY, ms('1d') / 1000)
    if (count > PHONE_DAILY_LIMIT) {
        throw new Error('今日短信验证码发送次数已达上限')
    }
    throw new Error(
        '未实现短信发送功能，请切换到其他登录方式或实现短信发送功能',
    )
}
