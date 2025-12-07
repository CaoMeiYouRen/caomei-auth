import { describe, expect, it, vi } from 'vitest'

const baseEnv = {
    CAPTCHA_PROVIDER: undefined as string | undefined,
    RECAPTCHA_SECRET_KEY: undefined as string | undefined,
    RECAPTCHA_MIN_SCORE: 0.5,
    TURNSTILE_SECRET_KEY: undefined as string | undefined,
    HCAPTCHA_SECRET_KEY: undefined as string | undefined,
    HCAPTCHA_SITE_KEY: undefined as string | undefined,
}

async function importModule(envOverrides: Partial<typeof baseEnv>) {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        ...baseEnv,
        ...envOverrides,
    }))
    return await import('@/server/utils/captcha-config')
}

describe('server/utils/captcha-config', () => {
    it('returns null when no provider is configured', async () => {
        const module = await importModule({ CAPTCHA_PROVIDER: undefined })
        expect(module.getCaptchaConfig()).toBeNull()
    })

    it('creates google recaptcha configuration with full metadata', async () => {
        const module = await importModule({
            CAPTCHA_PROVIDER: 'google-recaptcha',
            RECAPTCHA_SECRET_KEY: 'secret',
            RECAPTCHA_MIN_SCORE: 0.9,
        })

        const config = module.getCaptchaConfig()
        expect(config).toMatchObject({
            provider: 'google-recaptcha',
            secretKey: 'secret',
            minScore: 0.9,
        })
        expect(config?.endpoints).toContain('/sign-up/email')
        expect(config?.endpoints?.length).toBeGreaterThan(3)
    })

    it('returns null and no configuration when required secrets are missing', async () => {
        const googleModule = await importModule({ CAPTCHA_PROVIDER: 'google-recaptcha' })
        expect(googleModule.getCaptchaConfig()).toBeNull()

        const turnstileModule = await importModule({ CAPTCHA_PROVIDER: 'cloudflare-turnstile' })
        expect(turnstileModule.getCaptchaConfig()).toBeNull()

        const hcaptchaModule = await importModule({ CAPTCHA_PROVIDER: 'hcaptcha' })
        expect(hcaptchaModule.getCaptchaConfig()).toBeNull()
    })

    it('builds turnstile and hcaptcha configs when credentials exist', async () => {
        const turnstileModule = await importModule({
            CAPTCHA_PROVIDER: 'cloudflare-turnstile',
            TURNSTILE_SECRET_KEY: 'turn-secret',
        })
        expect(turnstileModule.getCaptchaConfig()).toMatchObject({
            provider: 'cloudflare-turnstile',
            secretKey: 'turn-secret',
        })

        const hcaptchaModule = await importModule({
            CAPTCHA_PROVIDER: 'hcaptcha',
            HCAPTCHA_SECRET_KEY: 'h-secret',
            HCAPTCHA_SITE_KEY: 'site-key',
        })
        expect(hcaptchaModule.getCaptchaConfig()).toMatchObject({
            provider: 'hcaptcha',
            secretKey: 'h-secret',
            siteKey: 'site-key',
        })
    })

    it('returns null for unsupported providers', async () => {
        const module = await importModule({ CAPTCHA_PROVIDER: 'unknown' as any })
        expect(module.getCaptchaConfig()).toBeNull()
    })
})
