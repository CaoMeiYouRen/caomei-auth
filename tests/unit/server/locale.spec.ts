import { describe, it, expect } from 'vitest'
import { DEFAULT_LOCALE, normalizeLocale, parseAcceptLanguage } from '@/server/utils/locale'

describe('server/utils/locale', () => {
    describe('normalizeLocale', () => {
        it('returns direct matches when locale already supported', () => {
            expect(normalizeLocale('pt-BR')).toBe('pt-BR')
        })

        it('trims whitespace and lowercases before mapping', () => {
            expect(normalizeLocale('  zh-cn  ')).toBe('zh-Hans')
        })

        it('maps known variants via lookup table', () => {
            expect(normalizeLocale('fr-CA')).toBe('fr-FR')
            expect(normalizeLocale('es-CL')).toBe('es-ES')
        })

        it('falls back to prefix match when mapping misses', () => {
            expect(normalizeLocale('pt-br')).toBe('pt-BR')
        })

        it('returns default locale when nothing matches', () => {
            expect(normalizeLocale('xx-YY')).toBe(DEFAULT_LOCALE)
        })
    })

    describe('parseAcceptLanguage', () => {
        it('orders locales by q value while normalizing', () => {
            const result = parseAcceptLanguage('en-US,en;q=0.8,zh-CN;q=0.9')
            expect(result).toEqual(['default', 'zh-Hans'])
        })

        it('appends default locale when header lacks it', () => {
            const result = parseAcceptLanguage('es-AR;q=0.7')
            expect(result).toEqual(['es-ES', DEFAULT_LOCALE])
        })

        it('returns default locale when header missing', () => {
            expect(parseAcceptLanguage('')).toEqual([DEFAULT_LOCALE])
        })
    })
})
