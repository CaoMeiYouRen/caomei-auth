import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { runtimeConfig } = vi.hoisted(() => ({
    runtimeConfig: {
        public: {
            baiduAnalyticsId: 'baidu-test',
            googleAnalyticsId: 'G-TEST',
            clarityProjectId: 'clarity-test',
            sentryDsn: 'https://sentry.example/1',
            captchaProvider: 'google-recaptcha',
            recaptchaSiteKey: 'site-key',
        } as Record<string, unknown>,
    },
}))

const defaultConfig = {
    baiduAnalyticsId: 'baidu-test',
    googleAnalyticsId: 'G-TEST',
    clarityProjectId: 'clarity-test',
    sentryDsn: 'https://sentry.example/1',
    captchaProvider: 'google-recaptcha',
    recaptchaSiteKey: 'site-key',
} as const

function resetRuntimeConfig() {
    Object.assign(runtimeConfig.public, defaultConfig)
}

vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return { ...actual, useRuntimeConfig: () => runtimeConfig }
})

afterEach(() => {
    resetRuntimeConfig()
})

const clarityMock = vi.hoisted(() => ({
    init: vi.fn(),
    identify: vi.fn(),
    setTag: vi.fn(),
    event: vi.fn(),
    consent: vi.fn(),
    upgrade: vi.fn(),
}))
vi.mock('@microsoft/clarity', () => ({ default: clarityMock }))

const sentryMock = vi.hoisted(() => ({ init: vi.fn() }))
vi.mock('@sentry/nuxt', () => sentryMock)

const recaptchaUse = vi.hoisted(() => vi.fn())
vi.mock('vue-recaptcha', () => ({ default: { install: recaptchaUse } }))

type PluginLike = { setup?: (app: unknown) => unknown } | ((app: unknown) => unknown)

interface BaiduApi {
    trackPageview: (page?: string) => void
    trackEvent: (category: string, action: string, label?: string, value?: number) => void
    setCustomVar: (index: number, name: string, value: string, scope: number) => void
    isLoaded: () => boolean
}

interface GoogleApi {
    trackPageview: (pageConfig?: Record<string, unknown>) => void
    trackEvent: (eventName: string, parameters?: Record<string, unknown>) => void
    setUserProperties: (properties: Record<string, unknown>) => void
    setConfig: (measurementId: string, configOptions?: Record<string, unknown>) => void
    isLoaded: () => boolean
}

interface ClarityApi {
    identify: (id: string, session?: string, page?: string, name?: string) => void
    setTag: (key: string, value: string | string[]) => void
    event: (name: string) => void
    consent: (consent?: boolean) => void
    upgrade: (reason: string) => void
}

function provideApi<T>(result: unknown, name: string): T {
    const provide = (result as { provide?: Record<string, unknown> } | undefined)?.provide
    return provide?.[name] as T
}

async function runPlugin(modulePath: string, nuxtApp: Record<string, unknown> = {}) {
    const imported = await import(/* @vite-ignore */ modulePath)
    const plugin = imported.default as PluginLike
    const setup = typeof plugin === 'function' ? plugin : plugin.setup
    if (!setup) {
        throw new Error(`插件未导出可执行函数：${modulePath}`)
    }
    return await setup({ vueApp: { use: vi.fn() }, ...nuxtApp }) as { provide?: Record<string, Record<string, (...args: unknown[]) => unknown>> } | undefined
}

describe('plugins/baidu-analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete (window as { _hmt?: unknown })._hmt
    })

    it('注入脚本并提供统计方法', async () => {
        const appendSpy = vi.spyOn(document.head, 'appendChild')
        const result = await runPlugin('@/plugins/baidu-analytics.client')
        const api = provideApi<BaiduApi>(result, 'baiduAnalytics')
        expect(api).toBeTruthy()
        expect(window._hmt).toEqual([])
        const script = appendSpy.mock.calls.map(([node]) => node as HTMLScriptElement).find((node) => node?.src?.includes('hm.baidu.com'))
        expect(script?.src).toContain('baidu-test')
        expect(script?.async).toBe(true)

        api.trackPageview('/login')
        api.trackPageview()
        api.trackEvent('auth', 'login', 'email', 1)
        api.trackEvent('auth', 'login', 'email')
        api.trackEvent('auth', 'login')
        api.setCustomVar(1, 'role', 'admin', 2)
        const beforeInvalid = (window._hmt as unknown[][]).length
        api.setCustomVar(9, 'role', 'admin', 2)
        expect((window._hmt as unknown[][]).length).toBe(beforeInvalid)
        expect(api.isLoaded()).toBe(true)

        expect(window._hmt).toEqual(expect.arrayContaining([['_trackEvent', 'auth', 'login', 'email', 1]]))
        appendSpy.mockRestore()
    })

    it('未配置 ID 时不注入脚本', async () => {
        runtimeConfig.public.baiduAnalyticsId = ''
        const result = await runPlugin('@/plugins/baidu-analytics.client')
        expect(result).toBeUndefined()
        expect(window._hmt).toBeUndefined()
        runtimeConfig.public.baiduAnalyticsId = 'baidu-test'
    })
})

describe('plugins/google-analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete (window as { dataLayer?: unknown }).dataLayer
        delete (window as { gtag?: unknown }).gtag
    })

    it('初始化 gtag 并提供统计方法', async () => {
        const result = await runPlugin('@/plugins/google-analytics.client')
        const api = provideApi<GoogleApi>(result, 'googleAnalytics')
        expect(window.dataLayer).toBeTruthy()
        expect(typeof window.gtag).toBe('function')
        expect(JSON.stringify(window.dataLayer)).toContain('G-TEST')

        api.trackPageview({ page_title: 'home' })
        api.trackEvent('login', { method: 'email' })
        api.setUserProperties({ plan: 'pro' })
        api.setConfig('G-OTHER', { send_page_view: false })
        expect(api.isLoaded()).toBe(true)
    })

    it('未配置 ID 时返回空提供者', async () => {
        runtimeConfig.public.googleAnalyticsId = ''
        const result = await runPlugin('@/plugins/google-analytics.client')
        const api = provideApi<GoogleApi>(result, 'googleAnalytics')
        expect(api.isLoaded()).toBe(false)
        api.trackPageview()
        api.trackEvent('noop')
        api.setUserProperties({})
        api.setConfig('G-X')
        runtimeConfig.public.googleAnalyticsId = 'G-TEST'
    })
})

describe('plugins/clarity', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('初始化并代理官方 API', async () => {
        const result = await runPlugin('@/plugins/clarity.client')
        const api = provideApi<ClarityApi>(result, 'clarity')
        expect(clarityMock.init).toHaveBeenCalledWith('clarity-test')

        api.identify('user-1', 'session-1', 'page-1', 'User')
        api.setTag('role', 'admin')
        api.event('click')
        api.consent(false)
        api.upgrade('checkout')
        expect(clarityMock.identify).toHaveBeenCalled()
        expect(clarityMock.setTag).toHaveBeenCalledWith('role', 'admin')
        expect(clarityMock.event).toHaveBeenCalledWith('click')
        expect(clarityMock.consent).toHaveBeenCalledWith(false)
        expect(clarityMock.upgrade).toHaveBeenCalledWith('checkout')
    })

    it('未配置项目 ID 时不初始化', async () => {
        runtimeConfig.public.clarityProjectId = ''
        const result = await runPlugin('@/plugins/clarity.client')
        expect(result).toBeUndefined()
        expect(clarityMock.init).not.toHaveBeenCalled()
        runtimeConfig.public.clarityProjectId = 'clarity-test'
    })
})

describe('plugins/sentry', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('配置 DSN 时初始化 Sentry', async () => {
        await runPlugin('@/plugins/sentry')
        expect(sentryMock.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: 'https://sentry.example/1' }))
    })

    it('未配置 DSN 时不初始化', async () => {
        runtimeConfig.public.sentryDsn = ''
        await runPlugin('@/plugins/sentry')
        expect(sentryMock.init).not.toHaveBeenCalled()
        runtimeConfig.public.sentryDsn = 'https://sentry.example/1'
    })
})

describe('plugins/recaptcha', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('配置 google-recaptcha 时注册 VueRecaptcha 插件', async () => {
        await runPlugin('@/plugins/recaptcha.client', { vueApp: { use: recaptchaUse } })
        expect(recaptchaUse).toHaveBeenCalledWith(expect.objectContaining({}), { v3SiteKey: 'site-key' })
    })

    it('非 google-recaptcha 时不注册', async () => {
        runtimeConfig.public.captchaProvider = 'hcaptcha'
        await runPlugin('@/plugins/recaptcha.client', { vueApp: { use: recaptchaUse } })
        expect(recaptchaUse).not.toHaveBeenCalled()
    })

    it('缺少 siteKey 时不注册', async () => {
        runtimeConfig.public.recaptchaSiteKey = ''
        await runPlugin('@/plugins/recaptcha.client', { vueApp: { use: recaptchaUse } })
        expect(recaptchaUse).not.toHaveBeenCalled()
    })
})
