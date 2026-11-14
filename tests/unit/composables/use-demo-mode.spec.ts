import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDemoMode, useDemoBanner } from '../../../composables/use-demo-mode'

// Hoist the mock state so it can be used in the mock
const { mockState } = vi.hoisted(() => ({
    mockState: {
        demoMode: false,
    },
}))

// Mock useRuntimeConfig
vi.mock('#app/nuxt', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app/nuxt')>()
    return {
        ...actual,
        useRuntimeConfig: () => ({
            public: {
                get demoMode() {
                    return mockState.demoMode
                },
            },
        }),
    }
})

describe('useDemoMode', () => {
    beforeEach(() => {
    // Reset state before each test
        mockState.demoMode = false
        vi.clearAllMocks()
    })

    it('should return false when demo mode is disabled', () => {
        mockState.demoMode = false
        const { isDemoMode } = useDemoMode()
        expect(isDemoMode.value).toBe(false)
    })

    it('should return true when demo mode is enabled', () => {
        mockState.demoMode = true
        const { isDemoMode } = useDemoMode()
        expect(isDemoMode.value).toBe(true)
    })
})

describe('useDemoBanner', () => {
    beforeEach(() => {
        mockState.demoMode = false
        vi.clearAllMocks()
    })

    it('should not show banner when demo mode is disabled', () => {
        mockState.demoMode = false
        const { showBanner } = useDemoBanner()
        expect(showBanner.value).toBe(false)
    })

    it('should show banner when demo mode is enabled', () => {
        mockState.demoMode = true
        const { showBanner } = useDemoBanner()
        expect(showBanner.value).toBe(true)
    })

    it('should hide banner when closed', () => {
        mockState.demoMode = true
        const { showBanner, closeBanner } = useDemoBanner()
        expect(showBanner.value).toBe(true)

        closeBanner()
        expect(showBanner.value).toBe(false)
    })
})
