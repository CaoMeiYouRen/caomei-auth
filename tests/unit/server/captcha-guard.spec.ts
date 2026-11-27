import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireCaptcha } from '@/server/utils/captcha-guard'
import type { CaptchaVerifyResult } from '@/server/utils/captcha-verify'

/**
 * 阶段 17 M2.1 / M2.2 / M2.3：端点验证码门禁的错误码映射。
 *
 * 校验结果通过注入的 verify 提供，错误构造走项目既有 `createLocalizedError`
 * （这里 mock 成带 statusCode / key / data 的可断言对象）。
 */

const mocks = vi.hoisted(() => ({
    createLocalizedError: vi.fn(),
    warn: vi.fn(),
}))

vi.mock('@/server/utils/i18n', () => ({
    createLocalizedError: mocks.createLocalizedError,
}))
vi.mock('@/server/utils/logger', () => ({
    default: { warn: mocks.warn, info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

function makeEvent(headers: Record<string, string>) {
    return {
        node: { req: { headers } },
        headers: new Headers(headers),
    } as never
}

function verifyReturning(result: CaptchaVerifyResult) {
    return vi.fn(async () => result)
}

describe('server/utils/captcha-guard', () => {
    beforeEach(() => {
        mocks.createLocalizedError.mockReset()
        mocks.warn.mockReset()
        mocks.createLocalizedError.mockImplementation(async (_event, options: Record<string, unknown>) => Object.assign(new Error(String(options.key)), options))
    })

    it('未启用验证码时放行', async () => {
        const verify = verifyReturning({ status: 'skipped' })
        await expect(requireCaptcha(makeEvent({}), { verify })).resolves.toBeUndefined()
        expect(verify).toHaveBeenCalledWith({ token: undefined })
        expect(mocks.createLocalizedError).not.toHaveBeenCalled()
    })

    it('校验通过时放行并透传请求头 token', async () => {
        const verify = verifyReturning({ status: 'passed' })
        await expect(requireCaptcha(makeEvent({ 'x-captcha-response': 'token-1' }), { verify })).resolves.toBeUndefined()
        expect(verify).toHaveBeenCalledWith({ token: 'token-1' })
    })

    it('缺 token 返回 400 CAPTCHA_REQUIRED', async () => {
        const verify = verifyReturning({ status: 'missing-token' })
        await expect(requireCaptcha(makeEvent({}), { verify })).rejects.toMatchObject({
            statusCode: 400,
            key: 'errors.security.captchaRequired',
            data: { code: 'CAPTCHA_REQUIRED' },
        })
    })

    it('校验失败返回 400 CAPTCHA_INVALID 并记录告警', async () => {
        const verify = verifyReturning({ status: 'invalid', errors: ['invalid-input-response'] })
        await expect(requireCaptcha(makeEvent({ 'x-captcha-response': 'bad' }), { verify })).rejects.toMatchObject({
            statusCode: 400,
            key: 'errors.security.captchaInvalid',
            data: { code: 'CAPTCHA_INVALID' },
        })
        expect(mocks.warn).toHaveBeenCalledWith('Captcha verification failed', expect.objectContaining({
            errors: ['invalid-input-response'],
        }))
    })

    it('provider 不可用时 fail closed：503 CAPTCHA_UNAVAILABLE', async () => {
        const verify = verifyReturning({ status: 'unavailable', reason: 'http-502' })
        await expect(requireCaptcha(makeEvent({ 'x-captcha-response': 'token' }), { verify })).rejects.toMatchObject({
            statusCode: 503,
            key: 'errors.security.captchaUnavailable',
            data: { code: 'CAPTCHA_UNAVAILABLE' },
        })
        expect(mocks.warn).toHaveBeenCalledWith('Captcha verification unavailable', expect.objectContaining({
            reason: 'http-502',
        }))
    })
})
