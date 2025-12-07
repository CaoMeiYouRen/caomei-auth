/**
 * 国际化工具函数
 * 用于检测和管理用户的语言偏好
 */

import type { H3Event } from 'h3'
import type { BuiltInLocales } from 'better-auth-localization'

/**
 * better-auth 内置支持的语言代码类型
 * 直接使用 better-auth-localization 的语言代码，避免额外转换
 */
export type BetterAuthLocale = BuiltInLocales

/**
 * 项目支持的语言列表
 * 直接使用 better-auth-localization 支持的完整语言代码
 * 避免简化格式和额外的转换层
 */
export const SUPPORTED_LOCALES: readonly BetterAuthLocale[] = [
    'zh-Hans', // 简体中文
    'zh-Hant', // 繁体中文
    'default', // 默认语言
    'pt-BR', // 巴西葡萄牙语
    'pt-PT', // 葡萄牙语
    'es-ES', // 西班牙语
    'fr-FR', // 法语
    'de-DE', // 德语
    'ja-JP', // 日语
    'ko-KR', // 韩语
    'ru-RU', // 俄语
    'ar-SA', // 阿拉伯语
    'hi-HI', // 印地语
    'it-IT', // 意大利语
    'nl-NL', // 荷兰语
    'sv-SE', // 瑞典语
    'da-DK', // 丹麦语
    'pl-PL', // 波兰语
    'tr-TR', // 土耳其语
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

/**
 * 默认语言设置（简体中文）
 */
export const DEFAULT_LOCALE: SupportedLocale = 'zh-Hans'
export const FALLBACK_LOCALE: SupportedLocale = 'default'

/**
 * 语言代码映射表
 * 用于将常见的语言代码转换为支持的语言代码
 */
const LOCALE_MAPPING: Record<string, SupportedLocale> = {
    // 中文变体映射
    zh: 'zh-Hans',
    'zh-cn': 'zh-Hans',
    'zh-CN': 'zh-Hans',
    'zh-sg': 'zh-Hans',
    'zh-SG': 'zh-Hans',
    'zh-tw': 'zh-Hant',
    'zh-TW': 'zh-Hant',
    'zh-hk': 'zh-Hant',
    'zh-HK': 'zh-Hant',
    'zh-mo': 'zh-Hant',
    'zh-MO': 'zh-Hant',

    // 英语变体映射（统一映射到 default）
    en: 'default',
    'en-US': 'default',
    'en-GB': 'default',
    'en-CA': 'default',
    'en-AU': 'default',
    'en-NZ': 'default',
    'en-ZA': 'default',

    // 葡萄牙语变体映射
    pt: 'pt-PT',
    'pt-PT': 'pt-PT',

    // 西班牙语变体映射
    es: 'es-ES',
    'es-ES': 'es-ES',
    'es-MX': 'es-ES',
    'es-AR': 'es-ES',
    'es-CO': 'es-ES',
    'es-CL': 'es-ES',

    // 法语变体映射
    fr: 'fr-FR',
    'fr-FR': 'fr-FR',
    'fr-CA': 'fr-FR',
    'fr-BE': 'fr-FR',
    'fr-CH': 'fr-FR',

    // 德语变体映射
    de: 'de-DE',
    'de-DE': 'de-DE',
    'de-AT': 'de-DE',
    'de-CH': 'de-DE',

    // 其他语言映射
    ja: 'ja-JP',
    'ja-JP': 'ja-JP',
    ko: 'ko-KR',
    'ko-KR': 'ko-KR',
    ru: 'ru-RU',
    'ru-RU': 'ru-RU',
    it: 'it-IT',
    'it-IT': 'it-IT',
    nl: 'nl-NL',
    'nl-NL': 'nl-NL',
    sv: 'sv-SE',
    'sv-SE': 'sv-SE',
    da: 'da-DK',
    'da-DK': 'da-DK',
    pl: 'pl-PL',
    'pl-PL': 'pl-PL',
    tr: 'tr-TR',
    'tr-TR': 'tr-TR',
    ar: 'ar-SA',
    'ar-SA': 'ar-SA',
    hi: 'hi-HI',
    'hi-HI': 'hi-HI',

    // 不支持的语言映射到最接近的语言或默认语言
    no: 'da-DK', // 挪威语映射到丹麦语
    'no-NO': 'da-DK',
    fi: 'sv-SE', // 芬兰语映射到瑞典语
    'fi-FI': 'sv-SE',
    th: 'default', // 泰语使用默认语言
    'th-TH': 'default',
    vi: 'default', // 越南语使用默认语言
    'vi-VN': 'default',
}

/**
 * 标准化语言代码
 * @param locale 原始语言代码
 * @returns 标准化后的语言代码
 */
export function normalizeLocale(locale: string): SupportedLocale {
    // 转换为小写并去除空格
    const cleanLocale = locale.trim().toLowerCase()

    // 如果直接匹配支持的语言，返回该语言
    const directMatch = SUPPORTED_LOCALES.find(
        (supportedLocale) => supportedLocale.toLowerCase() === cleanLocale,
    )
    if (directMatch) {
        return directMatch
    }

    // 尝试映射表匹配
    const mappedLocale = LOCALE_MAPPING[locale] || LOCALE_MAPPING[cleanLocale]
    if (mappedLocale) {
        return mappedLocale
    }

    // 尝试前缀匹配（例如 'zh-xxx' -> 'zh-Hans'）
    const languagePrefix = cleanLocale.split('-')[0]
    const prefixMatch = SUPPORTED_LOCALES.find(
        (supportedLocale) => supportedLocale.toLowerCase().startsWith(`${languagePrefix}-`)
            || supportedLocale.toLowerCase() === languagePrefix,
    )
    if (prefixMatch) {
        return prefixMatch
    }

    // 如果都不匹配，返回默认语言
    return DEFAULT_LOCALE
}

/**
 * 从 Accept-Language 头部解析语言偏好
 * @param acceptLanguage Accept-Language 头部值
 * @returns 按优先级排序的语言列表
 */
export function parseAcceptLanguage(acceptLanguage: string): SupportedLocale[] {
    if (!acceptLanguage) {
        return [DEFAULT_LOCALE]
    }

    // 解析 Accept-Language 头部
    const languages = acceptLanguage
        .split(',')
        .map((lang) => {
            const parts = lang.trim().split(';q=')
            const locale = parts[0]
            const qValue = parts[1]
            return {
                locale: locale ? locale.trim() : '',
                q: qValue ? parseFloat(qValue) : 1.0,
            }
        })
        .sort((a, b) => b.q - a.q) // 按质量值降序排序
        .map(({ locale }) => normalizeLocale(locale))

    // 去重并确保至少有默认语言
    const uniqueLanguages = [...new Set(languages)]
    if (!uniqueLanguages.includes(DEFAULT_LOCALE)) {
        uniqueLanguages.push(DEFAULT_LOCALE)
    }

    return uniqueLanguages
}

/**
 * 从 Cookie 获取用户设置的语言
 * @param event H3Event 对象
 * @returns 用户设置的语言或 null
 */
export function getLocaleFromCookie(event: H3Event): SupportedLocale | null {
    try {
        const cookies = parseCookies(event)
        const locale = cookies.locale || cookies.language || cookies.lang

        if (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
            return locale as SupportedLocale
        }

        if (locale) {
            return normalizeLocale(locale)
        }

        return null
    } catch (error) {
        console.warn('Error parsing locale from cookie:', error)
        return null
    }
}

/**
 * 从请求头获取语言偏好
 * @param event H3Event 对象
 * @returns 首选语言
 */
export function getLocaleFromHeaders(event: H3Event): SupportedLocale {
    try {
        // 检查自定义头部
        const customLocale = getHeader(event, 'x-locale')
            || getHeader(event, 'x-language')
            || getHeader(event, 'x-lang')

        if (customLocale) {
            return normalizeLocale(customLocale as string)
        }

        // 解析 Accept-Language 头部
        const acceptLanguage = getHeader(event, 'accept-language')
        if (acceptLanguage) {
            const languages = parseAcceptLanguage(acceptLanguage as string)
            return languages[0] || DEFAULT_LOCALE
        }

        return DEFAULT_LOCALE
    } catch (error) {
        console.warn('Error getting locale from headers:', error)
        return DEFAULT_LOCALE
    }
}

/**
 * 检测用户语言偏好
 * 优先级：Cookie > 自定义头部 > Accept-Language > 默认语言
 * @param event H3Event 对象
 * @returns 检测到的语言
 */
export function detectUserLocale(event: H3Event): SupportedLocale {
    try {
        // 1. 优先从 Cookie 获取用户明确设置的语言
        const cookieLocale = getLocaleFromCookie(event)
        if (cookieLocale) {
            return cookieLocale
        }

        // 2. 从请求头获取语言偏好
        const headerLocale = getLocaleFromHeaders(event)
        if (headerLocale) {
            return headerLocale
        }

        // 3. 返回默认语言
        return DEFAULT_LOCALE
    } catch (error) {
        console.warn('Error detecting user locale:', error)
        return DEFAULT_LOCALE
    }
}

/**
 * 设置用户语言偏好到 Cookie
 * @param event H3Event 对象
 * @param locale 要设置的语言
 * @param options Cookie 选项
 */
export function setLocaleCookie(
    event: H3Event,
    locale: SupportedLocale,
    options: {
        maxAge?: number
        domain?: string
        secure?: boolean
        sameSite?: 'strict' | 'lax' | 'none'
    } = {},
) {
    try {
        const cookieOptions = {
            httpOnly: false, // 允许客户端访问，用于前端语言切换
            secure: options.secure ?? process.env.NODE_ENV === 'production',
            sameSite: options.sameSite ?? 'lax',
            maxAge: options.maxAge ?? 365 * 24 * 60 * 60, // 默认1年
            ...options,
        }

        setCookie(event, 'locale', locale, cookieOptions)
    } catch (error) {
        console.warn('Error setting locale cookie:', error)
    }
}

/**
 * 获取用户语言（为 better-auth localization 插件使用）
 * @param request Request 对象
 * @returns 用户语言
 */
export function getUserLocale(request: Request): SupportedLocale {
    try {
        // 从 URL 查询参数获取语言
        const url = new URL(request.url)
        const urlLocale = url.searchParams.get('locale')
            || url.searchParams.get('lang')
            || url.searchParams.get('language')

        if (urlLocale && SUPPORTED_LOCALES.includes(urlLocale as SupportedLocale)) {
            return urlLocale as SupportedLocale
        }

        if (urlLocale) {
            return normalizeLocale(urlLocale)
        }

        // 从 Cookie 获取语言偏好
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
            const cookies = cookieHeader
                .split(';')
                .map((cookie) => cookie.trim().split('='))
                .reduce((acc, [key, value]) => {
                    if (key && value) {
                        acc[key] = decodeURIComponent(value)
                    }
                    return acc
                }, {} as Record<string, string>)

            const cookieLocale = cookies.locale || cookies.language || cookies.lang
            if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
                return cookieLocale as SupportedLocale
            }

            if (cookieLocale) {
                return normalizeLocale(cookieLocale)
            }
        }

        // 从自定义头部获取语言
        const customLocale = request.headers.get('x-locale')
            || request.headers.get('x-language')
            || request.headers.get('x-lang')

        if (customLocale) {
            return normalizeLocale(customLocale)
        }

        // 从 Accept-Language 头部获取语言偏好
        const acceptLanguage = request.headers.get('accept-language')
        if (acceptLanguage) {
            const languages = parseAcceptLanguage(acceptLanguage)
            return languages[0] || DEFAULT_LOCALE
        }

        return DEFAULT_LOCALE
    } catch (error) {
        console.warn('Error getting user locale:', error)
        return DEFAULT_LOCALE
    }
}
