import { createError, getResponseHeader, setResponseHeader, type H3Error, type H3Event } from 'h3'
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, normalizeDetectedLocale, type LocaleCode } from '@/i18n/config/locale-registry'
import { getDefaultErrorMessage } from '@/utils/shared/error-messages'
import { normalizeAuthPath } from '@/utils/shared/auth-paths'

/** 需要返回 `Content-Language` / `Vary` 的认证类 API 前缀 */
const LOCALIZED_API_PREFIXES = ['/api/auth', '/api/oauth', '/api/sso', '/api/social']

/** 服务端翻译函数：键不存在时返回键本身，由 `createServerI18n` 兜底 */
export type ServerTranslator = (key: string, named?: Record<string, unknown>) => string

export interface ServerI18n {
    locale: LocaleCode
    t: ServerTranslator
}

export interface LocalizedErrorOptions {
    statusCode: number
    key: string
    statusMessage?: string
    named?: Record<string, unknown>
    data?: unknown
}

/** 同一请求内复用翻译器，避免重复加载消息与重复设置响应头 */
const serverI18nCache = new WeakMap<H3Event, Promise<ServerI18n>>()

/**
 * 判断请求是否属于认证类 API（认证 / OAuth / SSO / 社交登录）。
 * 使用归一化路径，避免点段路径绕过响应头设置。
 */
export function isLocalizedApiPath(path: string): boolean {
    const normalized = normalizeAuthPath(path)
    return LOCALIZED_API_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

function callOptional<T>(callback: () => T | null | undefined, fallback: T): T {
    try {
        return callback() ?? fallback
    } catch {
        return fallback
    }
}

/**
 * 检测请求 locale，优先级与 `i18n/localeDetector.ts` 保持一致：
 * query `locale` → `i18n_locale` cookie → 旧 cookie → Accept-Language → 默认。
 *
 * 单测 / 非 HTTP 上下文中的 event 可能没有 `node.req`，此时 `try*` 会返回空并回退默认语言。
 */
export function getRequestLocale(event: H3Event): LocaleCode {
    if (typeof tryQueryLocale === 'function') {
        const queryLocale = callOptional(() => tryQueryLocale(event, { lang: '' }), null)
        if (queryLocale) {
            return normalizeDetectedLocale(String(queryLocale))
        }
    }

    if (typeof tryCookieLocale === 'function') {
        const cookieLocale = callOptional(() => tryCookieLocale(event, { lang: '', name: LOCALE_COOKIE_KEY }), null)
        if (cookieLocale) {
            return normalizeDetectedLocale(String(cookieLocale))
        }

        for (const name of ['locale', 'language', 'lang']) {
            const legacyLocale = callOptional(() => tryCookieLocale(event, { lang: '', name }), null)
            if (legacyLocale) {
                return normalizeDetectedLocale(String(legacyLocale))
            }
        }
    }

    if (typeof tryHeaderLocale === 'function') {
        const headerLocale = callOptional(() => tryHeaderLocale(event, { lang: '' }), null)
        if (headerLocale) {
            return normalizeDetectedLocale(String(headerLocale))
        }
    }

    return DEFAULT_LOCALE
}

function normalizeVaryHeader(value: string | number | string[] | undefined): string[] {
    if (value === undefined) {
        return []
    }
    const values = Array.isArray(value) ? value : [String(value)]
    return values
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean)
}

/**
 * 设置认证类 API 的语言响应头。
 * `Vary` 保留已有值并去重；单测 event 没有 `node.res` 时静默跳过。
 */
export function setLocaleResponseHeaders(event: H3Event, locale: LocaleCode): void {
    try {
        setResponseHeader(event, 'Content-Language', locale)
        const vary = normalizeVaryHeader(getResponseHeader(event, 'Vary'))
        if (vary.includes('*')) {
            return
        }
        for (const value of ['Accept-Language', 'Cookie']) {
            if (!vary.includes(value)) {
                vary.push(value)
            }
        }
        setResponseHeader(event, 'Vary', vary.join(', '))
    } catch {
        // 单测 / 非 HTTP 上下文没有响应对象，响应头不参与断言
    }
}

async function loadTranslator(event: H3Event): Promise<ServerTranslator | undefined> {
    if (typeof useTranslation !== 'function') {
        return undefined
    }

    try {
        const translate = await useTranslation(event) as unknown as (
            key: string,
            named?: Record<string, unknown>,
        ) => string
        return (key, named) => {
            try {
                return named ? translate(key, named) : translate(key)
            } catch {
                return key
            }
        }
    } catch {
        // `useTranslation` 需要 @intlify/h3 中间件；单测 / 未初始化时回退 zh-CN
        return undefined
    }
}

async function createServerI18n(event: H3Event): Promise<ServerI18n> {
    const locale = getRequestLocale(event)
    if (!isLocalizedApiPath(event.path)) {
        return {
            locale,
            t: (key) => getDefaultErrorMessage(key),
        }
    }

    setLocaleResponseHeaders(event, locale)
    const translate = await loadTranslator(event)

    return {
        locale,
        t: (key, named) => {
            if (!translate) {
                return getDefaultErrorMessage(key)
            }
            try {
                const translated = translate(key, named)
                return translated && translated !== key ? translated : getDefaultErrorMessage(key)
            } catch {
                return getDefaultErrorMessage(key)
            }
        },
    }
}

/** 获取当前请求的翻译器（按 event 缓存） */
export function getServerI18n(event: H3Event): Promise<ServerI18n> {
    const cached = serverI18nCache.get(event)
    if (cached) {
        return cached
    }
    const pending = createServerI18n(event)
    serverI18nCache.set(event, pending)
    return pending
}

/** 创建带当前语言消息的 H3Error */
export async function createLocalizedError(event: H3Event, options: LocalizedErrorOptions): Promise<H3Error> {
    const { t } = await getServerI18n(event)
    return createError({
        statusCode: options.statusCode,
        statusMessage: options.statusMessage,
        message: t(options.key, options.named),
        data: options.data,
    })
}
