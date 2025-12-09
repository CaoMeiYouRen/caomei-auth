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
