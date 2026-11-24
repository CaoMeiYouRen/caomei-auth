import { isEnabledLocaleCode, normalizeDetectedLocale } from './locale-registry'
import { LOCALE_CORE_MODULES, resolveLocaleMessageModulesForPath, type LocaleMessageModule } from './locale-modules'

/**
 * 运行时消息加载器：按路由 / 场景把非 core 模块并入当前 i18n 实例。
 *
 * 设计口径（见 docs/standards/i18n.md §4 与阶段 5 M2 记录）：
 * - `@nuxtjs/i18n` 的 `files[]` 只装 core 模块，保证首屏体积可控；
 * - 其余客户端模块由本加载器按 `locale-modules` 的路由映射动态 `import()` 并
 *   `mergeLocaleMessage`；server 模块（`email` / `server-only`）不进客户端 glob；
 * - **只合并当前 locale**：两语言 key 同构由 `pnpm i18n:check` 保证，未配置
 *   `fallbackLocale` 时合并回退语言副本不会参与渲染，只会增加 payload；
 * - 同实例同语言已加载的模块不重复合并；chunk 加载失败按「缺文案」降级并允许下次重试。
 */

type LocaleMessages = Record<string, unknown>

interface ComposerLike {
    mergeLocaleMessage: (locale: string, message: LocaleMessages) => void
}

/** 静态语言包路径是否属于已启用语言（路径形态 `../locales/<locale>/<module>.json`） */
export function isEnabledLocaleModulePath(filePath: string): boolean {
    const locale = /^\.\.\/locales\/([^/]+)\/[^/]+\.json$/u.exec(filePath)?.[1]
    return locale ? isEnabledLocaleCode(locale) : false
}

/**
 * 静态懒加载入口：键为 `../locales/<locale>/<module>.json`；只读，仅门禁 / 测试消费，
 * 业务侧请走 `ensureLocaleMessageModules`。
 *
 * 只覆盖客户端懒加载模块（排除 core 与 server）：core 由 `files[]` 预装，server 模块在服务端装配。
 * 未启用语言目录同样用负向模式排除，避免补数据期间的半成品被编入客户端产物；运行期再按
 * Registry 的启用判定过滤一次，作为反向兜底（只剔除多余键，补不回漏排除项）。新增停用语言目录
 * 或启用语言时，须同步负向清单与 `tests/unit/i18n/locale-runtime-loader.spec.ts` 的守卫。
 */
export const localeModuleImporters: Readonly<Record<string, () => Promise<LocaleMessages>>> = Object.freeze(Object.fromEntries(
    Object.entries(import.meta.glob([
        '../locales/**/*.json',
        '!../locales/**/{app,common,errors,validation,auth,email,server-only}.json',
        '!../locales/{es-ES,fr-FR,de-DE,ru-RU,pt-BR}/**/*.json',
    ], {
        import: 'default',
    }) as Record<string, () => Promise<LocaleMessages>>)
        .filter(([filePath]) => isEnabledLocaleModulePath(filePath)),
))

/** 以 i18n 实例为 key 的弱引用缓存：实例销毁后自动释放，避免热更新串状态 */
const loadedModulesRegistry = new WeakMap<object, Map<string, Set<LocaleMessageModule>>>()

function resolveComposer(i18n: unknown): ComposerLike | null {
    if (!i18n || typeof i18n !== 'object') {
        return null
    }

    const candidate = i18n as { mergeLocaleMessage?: unknown, global?: { mergeLocaleMessage?: unknown } }
    if (typeof candidate.mergeLocaleMessage === 'function') {
        return candidate as ComposerLike
    }
    if (candidate.global && typeof candidate.global.mergeLocaleMessage === 'function') {
        return candidate.global as ComposerLike
    }
    return null
}

function getLoadedModules(i18n: object, locale: string): Set<LocaleMessageModule> {
    let localeMap = loadedModulesRegistry.get(i18n)

    if (!localeMap) {
        localeMap = new Map<string, Set<LocaleMessageModule>>()
        loadedModulesRegistry.set(i18n, localeMap)
    }

    const existing = localeMap.get(locale)
    if (existing) {
        return existing
    }

    /* core 模块由 `@nuxtjs/i18n` 首屏装载，运行期只追踪增量模块 */
    const loadedModules = new Set<LocaleMessageModule>(LOCALE_CORE_MODULES)
    localeMap.set(locale, loadedModules)
    return loadedModules
}

async function importLocaleModule(locale: string, moduleName: LocaleMessageModule): Promise<LocaleMessages | null> {
    const importer = localeModuleImporters[`../locales/${locale}/${moduleName}.json`]
    if (!importer) {
        return null
    }

    try {
        return await importer()
    } catch (error) {
        /* 语言包属非关键资源：chunk 拉取失败时降级为缺文案，不阻断页面导航 */
        console.warn(`[i18n] 加载语言模块失败：${locale}/${moduleName}.json`, error)
        return null
    }
}

/**
 * 确保指定模块已并入 i18n 实例（只处理当前语言）。
 *
 * `locale` 接受任意来源（注册表 code、better-auth 别名），统一经 Registry 归一化。
 */
export async function ensureLocaleMessageModules(options: {
    i18n: unknown
    locale: string
    modules: readonly LocaleMessageModule[]
}): Promise<void> {
    const composer = resolveComposer(options.i18n)
    if (!composer || !options.i18n || typeof options.i18n !== 'object') {
        return
    }

    const locale = normalizeDetectedLocale(options.locale)
    const loadedModules = getLoadedModules(options.i18n, locale)

    for (const moduleName of options.modules) {
        if (loadedModules.has(moduleName)) {
            continue
        }

        const messages = await importLocaleModule(locale, moduleName)
        if (!messages) {
            continue
        }

        composer.mergeLocaleMessage(locale, messages)
        loadedModules.add(moduleName)
    }
}

/**
 * 按当前路由装载所需模块。
 *
 * 路由 → 模块的映射是纯函数（`resolveLocaleMessageModulesForPath`），本函数只负责
 * 读取 `i18n` 实例并触发加载，便于在路由中间件与测试中复用。
 */
export async function ensureRouteLocaleMessages(options: {
    i18n: unknown
    locale: string
    path: string
    demoMode?: boolean
}): Promise<void> {
    await ensureLocaleMessageModules({
        i18n: options.i18n,
        locale: options.locale,
        modules: resolveLocaleMessageModulesForPath(options.path, { demoMode: options.demoMode }),
    })
}
