import type { captcha } from 'better-auth/plugins'
import {
    CAPTCHA_PROVIDER,
    RECAPTCHA_SECRET_KEY,
    RECAPTCHA_MIN_SCORE,
    TURNSTILE_SECRET_KEY,
    HCAPTCHA_SECRET_KEY,
    HCAPTCHA_SITE_KEY,
} from '@/utils/env'

// 定义验证码配置类型
type CaptchaConfig = Parameters<typeof captcha>[0]

/**
 * 获取验证码配置
 * 根据环境变量动态配置验证码提供商
 * @returns 验证码配置对象或 null（如果未配置）
 */
export function getCaptchaConfig(): CaptchaConfig | null {
    // 如果没有设置验证码提供商，返回 null
    if (!CAPTCHA_PROVIDER) {
        return null
    }

    // 基础配置
    const baseConfig = {
        // 验证码保护的端点列表
        endpoints: [
            '/sign-up/email', // 通过邮箱注册
            // '/sign-in/email', // 通过邮箱登录
            '/forget-password', // 忘记密码
            '/send-verification-email', // 发送验证邮件
            '/email-otp/send-verification-otp', // 发送邮箱验证码
            '/forget-password/email-otp', // 通过邮箱验证码重置密码
            '/phone-number/send-otp', // 发送手机验证码
            '/phone-number/forget-password', // 通过手机验证码重置密码
            '/phone-number/request-password-reset', // 通过手机请求密码重置
            '/two-factor/send-otp', // 发送两步验证验证码
        ],
    }

    switch (CAPTCHA_PROVIDER) {
        case 'google-recaptcha':
            if (!RECAPTCHA_SECRET_KEY) {
                console.warn('RECAPTCHA_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            return {
                provider: 'google-recaptcha',
                secretKey: RECAPTCHA_SECRET_KEY,
                minScore: RECAPTCHA_MIN_SCORE,
                ...baseConfig,
            } as CaptchaConfig

        case 'cloudflare-turnstile':
            if (!TURNSTILE_SECRET_KEY) {
                console.warn('TURNSTILE_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            return {
                provider: 'cloudflare-turnstile',
                secretKey: TURNSTILE_SECRET_KEY,
                ...baseConfig,
            } as CaptchaConfig

        case 'hcaptcha':
            if (!HCAPTCHA_SECRET_KEY) {
                console.warn('HCAPTCHA_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            return {
                provider: 'hcaptcha',
                secretKey: HCAPTCHA_SECRET_KEY,
                siteKey: HCAPTCHA_SITE_KEY, // hCaptcha 可选的 siteKey 配置
                ...baseConfig,
            } as CaptchaConfig

        default:
            console.warn(`不支持的验证码提供商: ${CAPTCHA_PROVIDER}`)
            return null
    }
}

