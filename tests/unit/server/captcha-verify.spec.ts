import { describe, expect, it, vi } from 'vitest'
import { verifyCaptchaToken } from '@/server/utils/captcha-verify'

/**
 * 阶段 17 M2.1：服务端验证码校验工具。
 *
 * 全部走注入的 fetch，不触网；覆盖三种 provider、recaptcha 分阈值、
 * provider 失败 / 网络异常 / 非 2xx / 缺 token / 未启用。
 */

function jsonResponse(payload: unknown, init: { ok?: boolean, status?: number } = {}): Response {
    return {
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => payload,
    } as unknown as Response
}

const ENDPOINTS = ['/sign-up/email']
const recaptchaConfig = { provider: 'google-recaptcha' as const, secretKey: 'secret', minScore: 0.5, endpoints: ENDPOINTS }
const turnstileConfig = { provider: 'cloudflare-turnstile' as const, secretKey: 'secret', endpoints: ENDPOINTS }
const hcaptchaConfig = { provider: 'hcaptcha' as const, secretKey: 'secret', endpoints: ENDPOINTS }

describe('server/utils/captcha-verify', () => {
    it('未启用验证码时跳过校验', async () => {
        const fetchImpl = vi.fn()
        await expect(verifyCaptchaToken({ token: 'token', config: null, fetchImpl })).resolves.toEqual({ status: 'skipped' })
        expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('启用但缺 token 时返回 missing-token，且不发请求', async () => {
        const fetchImpl = vi.fn()
        await expect(verifyCaptchaToken({ token: '   ', config: recaptchaConfig, fetchImpl }))
            .resolves.toEqual({ status: 'missing-token' })
        expect(fetchImpl).not.toHaveBeenCalled()
    })

    it.each([
        ['google-recaptcha', recaptchaConfig, 'https://www.google.com/recaptcha/api/siteverify'],
        ['cloudflare-turnstile', turnstileConfig, 'https://challenges.cloudflare.com/turnstile/v0/siteverify'],
        ['hcaptcha', hcaptchaConfig, 'https://hcaptcha.com/siteverify'],
    ] as const)('%s 通过时返回 passed 并打到官方端点', async (_name, config, endpoint) => {
        const fetchImpl = vi.fn(async () => jsonResponse({ success: true, score: 0.9 }))
        await expect(verifyCaptchaToken({ token: 'token', config, fetchImpl })).resolves.toEqual({ status: 'passed' })

        const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
        expect(url).toBe(endpoint)
        expect(init.method).toBe('POST')
        const body = init.body as URLSearchParams
        expect(body.get('secret')).toBe('secret')
        expect(body.get('response')).toBe('token')
    })

    it('provider 判定失败时返回 invalid 并带上 provider 错误码', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ success: false, 'error-codes': ['invalid-input-response'] }))
        await expect(verifyCaptchaToken({ token: 'token', config: turnstileConfig, fetchImpl }))
            .resolves.toEqual({ status: 'invalid', errors: ['invalid-input-response'] })
    })

    it('recaptcha 分数低于阈值时判定失败', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ success: true, score: 0.3 }))
        await expect(verifyCaptchaToken({ token: 'token', config: recaptchaConfig, fetchImpl }))
            .resolves.toEqual({ status: 'invalid', errors: ['score-below-threshold'] })
    })

    it('recaptcha 分数达到阈值时通过', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ success: true, score: 0.5 }))
        await expect(verifyCaptchaToken({ token: 'token', config: recaptchaConfig, fetchImpl }))
            .resolves.toEqual({ status: 'passed' })
    })

    it('provider 返回非 2xx 时 fail closed', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({}, { ok: false, status: 502 }))
        await expect(verifyCaptchaToken({ token: 'token', config: hcaptchaConfig, fetchImpl }))
            .resolves.toEqual({ status: 'unavailable', reason: 'http-502' })
    })

    it('网络异常或超时按不可用处理', async () => {
        const fetchImpl = vi.fn(async () => {
            throw new TypeError('fetch failed')
        })
        await expect(verifyCaptchaToken({ token: 'token', config: hcaptchaConfig, fetchImpl }))
            .resolves.toEqual({ status: 'unavailable', reason: 'fetch failed' })
    })

    it('无法识别的 provider 按不可用处理', async () => {
        const fetchImpl = vi.fn()
        await expect(verifyCaptchaToken({
            token: 'token',
            config: { provider: 'unknown', secretKey: 'secret', endpoints: ENDPOINTS } as unknown as typeof hcaptchaConfig,
            fetchImpl,
        })).resolves.toEqual({ status: 'unavailable', reason: 'unsupported-provider:unknown' })
        expect(fetchImpl).not.toHaveBeenCalled()
    })
})
