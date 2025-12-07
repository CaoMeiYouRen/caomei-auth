import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

const baseEnv = {
    CAPTCHA_PROVIDER: undefined as ('google-recaptcha' | 'cloudflare-turnstile' | 'hcaptcha' | undefined),
    RECAPTCHA_SITE_KEY: undefined as string | undefined,
    TURNSTILE_SITE_KEY: undefined as string | undefined,
    HCAPTCHA_SITE_KEY: undefined as string | undefined,
}

async function importCaptcha(overrides: Partial<typeof baseEnv> = {}) {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        ...baseEnv,
        ...overrides,
    }))
    return import('@/utils/web/captcha')
}

describe('utils/captcha', () => {
    it('isCaptchaEnabled returns false when provider missing', async () => {
        const captcha = await importCaptcha()
        expect(captcha.isCaptchaEnabled()).toBe(false)
        expect(captcha.getCaptchaProvider()).toBeNull()
        expect(captcha.getCaptchaSiteKey()).toBeNull()
    })

    it('enables provider when site key present', async () => {
        const captcha = await importCaptcha({
            CAPTCHA_PROVIDER: 'google-recaptcha',
            RECAPTCHA_SITE_KEY: 'test-key',
        })
        expect(captcha.isCaptchaEnabled()).toBe(true)
        expect(captcha.getCaptchaProvider()).toBe('google-recaptcha')
        expect(captcha.getCaptchaSiteKey()).toBe('test-key')
        expect(captcha.isCaptchaProviderEnabled('google-recaptcha')).toBe(true)
        expect(captcha.isCaptchaProviderEnabled('hcaptcha')).toBe(false)
    })

    it('returns matching site key for each provider', async () => {
        const captcha = await importCaptcha({
            CAPTCHA_PROVIDER: 'cloudflare-turnstile',
            TURNSTILE_SITE_KEY: 'turn-key',
        })
        expect(captcha.getCaptchaSiteKey()).toBe('turn-key')

        const captchaH = await importCaptcha({
            CAPTCHA_PROVIDER: 'hcaptcha',
            HCAPTCHA_SITE_KEY: 'h-key',
        })
        expect(captchaH.getCaptchaSiteKey()).toBe('h-key')
    })

    it('resolveCaptchaToken throws when instance missing', async () => {
        const captcha = await importCaptcha()
        await expect(captcha.resolveCaptchaToken(ref(null))).rejects.toThrow('验证码实例不存在')
    })

    it('resolveCaptchaToken returns null when optional', async () => {
        const captcha = await importCaptcha()
        await expect(captcha.resolveCaptchaToken(ref(null), true)).resolves.toBeNull()
    })

    it('resolveCaptchaToken executes instance and returns token', async () => {
        const captcha = await importCaptcha()
        const resetMock = vi.fn()
        const executeMock = vi.fn().mockResolvedValue(undefined)
        const captchaRef = ref({
            token: ref('captcha-token'),
            reset: resetMock,
            execute: executeMock,
            loading: ref(false),
        })

        const result = await captcha.resolveCaptchaToken(captchaRef)

        expect(executeMock).toHaveBeenCalled()
        expect(result?.token).toBe('captcha-token')
        expect(result?.instance).toBe(captchaRef.value)
    })

    it('resets instance when execute fails', async () => {
        const captcha = await importCaptcha()
        const resetMock = vi.fn()
        const captchaRef = ref({
            token: ref(''),
            reset: resetMock,
            execute: vi.fn().mockRejectedValue(new Error('boom')),
            loading: ref(false),
        })

        await expect(captcha.resolveCaptchaToken(captchaRef)).rejects.toThrow('boom')
        expect(resetMock).toHaveBeenCalled()
    })

    it('throws when token missing after execution', async () => {
        const captcha = await importCaptcha()
        const captchaRef = ref({
            token: ref(''),
            reset: vi.fn(),
            execute: vi.fn(),
            loading: ref(false),
        })

        await expect(captcha.resolveCaptchaToken(captchaRef)).rejects.toThrow('请先完成验证码验证')
    })
})
