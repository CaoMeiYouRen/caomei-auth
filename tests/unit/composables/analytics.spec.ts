import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useGoogleAnalytics } from '@/composables/use-google-analytics'
import { useBaiduAnalytics } from '@/composables/use-baidu-analytics'
import { useClarity } from '@/composables/use-clarity'

// Mock dependencies
const { mockClarityPlugin, mockRuntimeConfig } = vi.hoisted(() => {
    const clarityPlugin = {
        identify: vi.fn(),
        setTag: vi.fn(),
        event: vi.fn(),
        upgrade: vi.fn(),
        consent: vi.fn(),
    }

    const runtimeConfig = {
        public: {
            googleAnalyticsId: 'G-TEST',
        },
    }
    return { mockClarityPlugin: clarityPlugin, mockRuntimeConfig: runtimeConfig }
})

mockNuxtImport('useNuxtApp', () => () => ({
    $clarity: mockClarityPlugin,
}))

mockNuxtImport('useRuntimeConfig', () => () => mockRuntimeConfig)

describe('composables/analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset window mocks
        ;(window as any).gtag = vi.fn()
        ;(window as any).dataLayer = []
        ;(window as any)._hmt = []
    })

    describe('useGoogleAnalytics', () => {
        it('should track pageview', () => {
            const { trackPageview } = useGoogleAnalytics()
            trackPageview({ page_title: 'Test Page' })
            expect((window as any).gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_title: 'Test Page' })
        })

        it('should track event', () => {
            const { trackEvent } = useGoogleAnalytics()
            trackEvent('login', { method: 'email' })
            expect((window as any).gtag).toHaveBeenCalledWith('event', 'login', { method: 'email' })
        })

        it('should set user properties', () => {
            const { setUserProperties } = useGoogleAnalytics()
            setUserProperties({ user_type: 'premium' })
            expect((window as any).gtag).toHaveBeenCalledWith('set', { user_type: 'premium' })
        })
    })

    describe('useBaiduAnalytics', () => {
        it('should track pageview', () => {
            const { trackPageview } = useBaiduAnalytics()
            trackPageview('/test-page')
            expect((window as any)._hmt).toContainEqual(['_trackPageview', '/test-page'])
        })

        it('should track event', () => {
            const { trackEvent } = useBaiduAnalytics()
            trackEvent('category', 'action', 'label', 1)
            expect((window as any)._hmt).toContainEqual(['_trackEvent', 'category', 'action', 'label', 1])
        })

        it('should set custom var', () => {
            const { setCustomVar } = useBaiduAnalytics()
            setCustomVar(1, 'name', 'value', 1)
            expect((window as any)._hmt).toContainEqual(['_setCustomVar', 1, 'name', 'value', 1])
        })
    })

    describe('useClarity', () => {
        it('should identify user', () => {
            const { identify } = useClarity()
            identify('user-123', 'session-123', 'page-123', 'User Name')
            expect(mockClarityPlugin.identify).toHaveBeenCalledWith('user-123', 'session-123', 'page-123', 'User Name')
        })

        it('should set tag', () => {
            const { setTag } = useClarity()
            setTag('key', 'value')
            expect(mockClarityPlugin.setTag).toHaveBeenCalledWith('key', 'value')
        })

        it('should track event', () => {
            const { event } = useClarity()
            event('click_button')
            expect(mockClarityPlugin.event).toHaveBeenCalledWith('click_button')
        })

        it('should upgrade', () => {
            const { upgrade } = useClarity()
            upgrade('reason')
            expect(mockClarityPlugin.upgrade).toHaveBeenCalledWith('reason')
        })

        it('should set consent', () => {
            const { consent } = useClarity()
            consent()
            expect(mockClarityPlugin.consent).toHaveBeenCalled()
        })
    })
})
