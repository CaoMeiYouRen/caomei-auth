import type { H3Event } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createLocalizedError,
    getRequestLocale,
    getServerI18n,
    isLocalizedApiPath,
    setLocaleResponseHeaders,
} from '@/server/utils/i18n'

function createResponseEvent() {
    const headers = new Map<string, string | string[]>()
    const event = {
        path: '/api/oauth/revoke-consent',
        context: {},
        node: {
            res: {
                setHeader(key: string, value: string | string[]) {
                    headers.set(key, value)
                },
                getHeader(key: string) {
                    return headers.get(key)
                },
            },
        },
    } as unknown as H3Event
    return { event, headers }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('server/utils/i18n', () => {
    it('recognizes auth-related API paths after normalization', () => {
        expect(isLocalizedApiPath('/api/auth/session')).toBe(true)
        expect(isLocalizedApiPath('/api/oauth/consents')).toBe(true)
        expect(isLocalizedApiPath('/api/sso/providers/available')).toBe(true)
        expect(isLocalizedApiPath('/api/social/providers')).toBe(true)
        expect(isLocalizedApiPath('/api/admin/logs')).toBe(false)
        expect(isLocalizedApiPath('/api/auth/../admin/logs')).toBe(false)
    })

    it('detects the request locale from query, cookie and headers in order', () => {
        vi.stubGlobal('tryQueryLocale', vi.fn(() => 'en-US'))
        expect(getRequestLocale({} as H3Event)).toBe('en-US')

        vi.stubGlobal('tryQueryLocale', vi.fn(() => null))
        vi.stubGlobal('tryCookieLocale', vi.fn((_event: H3Event, options: { name?: string }) => (
            options.name === 'i18n_locale' ? 'zh-CN' : null
        )))
        expect(getRequestLocale({} as H3Event)).toBe('zh-CN')

        vi.stubGlobal('tryCookieLocale', vi.fn(() => null))
        vi.stubGlobal('tryHeaderLocale', vi.fn(() => 'en-US'))
        expect(getRequestLocale({} as H3Event)).toBe('en-US')
    })

    it('falls back to the default locale when detection is unavailable', () => {
        expect(getRequestLocale({} as H3Event)).toBe('zh-CN')
    })

    it('sets Content-Language and merges Vary without duplicates', () => {
        const { event, headers } = createResponseEvent()
        headers.set('Vary', 'Origin')

        setLocaleResponseHeaders(event, 'en-US')
        setLocaleResponseHeaders(event, 'en-US')

        expect(headers.get('Content-Language')).toBe('en-US')
        expect(headers.get('Vary')).toBe('Origin, Accept-Language, Cookie')
    })

    it('keeps a wildcard Vary header unchanged', () => {
        const { event, headers } = createResponseEvent()
        headers.set('Vary', '*')

        setLocaleResponseHeaders(event, 'en-US')

        expect(headers.get('Content-Language')).toBe('en-US')
        expect(headers.get('Vary')).toBe('*')
    })

    it('uses the server translator and caches it per event', async () => {
        const { event, headers } = createResponseEvent()
        const useTranslationMock = vi.fn(async () =>
            (key: string) => (key === 'errors.auth.loginRequired' ? 'Please sign in first' : key),
        )
        vi.stubGlobal('useTranslation', useTranslationMock)
        vi.stubGlobal('tryHeaderLocale', vi.fn(() => 'en-US'))

        const first = await getServerI18n(event)
        const second = await getServerI18n(event)

        expect(first.locale).toBe('en-US')
        expect(first.t('errors.auth.loginRequired')).toBe('Please sign in first')
        expect(second).toBe(first)
        expect(useTranslationMock).toHaveBeenCalledTimes(1)
        expect(headers.get('Content-Language')).toBe('en-US')
        expect(headers.get('Vary')).toBe('Accept-Language, Cookie')
    })

    it('falls back to zh-CN when useTranslation is unavailable', async () => {
        const { event } = createResponseEvent()

        const { t } = await getServerI18n(event)

        expect(t('errors.auth.unauthorized')).toBe('未登录用户')
        expect(t('errors.auth.unknownKey')).toBe('errors.auth.unknownKey')
    })

    it('creates an H3Error with the translated message', async () => {
        const { event } = createResponseEvent()
        vi.stubGlobal('useTranslation', vi.fn(async () =>
            (key: string) => (key === 'errors.auth.rateLimited' ? 'Too many requests' : key),
        ))

        const error = await createLocalizedError(event, {
            statusCode: 429,
            statusMessage: 'Too Many Requests',
            key: 'errors.auth.rateLimited',
        })

        expect(error.statusCode).toBe(429)
        expect(error.message).toBe('Too many requests')
    })
})
