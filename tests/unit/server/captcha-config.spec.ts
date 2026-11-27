import { beforeEach, describe, expect, it, vi } from 'vitest'

const baseEnv = {
    CAPTCHA_PROVIDER: undefined as string | undefined,
    RECAPTCHA_SECRET_KEY: undefined as string | undefined,
    RECAPTCHA_MIN_SCORE: 0.5,
    RECAPTCHA_SITE_KEY: undefined as string | undefined,
    TURNSTILE_SECRET_KEY: undefined as string | undefined,
    TURNSTILE_SITE_KEY: undefined as string | undefined,
    HCAPTCHA_SECRET_KEY: undefined as string | undefined,
    HCAPTCHA_SITE_KEY: undefined as string | undefined,
}

const warn = vi.hoisted(() => vi.fn())

async function importModule(envOverrides: Partial<typeof baseEnv>) {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        ...baseEnv,
        ...envOverrides,
    }))
    vi.doMock('@/server/utils/logger', () => ({
        default: { warn, info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    }))
    return await import('@/server/utils/captcha-config')
}

/** 取告警调用里的全部文案，便于按关键字断言而不锁定整句 */
function warnMessages(): string[] {
    return warn.mock.calls.map((call) => String(call[0]))
}

describe('server/utils/captcha-config', () => {
    beforeEach(() => {
        warn.mockClear()
    })

    it('returns null when no provider is configured', async () => {
        const module = await importModule({ CAPTCHA_PROVIDER: undefined })
        expect(module.getCaptchaConfig()).toBeNull()
        expect(warnMessages()).toEqual([])
    })

    it('creates google recaptcha configuration with full metadata', async () => {
        const module = await importModule({
            CAPTCHA_PROVIDER: 'google-recaptcha',
            RECAPTCHA_SECRET_KEY: 'secret',
            RECAPTCHA_SITE_KEY: 'site',
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
        expect(warnMessages()).toEqual([])
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
            TURNSTILE_SITE_KEY: 'turn-site',
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
        expect(warnMessages().some((message) => message.includes('不支持的验证码提供商'))).toBe(true)
    })

    it('只告警一次：同一配置问题重复求值不刷屏', async () => {
        const module = await importModule({
            CAPTCHA_PROVIDER: 'google-recaptcha',
            RECAPTCHA_SECRET_KEY: 'secret',
            RECAPTCHA_SITE_KEY: 'site',
        })

        module.getCaptchaConfig()
        module.getCaptchaConfig()
        module.getCaptchaConfig()

        expect(warn).not.toHaveBeenCalled()
    })
})

/**
 * 阶段 17 M1.2：配置矩阵。四种组合下「是否挂载插件」必须由服务端配置决定，
 * 且前端判定与服务端判定不一致时留下点名缺失项的告警。
 */
describe('server/utils/captcha-config 挂载矩阵', () => {
    beforeEach(() => {
        warn.mockClear()
    })

    it('provider 缺失：不挂载且不告警', async () => {
        const module = await importModule({})
        expect(module.resolveCaptchaPlugins()).toEqual([])
        expect(warnMessages()).toEqual([])
    })

    it('仅有 provider、缺 secret：不挂载（回归：曾以非空断言挂载并在请求期 500）', async () => {
        const module = await importModule({ CAPTCHA_PROVIDER: 'google-recaptcha', RECAPTCHA_SITE_KEY: 'site' })
        expect(module.resolveCaptchaPlugins()).toEqual([])
        expect(warnMessages().some((message) => message.includes('RECAPTCHA_SECRET_KEY'))).toBe(true)
    })

    it('有 secret、缺 site key：挂载（服务端权威）并告警点名 site key', async () => {
        const module = await importModule({ CAPTCHA_PROVIDER: 'google-recaptcha', RECAPTCHA_SECRET_KEY: 'secret' })
        expect(module.resolveCaptchaPlugins()).toHaveLength(1)
        expect(warnMessages().some((message) => message.includes('site key'))).toBe(true)
    })

    it('provider + secret + site key 齐备：挂载且不告警', async () => {
        const module = await importModule({
            CAPTCHA_PROVIDER: 'cloudflare-turnstile',
            TURNSTILE_SECRET_KEY: 'turn-secret',
            TURNSTILE_SITE_KEY: 'turn-site',
        })
        const plugins = module.resolveCaptchaPlugins()
        expect(plugins).toHaveLength(1)
        expect(warnMessages()).toEqual([])
    })
})
