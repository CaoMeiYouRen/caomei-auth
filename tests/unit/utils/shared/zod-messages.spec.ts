import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultValidationMessages } from '@/utils/shared/validation-messages-zh'
import { getDefaultValidationMessage, isValidationMessageKey, resolveValidationMessage } from '@/utils/shared/zod-messages'

describe('utils/shared/zod-messages', () => {
    it('recognizes validation keys', () => {
        expect(isValidationMessageKey('validation.emailRequired')).toBe(true)
        expect(isValidationMessageKey('请输入邮箱')).toBe(false)
    })

    it('falls back to zh-CN text when no translator is available', () => {
        expect(getDefaultValidationMessage('validation.emailRequired')).toBe('请输入邮箱')
        expect(resolveValidationMessage('validation.passwordMismatch')).toBe('两次输入的密码不一致')
    })

    it('uses the translator when it resolves the key', () => {
        const t = (key: string) => (key === 'validation.emailRequired' ? 'Email is required' : key)
        expect(resolveValidationMessage('validation.emailRequired', t)).toBe('Email is required')
    })

    it('falls back when the translator returns the key itself', () => {
        const t = (key: string) => key
        expect(resolveValidationMessage('validation.emailRequired', t)).toBe('请输入邮箱')
    })

    it('keeps plain messages untouched', () => {
        expect(resolveValidationMessage('普通文案')).toBe('普通文案')
        expect(resolveValidationMessage('')).toBe('')
    })

    it('keeps the zh fallback and locale packs in sync', () => {
        for (const locale of ['zh-CN', 'en-US']) {
            const file = path.resolve(process.cwd(), `i18n/locales/${locale}/validation.json`)
            const messages = JSON.parse(readFileSync(file, 'utf8')).validation as Record<string, string>
            expect(Object.keys(messages).sort()).toEqual(Object.keys(defaultValidationMessages).sort())
            if (locale === 'zh-CN') {
                expect(messages).toEqual(defaultValidationMessages)
            }
        }
    })
})
