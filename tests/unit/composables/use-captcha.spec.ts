import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCaptcha, useCaptchaEnabled } from '@/composables/use-captcha'

vi.mock('@/composables/utils/use-i18n-text', () => import('@/tests/mocks/i18n-text'))
// Mock Nuxt composables
const runtimeConfig = vi.hoisted(() => ({
    public: {
        captchaProvider: 'google-recaptcha' as string | undefined,
        recaptchaSiteKey: 'test-key' as string | undefined,
        turnstileSiteKey: undefined as string | undefined,
        hcaptchaSiteKey: undefined as string | undefined,
    },
}))

vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return {
        ...actual,
        useRuntimeConfig: () => runtimeConfig,
    }
})

vi.mock('vue-recaptcha', () => ({
    useChallengeV3: vi.fn(() => ({
        execute: vi.fn(() => Promise.resolve('test-token')),
    })),
}))

describe('useCaptcha', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        runtimeConfig.public.captchaProvider = 'google-recaptcha'
        runtimeConfig.public.recaptchaSiteKey = 'test-key'
    })

    it('initializes with correct provider', () => {
        const { enabled, siteKey, provider } = useCaptcha()
        expect(enabled.value).toBe(true)
        expect(siteKey.value).toBe('test-key')
        expect(provider.value).toBe('google-recaptcha')
    })

    it('executes captcha successfully', async () => {
        const { execute, token, error } = useCaptcha()

        await execute()

        expect(token.value).toBe('test-token')
        expect(error.value).toBe(null)
    })

    it('handles unsupported browser', () => {
        const { onUnsupported, error, token } = useCaptcha()

        onUnsupported()

        expect(token.value).toBe('')
        expect(error.value).toContain('不支持验证码')
    })
})

describe('useCaptchaEnabled', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        runtimeConfig.public.captchaProvider = 'google-recaptcha'
        runtimeConfig.public.recaptchaSiteKey = 'test-key'
    })

    it('reads enabled state from runtime config', () => {
        expect(useCaptchaEnabled().value).toBe(true)
    })

    it('is disabled when provider is missing', () => {
        runtimeConfig.public.captchaProvider = undefined
        expect(useCaptchaEnabled().value).toBe(false)
    })

    it('is disabled when the provider site key is missing', () => {
        runtimeConfig.public.recaptchaSiteKey = undefined
        expect(useCaptchaEnabled().value).toBe(false)
    })
})
