import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useDemoMode, useDemoModeGuard, useDemoBanner } from '../../../composables/use-demo-mode'

// Hoist the mock state so it can be used in mockNuxtImport
const { mockState } = vi.hoisted(() => ({
    mockState: {
        demoMode: false,
    },
}))

// Mock useRuntimeConfig
mockNuxtImport('useRuntimeConfig', () => () => ({
    public: {
        get demoMode() {
            return mockState.demoMode
        },
    },
}))

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

describe('useDemoModeGuard', () => {
    beforeEach(() => {
        mockState.demoMode = false
        vi.clearAllMocks()
    })

    it('should return false (not blocked) when demo mode is disabled', () => {
        mockState.demoMode = false
        const { checkDemoMode, showDemoDialog } = useDemoModeGuard()
        const result = checkDemoMode()
        expect(result).toBe(false)
        expect(showDemoDialog.value).toBe(false)
    })

    it('should return true (blocked) and show dialog when demo mode is enabled', () => {
        mockState.demoMode = true
        const { checkDemoMode, showDemoDialog, demoMessage } = useDemoModeGuard()
        const result = checkDemoMode('test message')
        expect(result).toBe(true)
        expect(showDemoDialog.value).toBe(true)
        expect(demoMessage.value).toBe('test message')
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
