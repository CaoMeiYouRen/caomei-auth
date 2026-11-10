import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultErrorMessages } from '@/utils/shared/error-messages-zh'
import { getDefaultErrorMessage, isErrorMessageKey, resolveErrorMessage } from '@/utils/shared/error-messages'

function flattenMessages(value: Record<string, unknown>, prefix = ''): Record<string, string> {
    const entries: Record<string, string> = {}
    for (const [key, child] of Object.entries(value)) {
        const messageKey = prefix ? `${prefix}.${key}` : key
        if (typeof child === 'object' && child !== null && !Array.isArray(child)) {
            Object.assign(entries, flattenMessages(child as Record<string, unknown>, messageKey))
            continue
        }
        entries[messageKey] = String(child)
    }
    return entries
}

describe('utils/shared/error-messages', () => {
    it('recognizes error keys', () => {
        expect(isErrorMessageKey('errors.auth.loginRequired')).toBe(true)
        expect(isErrorMessageKey('请先登录')).toBe(false)
    })

    it('falls back to zh-CN text when no translator is available', () => {
        expect(getDefaultErrorMessage('errors.auth.loginRequired')).toBe('请先登录')
        expect(resolveErrorMessage('errors.oauth.clientNotFound')).toBe('应用不存在或已被禁用')
    })

    it('uses the translator when it resolves the key', () => {
        const t = (key: string) => (key === 'errors.auth.loginRequired' ? 'Please sign in first' : key)
        expect(resolveErrorMessage('errors.auth.loginRequired', t)).toBe('Please sign in first')
    })

    it('falls back when the translator returns the key itself', () => {
        const t = (key: string) => key
        expect(resolveErrorMessage('errors.auth.loginRequired', t)).toBe('请先登录')
    })

    it('keeps plain messages untouched', () => {
        expect(resolveErrorMessage('普通文案')).toBe('普通文案')
        expect(resolveErrorMessage('')).toBe('')
    })

    it('keeps the zh fallback and locale packs in sync', () => {
        for (const locale of ['zh-CN', 'en-US']) {
            const file = path.resolve(process.cwd(), `i18n/locales/${locale}/errors.json`)
            const messages = flattenMessages(JSON.parse(readFileSync(file, 'utf8')).errors as Record<string, unknown>)
            expect(Object.keys(messages).sort()).toEqual(Object.keys(defaultErrorMessages).sort())
            if (locale === 'zh-CN') {
                expect(messages).toEqual(defaultErrorMessages)
            }
        }
    })
})
