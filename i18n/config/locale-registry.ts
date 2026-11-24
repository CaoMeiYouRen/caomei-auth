/**
 * Locale Registry：项目内唯一 locale 事实源。
 *
 * - `nuxt.config.ts` 的 `i18n.locales` 由本文件生成，禁止手写第二份。
 * - `server` 侧 detector 与服务端翻译共享同一份定义。
 * - better-auth 的 `zh-Hans` / `zh-Hant` / `default` 只在认证边界映射，不进入本表。
 * - 目标语言面与 caomei-ui 1.4.0 的 10 语对齐；`enabled` 控制当前实际启用的语言。
 */

/* 治理脚本用 Node 类型擦除直接 import 本文件，相对 import 必须带 `.ts` 扩展名 */
import { getLocaleMessageFilePaths } from './locale-modules.ts'

export const DEFAULT_LOCALE = 'zh-CN'

export const LOCALE_COOKIE_KEY = 'i18n_locale'

/** 目标语言全集（与 caomei-ui 内建语言一致）；顺序即语言切换器的展示顺序 */
export const LOCALE_CODES = [
    'zh-CN',
    'en-US',
    'zh-TW',
    'ja-JP',
    'ko-KR',
    'es-ES',
    'fr-FR',
    'de-DE',
    'ru-RU',
    'pt-BR',
] as const

export type LocaleCode = typeof LOCALE_CODES[number]

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
    /** 是否在当前版本启用（未启用语言不生成路由、不进切换器、不可被探测器命中） */
    enabled: boolean
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
        enabled: true,
        fallbackChain: ['zh-CN'],
        routePrefix: '',
        readiness: 'seo-ready',
        switchable: true,
        indexable: true,
        files: getLocaleMessageFilePaths('zh-CN'),
    },
    {
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
        default: false,
        enabled: true,
        fallbackChain: ['en-US', 'zh-CN'],
        routePrefix: '/en-US',
        /* 文案与视觉基线已就绪，放开索引 */
        readiness: 'seo-ready',
        switchable: true,
        indexable: true,
        files: getLocaleMessageFilePaths('en-US'),
    },
    {
        code: 'zh-TW',
        name: '繁體中文',
        nativeName: '繁體中文',
        dir: 'ltr',
        default: false,
        enabled: true,
        fallbackChain: ['zh-TW', 'zh-CN', 'en-US'],
        routePrefix: '/zh-TW',
        /* 机翻 + 术语表校订完成（未做母语终审），先以 ui-ready 上线：可切换 / 可访问，但不进入索引 */
        readiness: 'ui-ready',
        switchable: true,
        indexable: false,
        files: getLocaleMessageFilePaths('zh-TW'),
    },
    {
        code: 'ja-JP',
        name: '日本語',
        nativeName: '日本語',
        dir: 'ltr',
        default: false,
        enabled: true,
        fallbackChain: ['ja-JP', 'en-US', 'zh-CN'],
        routePrefix: '/ja-JP',
        /* 全量机翻 draft 上线（未做母语审校），先以 ui-ready 开放切换与访问，但不进入索引 */
        readiness: 'ui-ready',
        switchable: true,
        indexable: false,
        files: getLocaleMessageFilePaths('ja-JP'),
    },
    {
        code: 'ko-KR',
        name: '한국어',
        nativeName: '한국어',
        dir: 'ltr',
        default: false,
        enabled: true,
        fallbackChain: ['ko-KR', 'en-US', 'zh-CN'],
        routePrefix: '/ko-KR',
        /* 全量机翻 draft 上线（未做母语审校），先以 ui-ready 开放切换与访问，但不进入索引 */
        readiness: 'ui-ready',
        switchable: true,
        indexable: false,
        files: getLocaleMessageFilePaths('ko-KR'),
    },
    {
        code: 'es-ES',
        name: 'Español',
        nativeName: 'Español',
        dir: 'ltr',
        default: false,
        enabled: false,
        fallbackChain: ['es-ES', 'en-US', 'zh-CN'],
        routePrefix: '/es-ES',
        readiness: 'draft',
        switchable: false,
        indexable: false,
        files: getLocaleMessageFilePaths('es-ES'),
    },
    {
        code: 'fr-FR',
        name: 'Français',
        nativeName: 'Français',
        dir: 'ltr',
        default: false,
        enabled: false,
        fallbackChain: ['fr-FR', 'en-US', 'zh-CN'],
        routePrefix: '/fr-FR',
        readiness: 'draft',
        switchable: false,
        indexable: false,
        files: getLocaleMessageFilePaths('fr-FR'),
    },
    {
        code: 'de-DE',
        name: 'Deutsch',
        nativeName: 'Deutsch',
        dir: 'ltr',
        default: false,
        enabled: false,
        fallbackChain: ['de-DE', 'en-US', 'zh-CN'],
        routePrefix: '/de-DE',
        readiness: 'draft',
        switchable: false,
        indexable: false,
        files: getLocaleMessageFilePaths('de-DE'),
    },
    {
        code: 'ru-RU',
        name: 'Русский',
        nativeName: 'Русский',
        dir: 'ltr',
        default: false,
        enabled: false,
        fallbackChain: ['ru-RU', 'en-US', 'zh-CN'],
        routePrefix: '/ru-RU',
        readiness: 'draft',
        switchable: false,
        indexable: false,
        files: getLocaleMessageFilePaths('ru-RU'),
    },
    {
        code: 'pt-BR',
        name: 'Português (Brasil)',
        nativeName: 'Português (Brasil)',
        dir: 'ltr',
        default: false,
        enabled: false,
        fallbackChain: ['pt-BR', 'en-US', 'zh-CN'],
        routePrefix: '/pt-BR',
        readiness: 'draft',
        switchable: false,
        indexable: false,
        files: getLocaleMessageFilePaths('pt-BR'),
    },
]

/** 当前启用的语言：只有这些语言会生成路由、进入切换器并参与语言协商 */
export const ENABLED_LOCALES = LOCALE_REGISTRY.filter((locale) => locale.enabled === true)

export const ENABLED_LOCALE_CODES = ENABLED_LOCALES.map((locale) => locale.code)

const ENABLED_LOCALE_CODE_SET = new Set<string>(ENABLED_LOCALE_CODES)

/** 是否属于已启用语言（加载器 / 守卫共用，避免各写一份判定） */
export function isEnabledLocaleCode(code: string): code is LocaleCode {
    return ENABLED_LOCALE_CODE_SET.has(code)
}

/** 认证层（better-auth）locale → 项目 locale 的边界映射 */
const AUTH_LOCALE_ALIASES: Record<string, LocaleCode> = {
    'zh-Hans': 'zh-CN',
    zh: 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-Hant': 'zh-TW',
    'zh-TW': 'zh-TW',
    en: 'en-US',
    'en-US': 'en-US',
    ja: 'ja-JP',
    'ja-JP': 'ja-JP',
    ko: 'ko-KR',
    'ko-KR': 'ko-KR',
    es: 'es-ES',
    'es-ES': 'es-ES',
    fr: 'fr-FR',
    'fr-FR': 'fr-FR',
    de: 'de-DE',
    'de-DE': 'de-DE',
    ru: 'ru-RU',
    'ru-RU': 'ru-RU',
    pt: 'pt-BR',
    'pt-BR': 'pt-BR',
    default: DEFAULT_LOCALE,
}

/** 认证层别名查表：用 `hasOwn` 过滤 `toString` / `constructor` 这类原型链键。 */
function matchAuthLocaleAlias(input: string): LocaleCode | undefined {
    return Object.hasOwn(AUTH_LOCALE_ALIASES, input) ? AUTH_LOCALE_ALIASES[input] : undefined
}

/**
 * 把任意来源的 locale 归一化为**已启用**的 Registry code；无法识别或未启用时返回 undefined。
 *
 * 与 `normalizeDetectedLocale` 的区别：调用方需要区分“未识别”与“默认语言”时使用，
 * 例如在语言协商中跳过不支持的语言。未启用的语言按“不支持”处理；
 * 例外：`zh-Hant` 在 zh-TW 未启用时回退 zh-CN，避免协商落到英文。
 */
export function matchDetectedLocale(input?: string | null): LocaleCode | undefined {
    if (!input) {
        return undefined
    }

    const raw = String(input).trim()
    if (!raw) {
        return undefined
    }

    const exact = ENABLED_LOCALES.find((locale) => locale.code.toLowerCase() === raw.toLowerCase())
    if (exact) {
        return exact.code
    }

    const aliased = matchAuthLocaleAlias(raw) ?? matchAuthLocaleAlias(raw.split('-')[0] ?? '')
    if (aliased && isEnabledLocaleCode(aliased)) {
        return aliased
    }
    /* 仅在 zh-TW 停用时生效（当前 Registry 已启用 zh-TW，本分支不可达）：
     * 繁体用户回退简体，避免按 tag 协商时被跳过而落到英文 */
    if (aliased === 'zh-TW' && isEnabledLocaleCode('zh-CN')) {
        return 'zh-CN'
    }
    return undefined
}

/**
 * 把任意来源的 locale 归一化为**已启用**的 Registry code，无法识别时回退默认语言。
 */
export function normalizeDetectedLocale(input?: string | null): LocaleCode {
    return matchDetectedLocale(input) ?? DEFAULT_LOCALE
}

export function getLocaleDefinition(code: string): LocaleDefinition | undefined {
    return LOCALE_REGISTRY.find((locale) => locale.code === code)
}

/**
 * 去掉路径上的 locale 前缀（`/en-US/login` → `/login`）。
 * 只处理已启用语言；停用语言不生成路由，按普通路径原样返回。
 */
export function stripLocalePrefix(path: string): string {
    for (const locale of ENABLED_LOCALES) {
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
