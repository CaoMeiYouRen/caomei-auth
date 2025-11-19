import { describe, it, expect } from 'vitest'
import { RATE_LIMIT_KEYS, getRateLimitError } from '@/utils/shared/rate-limit'

describe('utils/shared/rate-limit', () => {
    it('should return correct rate limit keys', () => {
        expect(RATE_LIMIT_KEYS.GLOBAL_PHONE).toBe('phone_global_limit')
        expect(RATE_LIMIT_KEYS.SINGLE_PHONE('1234567890')).toBe('phone_single_user_limit:1234567890')
        expect(RATE_LIMIT_KEYS.GLOBAL_EMAIL).toBe('email_global_limit')
        expect(RATE_LIMIT_KEYS.SINGLE_EMAIL('test@example.com')).toBe('email_single_user_limit:test@example.com')
    })

    it('should return correct rate limit error messages', () => {
        expect(getRateLimitError('global', 'phone')).toBe('今日短信验证码发送次数已达全局上限')
        expect(getRateLimitError('user', 'phone')).toBe('您的手机号今日验证码发送次数已达上限')
        expect(getRateLimitError('global', 'email')).toBe('今日邮箱发送次数已达全局上限')
        expect(getRateLimitError('user', 'email')).toBe('您的邮箱今日发送次数已达上限')
    })
})
