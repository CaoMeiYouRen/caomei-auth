import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveRecoveryLocale, resolveRecoveryMessage } from '@/server/utils/recovery-messages'
import { RECOVERY_MESSAGES } from '@/server/utils/recovery-messages-data'

function requestWith(headers: Record<string, string>) {
    return { headers: new Headers(headers) }
}

describe('server/utils/recovery-messages', () => {
    it('prefers the locale cookie over Accept-Language', () => {
        expect(resolveRecoveryLocale(requestWith({
            cookie: 'foo=1; i18n_locale=zh-TW',
            'accept-language': 'en-US,en;q=0.9',
        }))).toBe('zh-TW')
    })

    it('maps Accept-Language variants to enabled locales', () => {
        expect(resolveRecoveryLocale(requestWith({ 'accept-language': 'ja-JP,ja;q=0.9' }))).toBe('ja-JP')
        expect(resolveRecoveryLocale(requestWith({ 'accept-language': 'ko-KR,ko;q=0.9' }))).toBe('ko-KR')
        expect(resolveRecoveryLocale(requestWith({ 'accept-language': 'zh-Hant' }))).toBe('zh-TW')
        expect(resolveRecoveryLocale(requestWith({ 'accept-language': 'zh-Hans' }))).toBe('zh-CN')
        expect(resolveRecoveryLocale(requestWith({ 'accept-language': 'fr-FR,fr;q=0.9' }))).toBe('zh-CN')
    })

    it('falls back to zh-CN without headers', () => {
        expect(resolveRecoveryLocale(null)).toBe('zh-CN')
        expect(resolveRecoveryLocale({})).toBe('zh-CN')
    })

    it('returns localized messages and interpolates named values', () => {
        const en = resolveRecoveryMessage(requestWith({ 'accept-language': 'en-US' }), 'targetTaken')
        expect(en).toContain('already used')

        const ja = resolveRecoveryMessage(requestWith({ cookie: 'i18n_locale=ja-JP' }), 'passwordResetRequired')
        expect(ja).toContain('パスワード')

        const ko = resolveRecoveryMessage(requestWith({ 'accept-language': 'ko-KR' }), 'codeExpired')
        expect(ko).toContain('만료')

        const tw = resolveRecoveryMessage(requestWith({ 'accept-language': 'zh-TW' }), 'channelNotConfigured')
        expect(tw).toContain('簡訊')

        const interpolated = resolveRecoveryMessage(requestWith({ 'accept-language': 'zh-CN' }), 'channelChangeSmsNotice', { target: 'n***@example.com' })
        expect(interpolated).toContain('n***@example.com')
    })

    it('keeps the server copy aligned with every locale error pack', () => {
        for (const locale of Object.keys(RECOVERY_MESSAGES)) {
            const raw = JSON.parse(readFileSync(path.resolve(process.cwd(), `i18n/locales/${locale}/errors.json`), 'utf8'))
            expect(RECOVERY_MESSAGES[locale as keyof typeof RECOVERY_MESSAGES]).toEqual(raw.errors.recovery)
        }
    })
})
