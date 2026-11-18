import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, ENABLED_LOCALES } from '@/i18n/config/locale-registry'
import { toCaomeiLocale } from '@/composables/utils/use-caomei-locale'

describe('use-caomei-locale', () => {
    it('maps every enabled locale to the same caomei locale', () => {
        for (const locale of ENABLED_LOCALES) {
            /* 未预注册的语种由 plugins/caomei-locale 在 provider 挂载前注册（见该插件单测） */
            expect(toCaomeiLocale(locale.code)).toBe(locale.code)
        }
    })

    it('maps the enabled locales', () => {
        expect(toCaomeiLocale('zh-CN')).toBe('zh-CN')
        expect(toCaomeiLocale('en-US')).toBe('en-US')
        expect(toCaomeiLocale('zh-TW')).toBe('zh-TW')
    })

    it('accepts better-auth boundary aliases', () => {
        expect(toCaomeiLocale('en')).toBe('en-US')
        expect(toCaomeiLocale('zh-Hans')).toBe('zh-CN')
        expect(toCaomeiLocale('zh-Hant')).toBe('zh-TW')
        expect(toCaomeiLocale('default')).toBe(DEFAULT_LOCALE)
    })

    it('falls back to the default locale for unknown or empty input', () => {
        expect(toCaomeiLocale('ja-JP')).toBe(DEFAULT_LOCALE)
        expect(toCaomeiLocale('')).toBe(DEFAULT_LOCALE)
        expect(toCaomeiLocale(null)).toBe(DEFAULT_LOCALE)
        expect(toCaomeiLocale(undefined)).toBe(DEFAULT_LOCALE)
    })

    it('ignores inherited object properties', () => {
        expect(toCaomeiLocale('toString')).toBe(DEFAULT_LOCALE)
    })
})
