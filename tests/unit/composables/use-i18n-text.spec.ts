import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useI18nText } from '@/composables/utils/use-i18n-text'

const useNuxtAppMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useNuxtApp', () => useNuxtAppMock)

function setup(composer: unknown) {
    useNuxtAppMock.mockReturnValue({ $i18n: composer })
}

describe('useI18nText', () => {
    it('translates through the global composer with named params', () => {
        setup({
            t: (key: string, named?: Record<string, unknown>) => `${key}:${JSON.stringify(named ?? {})}`,
        })

        const t = useI18nText()

        expect(t('auth.login.socialLoggingIn', { name: 'GitHub' })).toBe('auth.login.socialLoggingIn:{"name":"GitHub"}')
    })

    it('falls back to the key when the message is missing', () => {
        setup({ t: (key: string) => key })

        expect(useI18nText()('auth.missing.key')).toBe('auth.missing.key')
    })

    it('swallows composer errors and returns the key', () => {
        setup({
            t: () => {
                throw new Error('boom')
            },
        })

        expect(useI18nText()('auth.login.enterCode')).toBe('auth.login.enterCode')
    })

    it('returns the key when the composer is unavailable', () => {
        setup(undefined)

        expect(useI18nText()('auth.common.sendFailed')).toBe('auth.common.sendFailed')
    })

    it('returns the key when `useNuxtApp` throws outside a Nuxt context', () => {
        useNuxtAppMock.mockImplementation(() => {
            throw new Error('no nuxt app')
        })

        expect(useI18nText()('auth.common.sendFailed')).toBe('auth.common.sendFailed')
    })
})
