import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 仓库根目录（scripts/i18n/lib → scripts/i18n → scripts → root） */
export const projectRoot = path.resolve(__dirname, '..', '..', '..')
export const localesRoot = path.join(projectRoot, 'i18n', 'locales')
export const registryPath = path.join(projectRoot, 'i18n', 'config', 'locale-registry.ts')

/** 默认语言与回退语言必须使用 CJK 判定“是否翻译”，与翻译文案本身无关 */
export const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u

export function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 把嵌套语言对象拍平成 `a.b.c` 键值对。
 * @param {unknown} value
 * @param {string} [prefix]
 * @returns {{ key: string, value: unknown }[]}
 */
export function flattenMessages(value, prefix = '') {
    if (!isPlainObject(value)) {
        return prefix ? [{ key: prefix, value }] : []
    }

    const entries = []
    for (const [segment, child] of Object.entries(value)) {
        const key = prefix ? `${prefix}.${segment}` : segment
        if (isPlainObject(child)) {
            entries.push(...flattenMessages(child, key))
        } else {
            entries.push({ key, value: child })
        }
    }
    return entries
}

/**
 * 读取 Locale Registry。项目引擎要求 Node ≥ 22.22，可直接导入 `.ts`（类型擦除）。
 * @returns {Promise<{ DEFAULT_LOCALE: string, LOCALE_REGISTRY: Array<Record<string, unknown>> }>}
 */
export async function loadLocaleRegistry() {
    return import(pathToFileURL(registryPath).href)
}

/** @returns {Promise<string[]>} */
export async function listLocaleDirectories() {
    const entries = await readdir(localesRoot, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
}

export function parseJson(content, filePath) {
    try {
        return JSON.parse(content)
    } catch (error) {
        throw new Error(`无法解析 JSON：${path.relative(projectRoot, filePath)}（${error instanceof Error ? error.message : String(error)}）`)
    }
}

/**
 * 读取某个 locale 下的全部 JSON 模块并拍平。
 * @param {string} locale
 * @returns {Promise<{ locale: string, files: string[], modules: Map<string, unknown>, flat: Map<string, unknown>, duplicates: { key: string, files: string[] }[] }>}
 */
export async function loadLocaleMessages(locale) {
    const localeDir = path.join(localesRoot, locale)
    const entries = await readdir(localeDir, { withFileTypes: true })
    const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
        .sort()

    const modules = new Map()
    const flat = new Map()
    const owners = new Map()
    const duplicates = []

    for (const file of files) {
        const content = parseJson(await readFile(path.join(localeDir, file), 'utf8'), path.join(localeDir, file))
        modules.set(file, content)
        for (const { key, value } of flattenMessages(content)) {
            if (flat.has(key)) {
                duplicates.push({ key, files: [owners.get(key) ?? '', file] })
                continue
            }
            flat.set(key, value)
            owners.set(key, file)
        }
    }

    return { locale, files, modules, flat, duplicates }
}

/**
 * 以基准语言为准，找出目标语言缺失与多余的键。
 * @param {Map<string, unknown>} base
 * @param {Map<string, unknown>} target
 */
export function diffFlatKeys(base, target) {
    const missing = [...base.keys()].filter((key) => !target.has(key)).sort()
    const extra = [...target.keys()].filter((key) => !base.has(key)).sort()
    return { missing, extra }
}

/** vue-i18n 命名占位符：`{name}`、`{count, number}`、`{0}`；`{'@'}` 属字面量转义，不是占位符 */
const PLACEHOLDER_PATTERN = /\{([^{}]*)\}/gu
const PLACEHOLDER_NAME_PATTERN = /^(?:[A-Za-z_$][\w$]*|\d+)$/u

/**
 * 抽取单条文案中的占位符名（去重排序）。
 * 只识别简单命名 / 位置占位符；复数、链接消息等嵌套语法不在此展开。
 * @param {unknown} value
 * @returns {string[]}
 */
export function extractPlaceholders(value) {
    if (typeof value !== 'string') {
        return []
    }
    const names = new Set()
    for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
        const token = match[1].trim()
        if (!token || token.startsWith('\'')) {
            continue
        }
        const name = token.split(',')[0].trim()
        if (PLACEHOLDER_NAME_PATTERN.test(name)) {
            names.add(name)
        }
    }
    return [...names].sort()
}

/**
 * 逐键比较占位符集合（双向）。缺键由 `diffFlatKeys` 报告，这里跳过，避免重复计数。
 * @param {Map<string, unknown>} base
 * @param {Map<string, unknown>} target
 * @returns {{ key: string, missing: string[], extra: string[] }[]}
 */
export function diffPlaceholders(base, target) {
    const diffs = []
    for (const [key, baseValue] of base) {
        if (!target.has(key)) {
            continue
        }
        const baseNames = extractPlaceholders(baseValue)
        const targetNames = extractPlaceholders(target.get(key))
        const baseSet = new Set(baseNames)
        const targetSet = new Set(targetNames)
        const missing = baseNames.filter((name) => !targetSet.has(name))
        const extra = targetNames.filter((name) => !baseSet.has(name))
        if (missing.length > 0 || extra.length > 0) {
            diffs.push({ key, missing, extra })
        }
    }
    return diffs
}

export function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/**
 * 判断源码里是否以完整键名引用了翻译键。
 * 用前后边界避免 `validation.invalid` 误命中 `validation.invalidValue`。
 * @param {string} haystack
 * @param {string} key
 */
export function hasKeyReference(haystack, key) {
    const pattern = new RegExp(`(?<![\\w.-])${escapeRegExp(key)}(?![\\w.-])`, 'u')
    return pattern.test(haystack)
}

/**
 * 抽取源码中 `t('...')` / `$t('...')` / `te('...')` 的字面量键。
 * 排除 `format(` / `set(` 等以 t 结尾的普通函数名；模板字符串与拼接表达式视为动态键，不在此列出。
 * @param {string} text
 * @returns {string[]}
 */
export function extractKeyLiterals(text) {
    const keys = new Set()
    const patterns = [
        // t('a.b') / $t('a.b') / te('a.b') / $te('a.b')：要求引号后紧跟逗号或右括号，排除拼接表达式
        /(?<![\w$])(?:\$te|\$t|te|t)\(\s*(['"])((?:\\[\s\S]|(?!\1)[^\\\n])*)\1\s*[,)]/gu,
        // t(`a.b`)：无插值的模板字符串
        /(?<![\w$])(?:\$te|\$t|te|t)\(\s*`([^`$]*)`\s*[,)]/gu,
        // <i18n-t keypath="a.b">
        /\bkeypath\s*=\s*(['"])([^'"]+)\1/gu,
    ]
    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
            const key = match[2] ?? match[1]
            if (!/^[A-Za-z][\w-]*(?:\.[\w-]+)+$/u.test(key)) {
                continue
            }
            keys.add(key)
        }
    }
    // usePageMeta('title.key', 'subtitle.key')：逐个提取参数中的字符串字面量
    const pageMetaPattern = /\busePageMeta\(([^)]*)\)/gu
    let metaMatch
    while ((metaMatch = pageMetaPattern.exec(text)) !== null) {
        const literalPattern = /(['"])([^'"]+)\1/gu
        let literalMatch
        while ((literalMatch = literalPattern.exec(metaMatch[1])) !== null) {
            const key = literalMatch[2]
            if (/^[A-Za-z][\w-]*(?:\.[\w-]+)+$/u.test(key)) {
                keys.add(key)
            }
        }
    }
    return [...keys].sort()
}

/**
 * 找出源码引用了但默认语言包不存在的键（反向校验）。
 * @param {Iterable<string>} sourceKeys
 * @param {Set<string> | Map<string, unknown>} knownKeys
 * @param {Iterable<string>} [allowedKeys]
 * @returns {string[]}
 */
export function findUnknownSourceKeys(sourceKeys, knownKeys, allowedKeys = []) {
    const allowed = allowedKeys instanceof Set ? allowedKeys : new Set(allowedKeys)
    return [...sourceKeys]
        .filter((key) => !knownKeys.has(key) && !allowed.has(key))
        .sort()
}

/**
 * 汇总源码中引用的字面量键及其来源文件。
 * @returns {Promise<Map<string, string[]>>}
 */
export async function collectSourceKeyLiterals() {
    const files = []
    for (const root of SOURCE_ROOTS) {
        await collectTextFiles(path.join(projectRoot, root), files)
    }

    const result = new Map()
    for (const file of files) {
        const text = await readFile(file, 'utf8')
        for (const key of extractKeyLiterals(text)) {
            const relative = path.relative(projectRoot, file)
            const owners = result.get(key)
            if (owners) {
                owners.push(relative)
            } else {
                result.set(key, [relative])
            }
        }
    }
    return result
}

export function formatList(items, limit = 50) {
    if (items.length <= limit) {
        return items.map((item) => `  - ${item}`).join('\n')
    }
    const rest = items.length - limit
    return `${items.slice(0, limit).map((item) => `  - ${item}`).join('\n')}\n  ... 还有 ${rest} 项`
}

const SOURCE_ROOTS = ['app.vue', 'error.vue', 'pages', 'components', 'layouts', 'composables', 'server', 'utils', 'plugins', 'middleware', 'lib']
const SOURCE_EXTENSIONS = new Set(['.vue', '.ts'])
const IGNORED_DIRECTORIES = new Set(['node_modules', '.nuxt', '.output', 'dist', 'coverage', 'test-results', 'playwright-report', '.git'])

async function collectTextFiles(targetPath, files) {
    const fileStat = await stat(targetPath)
    if (fileStat.isDirectory()) {
        const entries = await readdir(targetPath, { withFileTypes: true })
        for (const entry of entries) {
            if (IGNORED_DIRECTORIES.has(entry.name)) {
                continue
            }
            await collectTextFiles(path.join(targetPath, entry.name), files)
        }
        return
    }
    if (fileStat.isFile() && SOURCE_EXTENSIONS.has(path.extname(targetPath))) {
        files.push(targetPath)
    }
}

/**
 * 汇总源码文本，用于判断语言包中的键是否仍被引用。
 * 只扫描应用运行时目录，不扫描测试、脚本与文档。
 * @returns {Promise<string>}
 */
export async function collectSourceText() {
    const files = []
    for (const root of SOURCE_ROOTS) {
        await collectTextFiles(path.join(projectRoot, root), files)
    }

    const chunks = await Promise.all(files.map((file) => readFile(file, 'utf8')))
    return chunks.join('\n')
}
