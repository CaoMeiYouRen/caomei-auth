import type { H3Event } from 'h3'
import { verifyCaptchaToken } from './captcha-verify'
import { createLocalizedError } from './i18n'
import logger from './logger'

/** 前端回传验证码 token 的请求头（与 better-auth captcha 插件一致） */
export const CAPTCHA_RESPONSE_HEADER = 'x-captcha-response'

/**
 * 读取 token。直接读 Node 请求头而不是 `getHeader()`：单测里的最小 event 可能没有
 * `node.req`，`getHeader()` 会抛 TypeError；这里缺失即视为未携带（fail closed）。
 */
function readCaptchaToken(event: H3Event): string | undefined {
    const headers = event.node?.req?.headers as Record<string, string | string[] | undefined> | undefined
    const raw = headers?.[CAPTCHA_RESPONSE_HEADER]
    if (Array.isArray(raw)) {
        return raw[0]
    }
    return typeof raw === 'string' ? raw : undefined
}

export interface RequireCaptchaOptions {
    /** 覆盖校验实现，便于端点单测 */
    verify?: typeof verifyCaptchaToken
}

/**
 * 自定义包装端点的验证码门禁（阶段 17 D60 / D61）。
 *
 * 未启用验证码时直接放行（`skipped`）。启用时：
 * - 缺 token → `400 CAPTCHA_REQUIRED`
 * - 校验失败 → `400 CAPTCHA_INVALID`
 * - provider 不可用 → `503 CAPTCHA_UNAVAILABLE`（fail closed，不静默放行）
 *
 * 只在启用时读取请求头：未配置部署不会因为缺少该头被拒。
 */
export async function requireCaptcha(event: H3Event, options: RequireCaptchaOptions = {}): Promise<void> {
    const verify = options.verify ?? verifyCaptchaToken
    const token = readCaptchaToken(event)
    const result = await verify({ token })

    switch (result.status) {
        case 'skipped':
        case 'passed':
            return
        case 'missing-token':
            throw await createLocalizedError(event, {
                statusCode: 400,
                key: 'errors.security.captchaRequired',
                data: { code: 'CAPTCHA_REQUIRED' },
            })
        case 'invalid':
            logger.warn('Captcha verification failed', { errors: result.errors })
            throw await createLocalizedError(event, {
                statusCode: 400,
                key: 'errors.security.captchaInvalid',
                data: { code: 'CAPTCHA_INVALID' },
            })
        case 'unavailable':
            logger.warn('Captcha verification unavailable', { reason: result.reason })
            throw await createLocalizedError(event, {
                statusCode: 503,
                key: 'errors.security.captchaUnavailable',
                data: { code: 'CAPTCHA_UNAVAILABLE' },
            })
    }
}
