import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    getDefaultRegionByLocation,
    saveRegionPreference,
    detectPossibleRegions,
    detectInputType,
    getInputSuggestion,
    formatAccountForVerification,
    validateFormattedAccount,
} from '@/utils/shared/smart-input'

interface BrowserOptions {
    storedRegion?: string | null
    language?: string
}

function withBrowserContext(options: BrowserOptions = {}) {
    const storage = {
        getItem: vi.fn().mockReturnValue(options.storedRegion ?? null),
        setItem: vi.fn(),
    }
    const stub = {
        localStorage: storage,
        navigator: {
            language: options.language ?? 'en-US',
        },
    }
    ;(globalThis as any).window = stub
    ;(globalThis as any).localStorage = storage
    ;(globalThis as any).navigator = stub.navigator
    return { storage }
}

const originalWindow = 'window' in globalThis ? (globalThis as any).window : undefined
const originalNavigator = 'navigator' in globalThis ? (globalThis as any).navigator : undefined

beforeEach(() => {
    vi.restoreAllMocks()
})

afterEach(() => {
    if (originalWindow) {
        ;(globalThis as any).window = originalWindow
    } else {
        delete (globalThis as any).window
    }

    if (originalNavigator) {
        ;(globalThis as any).navigator = originalNavigator
    } else {
        delete (globalThis as any).navigator
    }

    delete (globalThis as any).localStorage
})

describe('utils/smart-input', () => {
    it('returns CN when running without browser context', () => {
        delete (globalThis as any).window
        delete (globalThis as any).navigator
        expect(getDefaultRegionByLocation()).toBe('CN')
    })

    it('prefers stored region in localStorage', () => {
        const { storage } = withBrowserContext({ storedRegion: 'JP' })
        expect(getDefaultRegionByLocation()).toBe('JP')
        expect(storage.getItem).toHaveBeenCalledWith('caomei-auth-preferred-region')
    })

    it('falls back to language based mapping', () => {
        withBrowserContext({ storedRegion: undefined, language: 'zh-TW' })
        expect(getDefaultRegionByLocation()).toBe('TW')
    })

    it('persists region preference', () => {
        const { storage } = withBrowserContext()
        saveRegionPreference('US')
        expect(storage.setItem).toHaveBeenCalledWith('caomei-auth-preferred-region', 'US')
    })

    it('detectPossibleRegions recognises popular patterns', () => {
        const cn = detectPossibleRegions('13812345678')
        expect(cn[0]).toMatchObject({ region: 'CN', countryCode: 86 })

        const us = detectPossibleRegions('12025550123')
        expect(us.some((item) => item.region === 'US')).toBe(true)
    })

    it('detectInputType distinguishes email and phone', () => {
        expect(detectInputType('user@example.com')).toBe('email')
        expect(detectInputType('+12025550123')).toBe('phone')
        expect(detectInputType('')).toBe('unknown')
    })

    it('getInputSuggestion returns guidance for recognised inputs', () => {
        expect(getInputSuggestion('user@example.com')).toMatchObject({ type: 'email', needConfirm: false })
        expect(getInputSuggestion('+12025550123')).toMatchObject({ type: 'phone', needConfirm: false })
        const unknown = getInputSuggestion('12345')
        expect(unknown.type).toBe('unknown')
        expect(unknown.suggestion).toContain('不足')
    })

    it('formats email accounts and normalises case', () => {
        expect(formatAccountForVerification('User@Example.com')).toBe('user@example.com')
    })

    it('returns international number verbatim', () => {
        expect(formatAccountForVerification('+12025550123')).toBe('+12025550123')
    })

    it('formats local number with provided region', () => {
        expect(formatAccountForVerification('13812345678', 'CN')).toBe('+8613812345678')
    })

    it('uses default region when optional region missing', () => {
        withBrowserContext({ storedRegion: 'US' })
        expect(formatAccountForVerification('12025550123')).toBe('+12025550123')
    })

    it('throws descriptive error when formatting fails', () => {
        withBrowserContext({ storedRegion: 'XX' })
        expect(() => formatAccountForVerification('12025550123')).toThrow('无法确定手机号格式，请选择国家/地区')
    })

    it('validates formatted accounts', () => {
        expect(validateFormattedAccount('user@example.com')).toBe(true)
        expect(validateFormattedAccount('+12025550123')).toBe(true)
        expect(validateFormattedAccount('not-valid')).toBe(false)
    })
})
