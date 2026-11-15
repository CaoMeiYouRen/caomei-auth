import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { ERROR_STATUS_CODES, ERROR_STATUS_MESSAGE_KEYS, resolveErrorStatusKey, resolveErrorView } from '@/utils/web/error-status'

function loadAppMessages(locale: 'zh-CN' | 'en-US'): Record<string, unknown> {
    const file = join(process.cwd(), 'i18n/locales', locale, 'app.json')
    return JSON.parse(readFileSync(file, 'utf8'))
}

function getByKey(source: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce<unknown>((node, segment) => (node as Record<string, unknown>)?.[segment], source)
}

describe('utils/web/error-status', () => {
    it.each(ERROR_STATUS_CODES)('maps %i to its own key', (code) => {
        expect(resolveErrorStatusKey(code)).toBe(String(code))
    })

    it('falls back to unknown for non-standard or missing codes', () => {
        expect(resolveErrorStatusKey(418)).toBe('unknown')
        expect(resolveErrorStatusKey(0)).toBe('unknown')
        expect(resolveErrorStatusKey(undefined)).toBe('unknown')
    })

    describe('resolveErrorView', () => {
        const t = (key: string) => key

        it('localizes known status codes and keeps the numeric code', () => {
            const view = resolveErrorView({ statusCode: 404, statusMessage: 'Page not found: /x' }, t)
            expect(view).toEqual({
                statusKey: '404',
                code: '404',
                title: 'app.error.status.404.title',
                description: 'app.error.status.404.description',
                detail: '',
            })
        })

        it('falls back to unknown and exposes the framework message only as detail', () => {
            const view = resolveErrorView({ statusCode: 503, statusMessage: 'Service Unavailable' }, t)
            expect(view.statusKey).toBe('unknown')
            expect(view.code).toBe('app.error.status.unknown.code')
            expect(view.title).toBe('app.error.status.unknown.title')
            expect(view.description).toBe('app.error.status.unknown.description')
            expect(view.detail).toBe('Service Unavailable')
        })

        it('prefers error.data.message for detail and ignores statusMessage', () => {
            const view = resolveErrorView({ statusCode: 503, statusMessage: 'Service Unavailable', dataMessage: '维护中' }, t)
            expect(view.detail).toBe('维护中')
            const known = resolveErrorView({ statusCode: 500, statusMessage: 'Server Error', dataMessage: 'db down' }, t)
            expect(known.detail).toBe('db down')
        })

        it('drops statusMessage for known codes', () => {
            const view = resolveErrorView({ statusCode: 500, statusMessage: 'Server Error' }, t)
            expect(view.detail).toBe('')
        })
    })

    it('every mapped message key exists in both locales', () => {
        const zh = loadAppMessages('zh-CN')
        const en = loadAppMessages('en-US')

        for (const keys of Object.values(ERROR_STATUS_MESSAGE_KEYS)) {
            for (const key of [keys.title, keys.description]) {
                expect(typeof getByKey(zh, key), `zh 缺少 ${key}`).toBe('string')
                expect(typeof getByKey(en, key), `en 缺少 ${key}`).toBe('string')
            }
        }
    })
})
