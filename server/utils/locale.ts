/**
 * 国际化工具函数
 * 用于检测和管理用户的语言偏好
 */

import type { H3Event } from 'h3'

/**
 * 支持的语言列表
 * 基于 better-auth-localization 支持的语言
 */
export const SUPPORTED_LOCALES = [
    'zh-Hans', // 简体中文
    'zh-Hant', // 繁体中文
    'en', // 英语
    'pt-BR', // 巴西葡萄牙语
    'pt', // 葡萄牙语
    'es', // 西班牙语
    'fr', // 法语
    'de', // 德语
    'ja', // 日语
    'ko', // 韩语
    'ru', // 俄语
    'ar', // 阿拉伯语
    'hi', // 印地语
    'it', // 意大利语
    'nl', // 荷兰语
    'sv', // 瑞典语
    'da', // 丹麦语
    'no', // 挪威语
    'fi', // 芬兰语
    'pl', // 波兰语
    'tr', // 土耳其语
    'th', // 泰语
    'vi', // 越南语
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

/**
 * 默认语言设置
 */
export const DEFAULT_LOCALE: SupportedLocale = 'zh-Hans'
export const FALLBACK_LOCALE: SupportedLocale = 'en'

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

    // 英语变体映射
    'en-US': 'en',
    'en-GB': 'en',
    'en-CA': 'en',
    'en-AU': 'en',
    'en-NZ': 'en',
    'en-ZA': 'en',

    // 葡萄牙语变体映射
    'pt-PT': 'pt',

    // 西班牙语变体映射
    'es-ES': 'es',
    'es-MX': 'es',
    'es-AR': 'es',
    'es-CO': 'es',
    'es-CL': 'es',

    // 法语变体映射
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    'fr-BE': 'fr',
    'fr-CH': 'fr',

    // 德语变体映射
    'de-DE': 'de',
    'de-AT': 'de',
    'de-CH': 'de',

    // 其他语言映射
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'ru-RU': 'ru',
    'it-IT': 'it',
    'nl-NL': 'nl',
    'sv-SE': 'sv',
    'da-DK': 'da',
    'no-NO': 'no',
    'fi-FI': 'fi',
    'pl-PL': 'pl',
    'tr-TR': 'tr',
    'th-TH': 'th',
    'vi-VN': 'vi',
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
        (supportedLocale) => supportedLocale.toLowerCase().startsWith(`${languagePrefix}-`) ||
            supportedLocale.toLowerCase() === languagePrefix,
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
            const [locale, qValue] = lang.trim().split(';q=')
            return {
                locale: locale.trim(),
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
        const customLocale = getHeader(event, 'x-locale') ||
            getHeader(event, 'x-language') ||
            getHeader(event, 'x-lang')

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
export async function detectUserLocale(event: H3Event): Promise<SupportedLocale> {
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
        const urlLocale = url.searchParams.get('locale') ||
            url.searchParams.get('lang') ||
            url.searchParams.get('language')

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
                    acc[key] = decodeURIComponent(value)
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
        const customLocale = request.headers.get('x-locale') ||
            request.headers.get('x-language') ||
            request.headers.get('x-lang')

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
