/**
 * 消息模块注册表：模块与 key group、路由与按需加载映射的唯一事实源。
 *
 * 执行口径见 [国际化实施方案](../../docs/standards/i18n.md) §4：
 * - 目录 `i18n/locales/<locale>/<module>.json`，模块名即文件名；
 * - `LOCALE_CORE_MODULES` 由 `@nuxtjs/i18n` 的 `files[]` 首屏装载，其余模块由
 *   `locale-runtime-loader` 在进入对应路由 / 场景时按需合并；
 * - key group 只用于审计归属（如重复键候选），合并不依赖它。
 *
 * 本文件不导入任何运行时依赖，可被 `nuxt.config.ts`、服务端与治理脚本共用。
 */

/** 模块全集（顺序即 `LOCALE_MESSAGE_MODULE_ORDER`，也决定合并顺序） */
export const LOCALE_MESSAGE_MODULES = [
    'app',
    'common',
    'errors',
    'validation',
    'auth',
    'profile',
    'security',
    'oauth',
    'sso',
    'admin',
    'admin-users',
    'admin-oauth',
    'admin-sso',
    'admin-logs',
    'demo',
    'email',
    'server-only',
] as const

export type LocaleMessageModule = (typeof LOCALE_MESSAGE_MODULES)[number]

/** 首屏 core 模块：由 `i18n.locales[].files` 预装，路由切换不再重复加载 */
export const LOCALE_CORE_MODULES = [
    'app',
    'common',
    'errors',
    'validation',
    'auth',
] as const satisfies readonly LocaleMessageModule[]

/** 模块 → key 前缀（审计归属用；后台业务域沿用 `admin.*` 既有路径） */
export const LOCALE_MESSAGE_MODULE_KEY_GROUPS: Record<LocaleMessageModule, readonly string[]> = {
    app: ['app', 'footer', 'language'],
    common: ['common'],
    errors: ['errors'],
    validation: ['validation'],
    auth: ['auth'],
    profile: ['profile'],
    security: ['security'],
    oauth: ['oauth'],
    sso: ['sso'],
    admin: ['admin'],
    'admin-users': ['admin.users'],
    'admin-oauth': ['admin.oauth'],
    'admin-sso': ['admin.sso'],
    'admin-logs': ['admin.logs'],
    demo: ['demo'],
    email: ['email'],
    'server-only': ['server'],
}

/** 需要服务端装配（无路由）的模块：由服务端按场景显式加载 */
export const LOCALE_SERVER_MODULES = ['email', 'server-only'] as const satisfies readonly LocaleMessageModule[]

const CORE_MODULE_SET: ReadonlySet<string> = new Set(LOCALE_CORE_MODULES)

export function isCoreLocaleMessageModule(moduleName: string): boolean {
    return CORE_MODULE_SET.has(moduleName)
}

export function isLocaleMessageModule(moduleName: string): moduleName is LocaleMessageModule {
    return (LOCALE_MESSAGE_MODULES as readonly string[]).includes(moduleName)
}

/**
 * 客户端懒加载模块：模块全集减去 core（首屏预装）与 server 模块（服务端装配）。
 *
 * 运行时加载器的 `import.meta.glob` 只覆盖这些模块，避免把 core 文案二次打包成
 * 永不触达的 chunk（阶段 5 M2 Review Gate B1）。
 */
export function getClientLazyLocaleMessageModules(): LocaleMessageModule[] {
    const serverModules = new Set<string>(LOCALE_SERVER_MODULES)
    return LOCALE_MESSAGE_MODULES.filter(
        (moduleName) => !CORE_MODULE_SET.has(moduleName) && !serverModules.has(moduleName),
    )
}

/** 指定模块在某个 locale 下的语言文件路径（相对 `i18n/locales/`） */
export function getLocaleMessageFilePaths(
    locale: string,
    modules: readonly LocaleMessageModule[] = LOCALE_MESSAGE_MODULES,
): string[] {
    return modules.map((moduleName) => `${locale}/${moduleName}.json`)
}

/** 首屏预装的语言文件（core 模块），供 `@nuxtjs/i18n` 的 `files[]` 使用 */
export function getEagerLocaleMessageFilePaths(locale: string): string[] {
    return getLocaleMessageFilePaths(locale, LOCALE_CORE_MODULES)
}

/**
 * 归一化路由路径：去 query / hash、补前导斜杠，并剥离 locale 前缀。
 *
 * 与 Locale Registry 的 `routePrefix` 同构（`prefix_except_default` 下为 `/en-US` 形态），
 * 这里用形态匹配而不是读取 Registry，避免 Registry → 模块表 → Registry 的循环依赖。
 */
export function normalizeLocaleRoutePath(path: string): string {
    const pathname = path.split('?')[0]?.split('#')[0] ?? '/'
    const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
    const withoutLocalePrefix = withLeadingSlash.replace(/^\/[a-z]{2}(?:-[a-z]{2,4})?(?=\/|$)/iu, '')
    return withoutLocalePrefix || '/'
}

interface RouteModuleRule {
    pattern: RegExp
    modules: LocaleMessageModule[]
}

/** 后台按业务域细分；`admin` 壳层对所有 `/admin/**` 生效 */
const ROUTE_MODULE_RULES: RouteModuleRule[] = [
    { pattern: /^\/(?:login|register|forgot-password|change-password|quick-login)(?:\/|$)/u, modules: ['auth'] },
    { pattern: /^\/sso-login(?:\/|$)/u, modules: ['sso'] },
    { pattern: /^\/profile(?:\/|$)/u, modules: ['profile'] },
    { pattern: /^\/security(?:\/|$)/u, modules: ['security'] },
    { pattern: /^\/oauth(?:\/|$)/u, modules: ['oauth'] },
    { pattern: /^\/admin(?:\/|$)/u, modules: ['admin'] },
    { pattern: /^\/admin\/users(?:\/|$)/u, modules: ['admin-users'] },
    { pattern: /^\/admin\/oauth(?:\/|$)/u, modules: ['admin-oauth'] },
    { pattern: /^\/admin\/sso(?:\/|$)/u, modules: ['admin-sso'] },
    { pattern: /^\/admin\/logs(?:\/|$)/u, modules: ['admin-logs'] },
]

/** 路由 → 模块：core 为下限，再按规则叠加；`demoMode` 额外加载 `demo` */
export function resolveLocaleMessageModulesForPath(
    path: string,
    options?: { demoMode?: boolean },
): LocaleMessageModule[] {
    const modules = new Set<LocaleMessageModule>(LOCALE_CORE_MODULES)
    const normalizedPath = normalizeLocaleRoutePath(path)

    for (const rule of ROUTE_MODULE_RULES) {
        if (!rule.pattern.test(normalizedPath)) {
            continue
        }
        for (const moduleName of rule.modules) {
            modules.add(moduleName)
        }
    }

    if (options?.demoMode) {
        modules.add('demo')
    }

    return LOCALE_MESSAGE_MODULES.filter((moduleName) => modules.has(moduleName))
}
