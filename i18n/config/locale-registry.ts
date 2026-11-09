/**
 * Locale Registry：项目内唯一 locale 事实源。
 *
 * - `nuxt.config.ts` 的 `i18n.locales` 由本文件生成，禁止手写第二份。
 * - `server` 侧 detector 与服务端翻译共享同一份定义。
 * - better-auth 的 `zh-Hans` / `zh-Hant` / `default` 只在认证边界映射，不进入本表。
 */

export const DEFAULT_LOCALE = 'zh-CN'

export const LOCALE_COOKIE_KEY = 'i18n_locale'

export type LocaleCode = 'zh-CN' | 'en-US'

export type LocaleReadiness = 'draft' | 'ui-ready' | 'seo-ready'

export interface LocaleDefinition {
    /** 项目内部唯一标识（BCP 47） */
    code: LocaleCode
    /** 语言切换器展示名 */
    name: string
    /** 该语言自己的写法 */
    nativeName: string
    dir: 'ltr' | 'rtl'
    default: boolean
    /** 回退链，首项为自身 */
    fallbackChain: LocaleCode[]
    /** 路由前缀（`prefix_except_default` 下默认语言为空） */
    routePrefix: string
    readiness: LocaleReadiness
    switchable: boolean
    indexable: boolean
    /** `i18n/locales/` 下的消息文件，按数组顺序加载并覆盖 */
    files: string[]
}

export const LOCALE_REGISTRY: LocaleDefinition[] = [
    {
        code: 'zh-CN',
        name: '简体中文',
        nativeName: '简体中文',
        dir: 'ltr',
        default: true,
        fallbackChain: ['zh-CN'],
        routePrefix: '',
        readiness: 'seo-ready',
        switchable: true,
        indexable: true,
        files: ['zh-CN/common.json', 'zh-CN/validation.json'],
    },
    {
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
        default: false,
        fallbackChain: ['en-US', 'zh-CN'],
        routePrefix: '/en-US',
        readiness: 'ui-ready',
        switchable: true,
        indexable: false,
        files: ['en-US/common.json', 'en-US/validation.json'],
    },
]

/** 认证层（better-auth）locale → 项目 locale 的边界映射 */
const AUTH_LOCALE_ALIASES: Record<string, LocaleCode> = {
    'zh-Hans': 'zh-CN',
    zh: 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-Hant': 'zh-CN',
    en: 'en-US',
    'en-US': 'en-US',
    default: DEFAULT_LOCALE,
}

/**
 * 把任意来源的 locale 归一化为 Registry 内的 code，无法识别时回退默认语言。
 */
export function normalizeDetectedLocale(input?: string | null): LocaleCode {
    if (!input) {
        return DEFAULT_LOCALE
    }

    const raw = String(input).trim()
    if (!raw) {
        return DEFAULT_LOCALE
    }

    const exact = LOCALE_REGISTRY.find((locale) => locale.code.toLowerCase() === raw.toLowerCase())
    if (exact) {
        return exact.code
    }

    const alias = AUTH_LOCALE_ALIASES[raw] ?? AUTH_LOCALE_ALIASES[raw.split('-')[0] ?? '']
    return alias ?? DEFAULT_LOCALE
}

export function getLocaleDefinition(code: string): LocaleDefinition | undefined {
    return LOCALE_REGISTRY.find((locale) => locale.code === code)
}

/**
 * 去掉路径上的 locale 前缀（`/en-US/login` → `/login`）。
 * 用于路由守卫等按业务路径判断的场景；默认语言无前缀，原样返回。
 */
export function stripLocalePrefix(path: string): string {
    for (const locale of LOCALE_REGISTRY) {
        if (!locale.routePrefix) {
            continue
        }
        if (path === locale.routePrefix) {
            return '/'
        }
        if (path.startsWith(`${locale.routePrefix}/`)) {
            return path.slice(locale.routePrefix.length) || '/'
        }
    }
    return path
}
