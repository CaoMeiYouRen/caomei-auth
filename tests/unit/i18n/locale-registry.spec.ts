import { describe, expect, it } from 'vitest'
import {
    DEFAULT_LOCALE,
    ENABLED_LOCALE_CODES,
    ENABLED_LOCALES,
    LOCALE_CODES,
    LOCALE_COOKIE_KEY,
    LOCALE_REGISTRY,
    getLocaleDefinition,
    matchDetectedLocale,
    normalizeDetectedLocale,
    stripLocalePrefix,
} from '@/i18n/config/locale-registry'
import { getLocaleMessageFilePaths } from '@/i18n/config/locale-modules'

describe('i18n/config/locale-registry', () => {
    it('defines the ten target locales and only enables the current batch', () => {
        expect(LOCALE_CODES).toHaveLength(10)
        expect(LOCALE_REGISTRY.map((locale) => locale.code)).toEqual([...LOCALE_CODES])
        expect(ENABLED_LOCALE_CODES).toEqual(['zh-CN', 'en-US'])
        expect(ENABLED_LOCALES.every((locale) => locale.enabled)).toBe(true)
        expect(LOCALE_REGISTRY.filter((locale) => locale.default)).toHaveLength(1)
        expect(DEFAULT_LOCALE).toBe('zh-CN')
        expect(LOCALE_COOKIE_KEY).toBe('i18n_locale')
    })

    it('keeps disabled locales unswitchable and unindexable', () => {
        for (const locale of LOCALE_REGISTRY.filter((item) => !item.enabled)) {
            expect(locale.switchable).toBe(false)
            expect(locale.indexable).toBe(false)
            expect(locale.readiness).toBe('draft')
        }
    })

    it('keeps route prefixes consistent with prefix_except_default', () => {
        expect(getLocaleDefinition('zh-CN')?.routePrefix).toBe('')
        expect(getLocaleDefinition('en-US')?.routePrefix).toBe('/en-US')
        expect(getLocaleDefinition('ja-JP')?.routePrefix).toBe('/ja-JP')
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

    it('distinguishes unsupported or disabled locales from the default locale', () => {
        expect(matchDetectedLocale('en-US')).toBe('en-US')
        expect(matchDetectedLocale('zh-Hans')).toBe('zh-CN')
        expect(matchDetectedLocale('fr-FR')).toBeUndefined()
        /* 已登记但未启用的语言按“不支持”处理 */
        expect(matchDetectedLocale('ja-JP')).toBeUndefined()
        /* zh-TW 未启用时繁体按简体协商，避免 Accept-Language 落到英文 */
        expect(matchDetectedLocale('zh-Hant')).toBe('zh-CN')
        expect(matchDetectedLocale('')).toBeUndefined()
    })

    it('only matches enabled locales and falls back for disabled ones', () => {
        expect(normalizeDetectedLocale('ja-JP')).toBe(DEFAULT_LOCALE)
        expect(normalizeDetectedLocale('zh-Hant')).toBe(DEFAULT_LOCALE)
    })

    it('maps better-auth locales at the boundary', () => {
        expect(normalizeDetectedLocale('zh-Hans')).toBe('zh-CN')
        /* zh-TW 未启用时 zh-Hant 回退默认语言；启用后由 M5 切换为 zh-TW */
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
        /* 停用语言没有路由，不剥离前缀 */
        expect(stripLocalePrefix('/ja-JP/login')).toBe('/ja-JP/login')
    })
})
