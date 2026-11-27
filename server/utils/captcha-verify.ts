import { getCaptchaConfig, type SupportedCaptchaConfig } from './captcha-config'

/**
 * 验证码服务端校验（阶段 17 D60 / D61）。
 *
 * 背景：`/api/security/change-email` 与 `/api/security/two-factor/send-otp` 是自定义包装端点，
 * 不在 better-auth captcha 插件的 `endpoints` 列表内，`x-captcha-response` 只有前端门禁。
 *
 * 口径：
 * - 未启用验证码（`getCaptchaConfig()` 为 `null`）→ `skipped`，端点行为与改造前一致；
 * - 启用但缺 token → `missing-token`；
 * - provider 判定失败（`success=false`，recaptcha 还需 `score >= minScore`）→ `invalid`；
 * - provider 不可达 / 超时 / 非 2xx / 响应不可解析 → `unavailable`（fail closed，不静默放行）。
 *
 * 不发送 `remoteip`：三家的该参数都是可选的，本项目没有可信代理配置口径，
 * 转发未经校验的 `x-forwarded-for` 只会引入新的伪造面（来源 IP 契约见阶段 17 M3）。
 */

export type CaptchaVerifyConfig = SupportedCaptchaConfig

export type CaptchaVerifyResult =
    | { status: 'skipped' }
    | { status: 'passed' }
    | { status: 'missing-token' }
    | { status: 'invalid', errors: string[] }
    | { status: 'unavailable', reason: string }

/** 各 provider 的校验端点（与 better-auth 插件使用的官方地址一致） */
const VERIFY_ENDPOINTS: Record<string, string> = {
    'google-recaptcha': 'https://www.google.com/recaptcha/api/siteverify',
    'cloudflare-turnstile': 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    hcaptcha: 'https://hcaptcha.com/siteverify',
}

export interface VerifyCaptchaOptions {
    token?: string | null
    /** 显式配置；不传时读取 `getCaptchaConfig()`（便于测试注入） */
    config?: CaptchaVerifyConfig | null
    /** 注入 fetch（默认使用全局 fetch，便于测试替换） */
    fetchImpl?: typeof fetch
    /** 请求超时上限，默认 5 秒：验证码不应拖垮发送类端点 */
    timeoutMs?: number
}

interface ProviderVerifyPayload {
    success?: boolean
    score?: number
    'error-codes'?: string[]
}

function resolveConfig(explicit: VerifyCaptchaOptions['config']): CaptchaVerifyConfig | null {
    if (explicit !== undefined) {
        return explicit
    }
    return getCaptchaConfig()
}

/**
 * 校验前端回传的验证码 token。
 *
 * 纯函数式：所有外部依赖（配置、fetch、超时）都可注入，便于单测覆盖四种 provider 结果。
 */
export async function verifyCaptchaToken(options: VerifyCaptchaOptions = {}): Promise<CaptchaVerifyResult> {
    const config = resolveConfig(options.config)
    if (!config) {
        return { status: 'skipped' }
    }

    const token = options.token?.trim()
    if (!token) {
        return { status: 'missing-token' }
    }

    const endpoint = VERIFY_ENDPOINTS[config.provider]
    if (!endpoint) {
        return { status: 'unavailable', reason: `unsupported-provider:${String(config.provider)}` }
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch
    const timeoutMs = options.timeoutMs ?? 5000
    if (typeof fetchImpl !== 'function') {
        return { status: 'unavailable', reason: 'fetch-unavailable' }
    }

    try {
        const response = await fetchImpl(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ secret: config.secretKey, response: token }),
            signal: AbortSignal.timeout(timeoutMs),
        })
        if (!response.ok) {
            return { status: 'unavailable', reason: `http-${response.status}` }
        }
        const payload = await response.json() as ProviderVerifyPayload
        if (!payload.success) {
            return { status: 'invalid', errors: payload['error-codes'] ?? [] }
        }
        /* recaptcha v3 以 score 表达置信度；其余 provider 只有 success */
        if (config.provider === 'google-recaptcha'
            && typeof config.minScore === 'number'
            && typeof payload.score === 'number'
            && payload.score < config.minScore) {
            return { status: 'invalid', errors: ['score-below-threshold'] }
        }
        return { status: 'passed' }
    } catch (error) {
        return {
            status: 'unavailable',
            reason: error instanceof Error ? error.message : 'unknown-error',
        }
    }
}
