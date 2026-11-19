import { describe, expect, it } from 'vitest'
import { EMAIL_MESSAGE_LOCALES, getEmailTranslator, getRequestLocaleFromRequest, resolveEmailLocale } from '@/server/utils/email/i18n'
import { ENABLED_LOCALE_CODES } from '@/i18n/config/locale-registry'

describe('server/utils/email/i18n', () => {
    it('registers email messages for every enabled locale', () => {
        /* 启用语言漏补 import 时邮件会静默回落 zh-CN，必须由门禁拦住 */
        expect([...EMAIL_MESSAGE_LOCALES].sort()).toEqual([...ENABLED_LOCALE_CODES].sort())
    })

    it('translates chrome and message copy in both locales', () => {
        const zh = getEmailTranslator('zh-CN')
        const en = getEmailTranslator('en-US')

        expect(zh('email.chrome.greeting')).toBe('您好！')
        expect(en('email.chrome.greeting')).toBe('Hello!')
        expect(zh('email.verification.buttonText')).toBe('验证邮箱地址')
        expect(en('email.verification.buttonText')).toBe('Verify email address')

        const zhTw = getEmailTranslator('zh-TW')
        expect(zhTw('email.chrome.greeting')).toBe('您好！')
        expect(zhTw('email.verification.buttonText')).toBe('驗證電子郵件地址')

        /* ja-JP 已启用：邮件必须命中日文，防止 EMAIL_MESSAGES 误指向其他语言文件 */
        const ja = getEmailTranslator('ja-JP')
        expect(ja('email.chrome.greeting')).toBe('こんにちは！')
        expect(ja('email.verification.buttonText')).toBe('メールアドレスを確認')
    })

    it('interpolates named parameters and leaves unknown ones intact', () => {
        const t = getEmailTranslator('en-US')

        expect(t('email.verification.subject', { appName: 'Demo' })).toBe('Verify your Demo email address')
        expect(t('email.loginOtp.preheader', { code: '123456' })).toBe('Your sign-in code is 123456')
        expect(t('email.verification.subject')).toContain('{appName}')
    })

    it('falls back to zh-CN for unknown locales, then to the key', () => {
        const t = getEmailTranslator('fr-FR')

        expect(t('email.chrome.greeting')).toBe('您好！')
        expect(t('email.missing.key')).toBe('email.missing.key')
    })

    it('reads locale from query, cookie and Accept-Language', () => {
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api?locale=en-US'))).toBe('en-US')
        /* happy-dom 的 Request 会丢弃 Cookie 头，这里用最小请求形态直接验证 Cookie 解析 */
        expect(getRequestLocaleFromRequest({
            url: 'https://example.com/api',
            headers: { get: (name) => (name === 'cookie' ? 'i18n_locale=en-US' : null) },
        })).toBe('en-US')
        /* 畸形百分号编码不应抛错 */
        expect(getRequestLocaleFromRequest({
            url: 'https://example.com/api',
            headers: { get: (name) => (name === 'cookie' ? 'i18n_locale=%E0%A4%A' : null) },
        })).toBeUndefined()
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api', {
            headers: { 'accept-language': 'en-US,en;q=0.9' },
        }))).toBe('en-US')
        /* 多语言协商：跳过不受支持的语言，按 q 值取首个可用项 */
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api', {
            headers: { 'accept-language': 'fr-FR,en-US;q=0.9,zh-CN;q=0.8' },
        }))).toBe('en-US')
        /* zh-TW 启用后繁体（含 zh-Hant 别名）协商到 zh-TW，不再落到英文 */
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api', {
            headers: { 'accept-language': 'zh-Hant,en-US;q=0.9' },
        }))).toBe('zh-TW')
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api', {
            headers: { 'accept-language': 'fr-FR,de-DE' },
        }))).toBeUndefined()
        expect(getRequestLocaleFromRequest(new Request('https://example.com/api'))).toBeUndefined()
        expect(getRequestLocaleFromRequest(null)).toBeUndefined()
    })

    it('prefers request locale, then user locale, then the default', () => {
        const request = new Request('https://example.com/api', { headers: { 'accept-language': 'en-US' } })

        expect(resolveEmailLocale({ request, userLocale: 'zh-CN' })).toBe('en-US')
        expect(resolveEmailLocale({ userLocale: 'en-US' })).toBe('en-US')
        expect(resolveEmailLocale({})).toBe('zh-CN')
    })
})
