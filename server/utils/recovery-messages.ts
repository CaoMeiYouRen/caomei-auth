import { RECOVERY_MESSAGES } from './recovery-messages-data'

/**
 * 账号恢复错误文案解析。
 *
 * better-auth 的回调（`sendPasswordResetOTP`、`databaseHooks.session.create.before`）
 * 不在 Nuxt i18n 请求上下文里，无法使用 `useTranslation`；这里按请求头解析语言，
 * 读取与 `i18n/locales/*\/errors.json` 同源的文案，保证 403 / 400 响应可读且与 UI 一致。
 */
export type RecoveryErrorKey = keyof typeof RECOVERY_MESSAGES['zh-CN']

export type RecoveryLocale = keyof typeof RECOVERY_MESSAGES

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

/** 解析请求语言：locale cookie > Accept-Language > zh-CN */
export function resolveRecoveryLocale(request?: RequestLike | null): RecoveryLocale {
    const headers = request?.headers
    if (!headers || typeof headers.get !== 'function') {
        return 'zh-CN'
    }
    const cookies = headers.get('cookie') ?? ''
    const cookieLocale = /(?:^|;\s*)i18n_locale=([^;]+)/u.exec(cookies)?.[1]
    if (cookieLocale) {
        const normalized = normalizeLocale(cookieLocale)
        if (normalized) {
            return normalized
        }
    }
    const acceptLanguage = headers.get('accept-language') ?? ''
    for (const part of acceptLanguage.split(',')) {
        const tag = part.trim().split(';')[0]?.trim()
        if (!tag) {
            continue
        }
        const normalized = normalizeLocale(tag)
        if (normalized) {
            return normalized
        }
    }
    return 'zh-CN'
}

function normalizeLocale(value: string): RecoveryLocale | null {
    const lower = decodeURIComponent(value.trim()).toLowerCase().replace('_', '-')
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hant') || lower.startsWith('zh-hk')) {
        return 'zh-TW'
    }
    if (lower.startsWith('zh')) {
        return 'zh-CN'
    }
    if (lower.startsWith('ja')) {
        return 'ja-JP'
    }
    if (lower.startsWith('ko')) {
        return 'ko-KR'
    }
    if (lower.startsWith('en')) {
        return 'en-US'
    }
    return null
}

function interpolate(template: string, named?: Record<string, unknown>): string {
    if (!named) {
        return template
    }
    return template.replace(/\{(\w+)\}/gu, (raw, name: string) => (Object.hasOwn(named, name) ? String(named[name] ?? '') : raw))
}

/** 解析当前请求语言下的恢复类错误文案 */
export function resolveRecoveryMessage(
    request: RequestLike | null | undefined,
    key: RecoveryErrorKey,
    named?: Record<string, unknown>,
): string {
    const locale = resolveRecoveryLocale(request)
    return interpolate(RECOVERY_MESSAGES[locale][key] ?? RECOVERY_MESSAGES['zh-CN'][key], named)
}
