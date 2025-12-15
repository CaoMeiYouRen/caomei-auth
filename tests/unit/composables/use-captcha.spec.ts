import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useCaptcha } from '@/composables/use-captcha'

// Mock Nuxt composables
mockNuxtImport('useRuntimeConfig', () => () => ({
    public: {
        captchaProvider: 'google-recaptcha',
        recaptchaSiteKey: 'test-key',
    },
}))

vi.mock('vue-recaptcha', () => ({
    useChallengeV3: vi.fn(() => ({
        execute: vi.fn(() => Promise.resolve('test-token')),
    })),
}))

describe('useCaptcha', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
