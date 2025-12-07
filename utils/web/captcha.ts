import { type Ref, isRef } from 'vue'
import {
    CAPTCHA_PROVIDER,
    RECAPTCHA_SITE_KEY,
    TURNSTILE_SITE_KEY,
    HCAPTCHA_SITE_KEY,
} from '@/utils/shared/env'

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

export interface CaptchaExpose {
    token: Ref<string> | string
    reset: () => void
    execute?: () => Promise<void> | void
    loading: Ref<boolean> | boolean
}

export interface ResolvedCaptchaToken {
    token: string
    instance: CaptchaExpose
}

/**
 * 解析验证码实例并返回 token
 * @throws Error 当验证码未完成或执行失败时
 */
export async function resolveCaptchaToken(
    captchaRef: Ref<CaptchaExpose | null>,
    isOptional = false,
): Promise<ResolvedCaptchaToken | null> {
    const captchaInstance = captchaRef?.value

    if (!captchaInstance) {
        if (isOptional) {
            return null
        }
        throw new Error('验证码实例不存在，请先完成验证码验证')
    }

    try {
        if (typeof captchaInstance.execute === 'function') {
            await Promise.resolve(captchaInstance.execute())
        }
    } catch (error) {
        captchaInstance.reset()
        throw error instanceof Error ? error : new Error('验证码执行失败，请重试')
    }

    const token = isRef(captchaInstance.token) ? captchaInstance.token.value : captchaInstance.token

    if (!token) {
        throw new Error('请先完成验证码验证')
    }

    return {
        token,
        instance: captchaInstance,
    }
}
