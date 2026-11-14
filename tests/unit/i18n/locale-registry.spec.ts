import { describe, expect, it } from 'vitest'
import {
    DEFAULT_LOCALE,
    LOCALE_COOKIE_KEY,
    LOCALE_REGISTRY,
    getLocaleDefinition,
    matchDetectedLocale,
    normalizeDetectedLocale,
    stripLocalePrefix,
} from '@/i18n/config/locale-registry'
import { getLocaleMessageFilePaths } from '@/i18n/config/locale-modules'

describe('i18n/config/locale-registry', () => {
    it('exposes two locales with a single default', () => {
        expect(LOCALE_REGISTRY.map((locale) => locale.code)).toEqual(['zh-CN', 'en-US'])
        expect(LOCALE_REGISTRY.filter((locale) => locale.default)).toHaveLength(1)
        expect(DEFAULT_LOCALE).toBe('zh-CN')
        expect(LOCALE_COOKIE_KEY).toBe('i18n_locale')
    })

    it('keeps route prefixes consistent with prefix_except_default', () => {
        expect(getLocaleDefinition('zh-CN')?.routePrefix).toBe('')
        expect(getLocaleDefinition('en-US')?.routePrefix).toBe('/en-US')
    })

    it('declares message files for every locale', () => {
        for (const locale of LOCALE_REGISTRY) {
            expect(locale.files.length).toBeGreaterThan(0)
            expect(locale.files.every((file) => file.startsWith(`${locale.code}/`))).toBe(true)
            /* Registry 的文件清单由模块表派生，防止两处各写一份 */
            expect(locale.files).toEqual(getLocaleMessageFilePaths(locale.code))
        }
    })

    it('falls back to the default locale for unknown input', () => {
        expect(normalizeDetectedLocale('')).toBe(DEFAULT_LOCALE)
        expect(normalizeDetectedLocale(null)).toBe(DEFAULT_LOCALE)
        expect(normalizeDetectedLocale('fr-FR')).toBe(DEFAULT_LOCALE)
    })

    it('distinguishes unsupported locales from the default locale', () => {
        expect(matchDetectedLocale('en-US')).toBe('en-US')
        expect(matchDetectedLocale('zh-Hans')).toBe('zh-CN')
        expect(matchDetectedLocale('fr-FR')).toBeUndefined()
        expect(matchDetectedLocale('')).toBeUndefined()
    })

    it('maps better-auth locales at the boundary', () => {
        expect(normalizeDetectedLocale('zh-Hans')).toBe('zh-CN')
        expect(normalizeDetectedLocale('zh-Hant')).toBe('zh-CN')
        expect(normalizeDetectedLocale('default')).toBe('zh-CN')
        expect(normalizeDetectedLocale('en')).toBe('en-US')
        expect(normalizeDetectedLocale('en-US')).toBe('en-US')
        expect(normalizeDetectedLocale('zh-cn')).toBe('zh-CN')
    })

    it('ignores inherited object properties when mapping aliases', () => {
        expect(matchDetectedLocale('toString')).toBeUndefined()
        expect(matchDetectedLocale('constructor')).toBeUndefined()
        expect(normalizeDetectedLocale('toString')).toBe(DEFAULT_LOCALE)
    })

    it('strips locale prefixes for route guards', () => {
        expect(stripLocalePrefix('/en-US/login')).toBe('/login')
        expect(stripLocalePrefix('/en-US')).toBe('/')
        expect(stripLocalePrefix('/login')).toBe('/login')
        expect(stripLocalePrefix('/en-USfoo')).toBe('/en-USfoo')
    })
})
