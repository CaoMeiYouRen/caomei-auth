import { captcha } from 'better-auth/plugins'
import logger from './logger'
import {
    CAPTCHA_PROVIDER,
    RECAPTCHA_SECRET_KEY,
    RECAPTCHA_MIN_SCORE,
    RECAPTCHA_SITE_KEY,
    TURNSTILE_SECRET_KEY,
    TURNSTILE_SITE_KEY,
    HCAPTCHA_SECRET_KEY,
    HCAPTCHA_SITE_KEY,
} from '@/utils/shared/env'

type CaptchaPluginOptions = Parameters<typeof captcha>[0]

/**
 * 本项目支持的验证码配置（阶段 17 D59）。
 *
 * 上游 `captcha()` 的入参是包含 `vercel-bot-id` 等其它 provider 的联合类型；
 * 这里收窄为项目实际支持的三种，便于服务端校验（`secretKey` / `minScore`）直接取值，
 * 不必在调用点反复做非空断言或结构判断。
 */
export type SupportedCaptchaConfig =
    | { provider: 'google-recaptcha', secretKey: string, minScore?: number, endpoints: string[] }
    | { provider: 'cloudflare-turnstile', secretKey: string, endpoints: string[] }
    | { provider: 'hcaptcha', secretKey: string, siteKey?: string, endpoints: string[] }

/**
 * 配置告警去重：同一进程内同一问题只提示一次。
 *
 * `getCaptchaConfig()` 会在每次创建 better-auth 实例时求值，重复告警会淹没启动日志；
 * 用键去重后仍能保证「配置错误至少被看到一次」（阶段 17 D59）。
 */
const warnedConfigIssues = new Set<string>()

function warnOnce(key: string, message: string) {
    if (warnedConfigIssues.has(key)) {
        return
    }
    warnedConfigIssues.add(key)
    logger.warn(message)
}

/**
 * 前端是否可能渲染验证码组件：只与公开 site key 有关。
 *
 * 服务端判定与前端判定不一致时，两种组合都会造成用户侧不可用：
 * - 有 secret、缺 site key：服务端要求 token，前端不渲染 → 注册 / 发送验证码一律 400；
 * - 有 site key、缺 secret：前端渲染，服务端视为未启用 → 验证码形同装饰。
 * 因此这里在服务端启动求值时点名缺失项，服务端判定保持权威（前端异步改造不在本阶段）。
 */
function warnIfFrontendMismatch(provider: 'google-recaptcha' | 'cloudflare-turnstile' | 'hcaptcha', siteKey?: string) {
    if (siteKey) {
        return
    }
    warnOnce(
        `captcha-site-key-missing:${provider}`,
        `${provider} 已配置 secret 但缺少对应的公开 site key，前端不会渲染验证码，启用验证码的端点将拒绝请求；请同时配置 site key 或清空 provider 以关闭验证码`,
    )
}

/**
 * 获取验证码配置
 * 根据环境变量动态配置验证码提供商
 * @returns 验证码配置对象或 null（如果未配置）
 */
export function getCaptchaConfig(): SupportedCaptchaConfig | null {
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
                warnOnce('captcha-secret-missing:google-recaptcha', 'RECAPTCHA_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            warnIfFrontendMismatch('google-recaptcha', RECAPTCHA_SITE_KEY)
            return {
                provider: 'google-recaptcha',
                secretKey: RECAPTCHA_SECRET_KEY,
                minScore: RECAPTCHA_MIN_SCORE,
                ...baseConfig,
            }

        case 'cloudflare-turnstile':
            if (!TURNSTILE_SECRET_KEY) {
                warnOnce('captcha-secret-missing:cloudflare-turnstile', 'TURNSTILE_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            warnIfFrontendMismatch('cloudflare-turnstile', TURNSTILE_SITE_KEY)
            return {
                provider: 'cloudflare-turnstile',
                secretKey: TURNSTILE_SECRET_KEY,
                ...baseConfig,
            }

        case 'hcaptcha':
            if (!HCAPTCHA_SECRET_KEY) {
                warnOnce('captcha-secret-missing:hcaptcha', 'HCAPTCHA_SECRET_KEY 未设置，验证码功能将被禁用')
                return null
            }
            warnIfFrontendMismatch('hcaptcha', HCAPTCHA_SITE_KEY)
            return {
                provider: 'hcaptcha',
                secretKey: HCAPTCHA_SECRET_KEY,
                siteKey: HCAPTCHA_SITE_KEY, // hCaptcha 可选的 siteKey 配置
                ...baseConfig,
            }

        default:
            warnOnce(`captcha-provider-unsupported:${String(CAPTCHA_PROVIDER)}`, `不支持的验证码提供商: ${String(CAPTCHA_PROVIDER)}`)
            return null
    }
}

/**
 * 解析要挂载的验证码插件（阶段 17 D59）。
 *
 * 唯一判定点是 `getCaptchaConfig()`：返回 `null`（provider 缺失、secret 缺失或不支持的
 * provider）时返回空数组，插件不挂载；否则按完整配置挂载。
 *
 * 之所以独立成函数：`lib/auth.ts` 的实例装配依赖数据库与 Nitro 求值顺序，直接为它写单测
 * 成本很高；把「挂载 / 不挂载」的决策抽出来后，配置矩阵可以独立断言。
 */
export function resolveCaptchaPlugins(): ReturnType<typeof captcha>[] {
    const config = getCaptchaConfig()
    /* 收窄类型与上游插件入参一一对应，这里只需一次结构兼容断言 */
    return config ? [captcha(config as CaptchaPluginOptions)] : []
}
