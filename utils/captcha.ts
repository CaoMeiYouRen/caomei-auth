import {
    CAPTCHA_PROVIDER,
    RECAPTCHA_SITE_KEY,
    TURNSTILE_SITE_KEY,
    HCAPTCHA_SITE_KEY,
} from '@/utils/env'

/**
 * 检查验证码是否启用（前端版本）
 * 通过检查验证码提供商和对应的公开密钥来判断
 * @returns 是否启用验证码
 */
export function isCaptchaEnabled(): boolean {
    // 如果没有设置验证码提供商，则未启用
    if (!CAPTCHA_PROVIDER) {
        return false
    }

    // 根据不同的验证码提供商检查对应的公开密钥
    switch (CAPTCHA_PROVIDER) {
        case 'google-recaptcha':
            return Boolean(RECAPTCHA_SITE_KEY)

        case 'cloudflare-turnstile':
            return Boolean(TURNSTILE_SITE_KEY)

        case 'hcaptcha':
            return Boolean(HCAPTCHA_SITE_KEY)

        default:
            return false
    }
}

/**
 * 获取当前验证码提供商
 * @returns 验证码提供商类型或 null
 */
export function getCaptchaProvider(): 'google-recaptcha' | 'cloudflare-turnstile' | 'hcaptcha' | null {
    if (!isCaptchaEnabled()) {
        return null
    }
    return CAPTCHA_PROVIDER || null
}

/**
 * 获取当前验证码提供商的公开密钥
 * @returns 公开密钥或 null
 */
export function getCaptchaSiteKey(): string | null {
    if (!isCaptchaEnabled()) {
        return null
    }

    switch (CAPTCHA_PROVIDER) {
        case 'google-recaptcha':
            return RECAPTCHA_SITE_KEY || null

        case 'cloudflare-turnstile':
            return TURNSTILE_SITE_KEY || null

        case 'hcaptcha':
            return HCAPTCHA_SITE_KEY || null

        default:
            return null
    }
}

/**
 * 检查指定的验证码提供商是否被启用
 * @param provider 验证码提供商
 * @returns 指定提供商是否启用
 */
export function isCaptchaProviderEnabled(provider: 'google-recaptcha' | 'cloudflare-turnstile' | 'hcaptcha'): boolean {
    return CAPTCHA_PROVIDER === provider && isCaptchaEnabled()
}
