import zhEmail from '@/i18n/locales/zh-CN/email.json'
import enEmail from '@/i18n/locales/en-US/email.json'
import {
    DEFAULT_LOCALE,
    LOCALE_COOKIE_KEY,
    matchDetectedLocale,
    normalizeDetectedLocale,
    type LocaleCode,
} from '@/i18n/config/locale-registry'

/** 邮件模块消息（服务端专用模块，与 `email.json` 同构） */
type EmailMessages = Record<string, unknown>

/**
 * 邮件消息表：只登记已有语言包的语言；未登记的新语言回退 zh-CN。
 * 新增语言时随语言包批次补静态 import。
 */
const EMAIL_MESSAGES: Partial<Record<LocaleCode, EmailMessages>> = {
    'zh-CN': zhEmail as EmailMessages,
    'en-US': enEmail as EmailMessages,
}

function lookupMessage(messages: EmailMessages, key: string): string | undefined {
    let current: unknown = messages
    for (const segment of key.split('.')) {
        if (typeof current !== 'object' || current === null) {
            return undefined
        }
        current = (current as Record<string, unknown>)[segment]
    }
    return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, named?: Record<string, unknown>): string {
    if (!named) {
        return template
    }
    return template.replace(/\{(\w+)\}/gu, (raw, name: string) => (name in named ? String(named[name]) : raw))
}

export type EmailTranslator = (key: string, named?: Record<string, unknown>) => string

/** 只需要 url 与 headers.get 的最小请求形态，便于单测构造（浏览器 / Fetch 的 `Request` 同样满足） */
export interface RequestLike {
    url: string
    headers: { get: (name: string) => string | null }
}

/**
 * 邮件翻译器：不依赖 H3 event，供异步邮件（无请求上下文）与同步流程共用。
 *
 * 缺键时回退 zh-CN，再回退键名，保证邮件始终可读。
 */
export function getEmailTranslator(locale?: LocaleCode | string | null): EmailTranslator {
    const normalized = normalizeDetectedLocale(locale)
    const fallback: EmailMessages = EMAIL_MESSAGES[DEFAULT_LOCALE] ?? {}
    const primary: EmailMessages = EMAIL_MESSAGES[normalized] ?? fallback

    return (key, named) => {
        const template = lookupMessage(primary, key) || lookupMessage(fallback, key)
        return template ? interpolate(template, named) : key
    }
}

/** 解析 Cookie 头，取出现代 / 旧版 locale cookie */
function readCookieLocale(cookieHeader: string | null): string | undefined {
    if (!cookieHeader) {
        return undefined
    }
    const cookies = new Map<string, string>()
    for (const part of cookieHeader.split(';')) {
        const index = part.indexOf('=')
        if (index <= 0) {
            continue
        }
        const rawValue = part.slice(index + 1).trim()
        try {
            cookies.set(part.slice(0, index).trim(), decodeURIComponent(rawValue))
        } catch {
            /* 畸形百分号编码不应打断邮件发送 */
            cookies.set(part.slice(0, index).trim(), rawValue)
        }
    }
    for (const name of [LOCALE_COOKIE_KEY, 'locale', 'language', 'lang']) {
        const value = cookies.get(name)
        if (value) {
            return value
        }
    }
    return undefined
}

/** 按 q 值降序取第一个受支持的语言；与 `server/utils/i18n.ts` 的 `tryHeaderLocale` 口径一致 */
function matchAcceptLanguage(header: string | null): LocaleCode | undefined {
    if (!header) {
        return undefined
    }
    const candidates = header
        .split(',')
        .map((item) => {
            const [tag, ...params] = item.trim().split(';')
            const q = params.find((param) => param.trim().startsWith('q='))
            return { tag: (tag ?? '').trim(), quality: q ? Number(q.split('=')[1]) : 1 }
        })
        .filter((item) => item.tag && Number.isFinite(item.quality))
        .sort((a, b) => b.quality - a.quality)

    for (const candidate of candidates) {
        const matched = matchDetectedLocale(candidate.tag)
        if (matched) {
            return matched
        }
    }
    return undefined
}

/**
 * 从 better-auth 回调拿到的 Fetch `Request` 推断请求语言。
 *
 * 优先级与 `getRequestLocale` 一致（query → cookie → Accept-Language），但没有 H3 event 时只能读 Cookie 与 Accept-Language。
 */
export function getRequestLocaleFromRequest(request?: Request | RequestLike | null): LocaleCode | undefined {
    if (!request) {
        return undefined
    }

    const url = (() => {
        try {
            return new URL(request.url)
        } catch {
            return null
        }
    })()

    const queryLocale = url?.searchParams.get('locale')
    const matchedQuery = matchDetectedLocale(queryLocale)
    if (matchedQuery) {
        return matchedQuery
    }

    const matchedCookie = matchDetectedLocale(readCookieLocale(request.headers.get('cookie')))
    if (matchedCookie) {
        return matchedCookie
    }

    return matchAcceptLanguage(request.headers.get('accept-language'))
}

/**
 * 解析邮件语言：请求语言 > 用户偏好 > 默认语言。
 *
 * 异步邮件没有请求上下文，只会命中用户偏好或默认语言。
 */
export function resolveEmailLocale(options: { request?: Request | RequestLike | null, userLocale?: string | null }): LocaleCode {
    return getRequestLocaleFromRequest(options.request)
        ?? matchDetectedLocale(options.userLocale)
        ?? DEFAULT_LOCALE
}
