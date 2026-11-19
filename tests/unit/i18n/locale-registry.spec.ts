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
        expect(ENABLED_LOCALE_CODES).toEqual(['zh-CN', 'en-US', 'zh-TW', 'ja-JP', 'ko-KR'])
        expect(ENABLED_LOCALES.every((locale) => locale.enabled)).toBe(true)
        expect(LOCALE_REGISTRY.filter((locale) => locale.default)).toHaveLength(1)
        expect(DEFAULT_LOCALE).toBe('zh-CN')
        expect(LOCALE_COOKIE_KEY).toBe('i18n_locale')
    })

    it('ships ja-JP and ko-KR as ui-ready: switchable, reachable, not indexable', () => {
        for (const code of ['ja-JP', 'ko-KR'] as const) {
            const locale = getLocaleDefinition(code)
            expect(locale?.enabled).toBe(true)
            expect(locale?.readiness).toBe('ui-ready')
            expect(locale?.switchable).toBe(true)
            expect(locale?.indexable).toBe(false)
        }
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
        /* ja-JP 启用后按自身语言协商 */
        expect(matchDetectedLocale('ja-JP')).toBe('ja-JP')
        expect(matchDetectedLocale('ja')).toBe('ja-JP')
        /* ko-KR 启用后按自身语言协商 */
        expect(matchDetectedLocale('ko-KR')).toBe('ko-KR')
        expect(matchDetectedLocale('ko')).toBe('ko-KR')
        /* 已登记但未启用的语言按“不支持”处理 */
        expect(matchDetectedLocale('es-ES')).toBeUndefined()
        /* zh-TW 启用后，繁体（含 zh-Hant 别名）协商到 zh-TW */
        expect(matchDetectedLocale('zh-TW')).toBe('zh-TW')
        expect(matchDetectedLocale('zh-Hant')).toBe('zh-TW')
        expect(matchDetectedLocale('')).toBeUndefined()
    })

    it('only matches enabled locales and falls back for disabled ones', () => {
        expect(normalizeDetectedLocale('ja-JP')).toBe('ja-JP')
        expect(normalizeDetectedLocale('zh-Hant')).toBe('zh-TW')
        expect(normalizeDetectedLocale('ko-KR')).toBe('ko-KR')
        /* 未启用语言回退默认语言 */
        expect(normalizeDetectedLocale('es-ES')).toBe(DEFAULT_LOCALE)
    })

    it('maps better-auth locales at the boundary', () => {
        expect(normalizeDetectedLocale('zh-Hans')).toBe('zh-CN')
        /* better-auth 的 zh-Hant 在认证边界落到已启用的 zh-TW */
        expect(normalizeDetectedLocale('zh-Hant')).toBe('zh-TW')
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
        expect(stripLocalePrefix('/zh-TW/login')).toBe('/login')
        expect(stripLocalePrefix('/zh-TW')).toBe('/')
        expect(stripLocalePrefix('/login')).toBe('/login')
        expect(stripLocalePrefix('/en-USfoo')).toBe('/en-USfoo')
        expect(stripLocalePrefix('/ja-JP/login')).toBe('/login')
        expect(stripLocalePrefix('/ja-JP')).toBe('/')
        expect(stripLocalePrefix('/ko-KR/login')).toBe('/login')
        expect(stripLocalePrefix('/ko-KR')).toBe('/')
        /* 停用语言没有路由，不剥离前缀 */
        expect(stripLocalePrefix('/es-ES/login')).toBe('/es-ES/login')
    })
})
