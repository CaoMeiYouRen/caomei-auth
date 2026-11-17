import { describe, expect, it } from 'vitest'
import { PRE_REGISTERED_LOCALES } from 'caomei-ui'
import { DEFAULT_LOCALE, ENABLED_LOCALES } from '@/i18n/config/locale-registry'
import { toCaomeiLocale } from '@/composables/utils/use-caomei-locale'

describe('use-caomei-locale', () => {
    it('maps every enabled locale to a pre-registered caomei locale', () => {
        for (const locale of ENABLED_LOCALES) {
            const mapped = toCaomeiLocale(locale.code)
            /* 未预注册的语种会在运行期静默回退到 zh-CN，必须在单测阶段拦住 */
            expect(PRE_REGISTERED_LOCALES).toContain(mapped)
        }
    })

    it('maps the two enabled locales', () => {
        expect(toCaomeiLocale('zh-CN')).toBe('zh-CN')
        expect(toCaomeiLocale('en-US')).toBe('en-US')
    })

    it('accepts better-auth boundary aliases', () => {
        expect(toCaomeiLocale('en')).toBe('en-US')
        expect(toCaomeiLocale('zh-Hans')).toBe('zh-CN')
        expect(toCaomeiLocale('zh-Hant')).toBe('zh-CN')
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
