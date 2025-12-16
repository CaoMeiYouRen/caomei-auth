import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Captcha from '@/components/captcha.vue'

// Mock useCaptcha
const mockUseCaptcha = {
    enabled: true,
    provider: 'hcaptcha',
    siteKey: 'test-site-key',
    widget: null,
    token: '',
    error: '',
    onVerify: vi.fn(),
    onExpired: vi.fn(),
    onError: vi.fn(),
    onUnsupported: vi.fn(),
    reset: vi.fn(),
    execute: vi.fn(),
    loading: false,
}

vi.mock('@/composables/use-captcha', () => ({
    useCaptcha: () => mockUseCaptcha,
}))

describe('Captcha', () => {
    const global = {
        stubs: {
            VueHcaptcha: {
                template: '<div class="hcaptcha-stub" @verify="$emit(\'verify\')" @expired="$emit(\'expired\')" @error="$emit(\'error\')"></div>',
                props: ['sitekey'],
            },
            VueTurnstile: {
                template: '<div class="turnstile-stub" @expired="$emit(\'expired\')" @error="$emit(\'error\')" @unsupported="$emit(\'unsupported\')"></div>',
                props: ['site-key', 'modelValue'],
            },
        },
    }

    it('renders hcaptcha when provider is hcaptcha', () => {
        mockUseCaptcha.provider = 'hcaptcha'
        const wrapper = mount(Captcha, { global })

        expect(wrapper.find('.hcaptcha-stub').exists()).toBe(true)
        expect(wrapper.find('.turnstile-stub').exists()).toBe(false)
    })

    it('renders turnstile when provider is cloudflare-turnstile', () => {
        mockUseCaptcha.provider = 'cloudflare-turnstile'
        const wrapper = mount(Captcha, { global })

        expect(wrapper.find('.turnstile-stub').exists()).toBe(true)
        expect(wrapper.find('.hcaptcha-stub').exists()).toBe(false)
    })

    it('does not render if not enabled', () => {
        mockUseCaptcha.enabled = false
        const wrapper = mount(Captcha, { global })

        expect(wrapper.find('.captcha-container').exists()).toBe(false)
        mockUseCaptcha.enabled = true // Reset
    })

    it('displays error message', () => {
        mockUseCaptcha.error = 'Test Error'
        const wrapper = mount(Captcha, { global })

        expect(wrapper.text()).toContain('Test Error')
        mockUseCaptcha.error = '' // Reset
    })

    it('exposes methods', () => {
        const wrapper = mount(Captcha, { global })
        expect(wrapper.vm.reset).toBeDefined()
        expect(wrapper.vm.execute).toBeDefined()
    })
})
