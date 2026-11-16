import process from 'node:process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
    CJK_PATTERN,
    collectSourceKeyLiterals,
    collectSourceText,
    diffFlatKeys,
    findUnknownSourceKeys,
    formatList,
    hasKeyReference,
    loadLocaleMessages,
    loadLocaleRegistry,
    projectRoot,
} from './lib/locale-data.mjs'

/**
 * 动态拼接键白名单：这些键只以模板字符串形式引用，静态扫描无法命中；逐条登记来源，
 * 避免把「未使用」告警淹没真实问题。
 */
const DYNAMIC_KEY_PATTERNS = [
    {
        pattern: /^auth\.password\.(?:strength|requirements)\./u,
        reason: 'composables/utils/use-password-hints.ts 用 `auth.password.strength.${level}` / `requirements.${level}` 拼接',
    },
    {
        pattern: /^auth\.social\.(?:anonymous|wechat|qq|douyin|weibo)\.(?:name|label|tooltip)$/u,
        reason: 'server/api/social/providers.get.ts 用 `auth.social.${provider}.{name,label,tooltip}` 拼接',
    },
]

const USAGE = `用法：node scripts/i18n/audit-locale-keys.mjs [选项]

选项：
  --only=all|missing|unused|untranslated|source  只输出指定维度（默认 all）
  --fail-on-missing                       存在缺失键时退出码为 1
  --fail-on-unused                        存在未使用键时退出码为 1
  --fail-on-untranslated                  存在未翻译候选时退出码为 1
  --fail-on-unknown-source                源码引用了语言包不存在的键时退出码为 1
  --help                                  显示帮助

位置参数（lint-staged 传入的文件路径）会被忽略，脚本始终审计全量语言包。`

function parseArgs(argv) {
    const options = {
        only: 'all',
        failOnMissing: false,
        failOnUnused: false,
        failOnUntranslated: false,
        failOnUnknownSource: false,
        help: false,
    }

    for (const arg of argv) {
        if (arg === '--help') {
            options.help = true
        } else if (arg.startsWith('--only=')) {
            options.only = arg.slice('--only='.length)
        } else if (arg === '--fail-on-missing') {
            options.failOnMissing = true
        } else if (arg === '--fail-on-unused') {
            options.failOnUnused = true
        } else if (arg === '--fail-on-untranslated') {
            options.failOnUntranslated = true
        } else if (arg === '--fail-on-unknown-source') {
            options.failOnUnknownSource = true
        } else if (arg.startsWith('-')) {
            throw new Error(`未知参数：${arg}`)
        }
        // 其余位置参数为 lint-staged 传入的文件路径；语言包审计始终覆盖全量
    }

    if (!['all', 'missing', 'unused', 'untranslated', 'source'].includes(options.only)) {
        throw new Error(`--only 不支持：${options.only}`)
    }
    return options
}

function printSection(title, items, level) {
    if (items.length === 0) {
        return
    }
    console.log(`\n[${level}] ${title}（${items.length}）`)
    console.log(formatList(items))
}

const SOURCE_ALLOWLIST_PATH = path.join(projectRoot, 'scripts', 'i18n', 'locale-key-source-allowlist.json')

/**
 * 解析反向键校验白名单。每项必须写明 key 与 reason；格式错误直接失败，避免白名单静默失效。
 * @param {string} content
 * @returns {{ keys: Set<string>, entries: { key: string, reason: string }[] }}
 */
export function parseSourceKeyAllowlist(content) {
    const parsed = JSON.parse(content)
    const entries = Array.isArray(parsed) ? parsed : parsed?.keys
    if (!Array.isArray(entries)) {
        throw new Error('locale-key-source-allowlist.json 必须是数组或 { keys: [...] }')
    }
    for (const entry of entries) {
        if (typeof entry?.key !== 'string' || !entry.key || typeof entry?.reason !== 'string' || !entry.reason.trim()) {
            throw new Error(`白名单条目缺少 key 或 reason：${JSON.stringify(entry)}`)
        }
    }
    return { keys: new Set(entries.map((entry) => entry.key)), entries }
}

async function loadSourceKeyAllowlist() {
    return parseSourceKeyAllowlist(await readFile(SOURCE_ALLOWLIST_PATH, 'utf8'))
}

function assertStringValues(locale, flat) {
    const invalid = []
    for (const [key, value] of flat) {
        if (typeof value !== 'string') {
            invalid.push(key)
        }
    }
    if (invalid.length > 0) {
        throw new Error(`${locale} 存在非字符串文案（${invalid.length}）：${invalid.slice(0, 5).join(', ')}`)
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
        console.log(USAGE)
        return
    }

    const registry = await loadLocaleRegistry()
    const defaultLocale = registry.DEFAULT_LOCALE
    const localeCodes = registry.LOCALE_REGISTRY.map((locale) => String(locale.code))
    if (!localeCodes.includes(defaultLocale)) {
        throw new Error(`DEFAULT_LOCALE（${defaultLocale}）不在 LOCALE_REGISTRY 中`)
    }

    const base = await loadLocaleMessages(defaultLocale)
    assertStringValues(defaultLocale, base.flat)

    const targets = []
    for (const code of localeCodes) {
        if (code === defaultLocale) {
            continue
        }
        const messages = await loadLocaleMessages(code)
        assertStringValues(code, messages.flat)
        targets.push(messages)
    }

    console.log(`[i18n] 基准语言：${defaultLocale}（${base.flat.size} 个键）`)
    for (const target of targets) {
        console.log(`[i18n] ${target.locale}：${target.flat.size} 个键`)
    }

    const missingByLocale = new Map()
    const extraByLocale = new Map()
    for (const target of targets) {
        const { missing, extra } = diffFlatKeys(base.flat, target.flat)
        missingByLocale.set(target.locale, missing)
        extraByLocale.set(target.locale, extra)
    }

    const missingTotal = [...missingByLocale.values()].reduce((total, items) => total + items.length, 0)
    const extraTotal = [...extraByLocale.values()].reduce((total, items) => total + items.length, 0)

    if (options.only === 'all' || options.only === 'missing') {
        for (const [locale, missing] of missingByLocale) {
            printSection(`${locale} 缺少键`, missing, 'blocker')
        }
        for (const [locale, extra] of extraByLocale) {
            printSection(`${locale} 多余键`, extra, 'warning')
        }
        if (missingTotal === 0 && extraTotal === 0) {
            console.log('\n[ok] 语言包键一致')
        }
    }

    let unused = []
    if (options.only === 'all' || options.only === 'unused') {
        const sourceText = await collectSourceText()
        const dynamicKeys = []
        unused = [...base.flat.keys()].filter((key) => {
            if (hasKeyReference(sourceText, key)) {
                return false
            }
            const dynamic = DYNAMIC_KEY_PATTERNS.find((entry) => entry.pattern.test(key))
            if (dynamic) {
                dynamicKeys.push(key)
                return false
            }
            return true
        }).sort()
        printSection('未使用键（源码中找不到完整键名引用；动态拼接会误报）', unused, 'warning')
        if (dynamicKeys.length > 0) {
            console.log(`\n[ok] ${dynamicKeys.length} 个动态拼接键已登记（不计入未使用告警）`)
            for (const entry of DYNAMIC_KEY_PATTERNS) {
                const matched = dynamicKeys.filter((key) => entry.pattern.test(key))
                if (matched.length > 0) {
                    console.log(`  - ${matched.length} 个：${entry.reason}`)
                }
            }
        }
    }

    const untranslated = []
    if (options.only === 'all' || options.only === 'untranslated') {
        for (const target of targets) {
            for (const [key, baseValue] of base.flat) {
                const targetValue = target.flat.get(key)
                if (typeof targetValue !== 'string' || !targetValue.trim()) {
                    untranslated.push(`${target.locale}: ${key}（空文案）`)
                    continue
                }
                if (typeof baseValue === 'string' && targetValue === baseValue && CJK_PATTERN.test(baseValue)) {
                    untranslated.push(`${target.locale}: ${key}`)
                }
            }
        }
        printSection('未翻译候选（与默认语言文案完全相同）', untranslated, 'warning')
        if (untranslated.length === 0) {
            console.log('\n[ok] 未发现与默认语言完全相同的译文')
        }
    }

    let unknownSourceKeys = []
    if (options.only === 'all' || options.only === 'source') {
        const sourceKeys = await collectSourceKeyLiterals()
        const allowlist = await loadSourceKeyAllowlist()
        unknownSourceKeys = findUnknownSourceKeys(sourceKeys.keys(), base.flat, allowlist.keys)
        if (unknownSourceKeys.length > 0) {
            const details = unknownSourceKeys.map((key) => `${key}（${(sourceKeys.get(key) ?? []).join(', ')}）`)
            printSection('源码引用但默认语言包缺失的键', details, 'blocker')
        } else {
            console.log('\n[ok] 源码字面量键均存在于默认语言包')
        }
        if (allowlist.entries.length > 0) {
            console.log(`\n[ok] ${allowlist.entries.length} 个白名单键已登记（动态拼接或运行时来源）`)
            const stale = allowlist.entries
                .filter((entry) => !sourceKeys.has(entry.key))
                .map((entry) => `${entry.key}（${entry.reason}）`)
            printSection('白名单未命中的条目（可能已失效，请复核）', stale, 'warning')
        }
    }

    const failures = []
    if (options.failOnMissing && (missingTotal > 0 || extraTotal > 0)) {
        failures.push(`缺失 ${missingTotal} / 多余 ${extraTotal}`)
    }
    if (options.failOnUnused && unused.length > 0) {
        failures.push(`未使用 ${unused.length}`)
    }
    if (options.failOnUntranslated && untranslated.length > 0) {
        failures.push(`未翻译候选 ${untranslated.length}`)
    }
    if (options.failOnUnknownSource && unknownSourceKeys.length > 0) {
        failures.push(`源码引用缺失键 ${unknownSourceKeys.length}`)
    }
    if (failures.length > 0) {
        console.error(`\n[i18n] 审计未通过：${failures.join('，')}`)
        process.exitCode = 1
    }
}

const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
    main().catch((error) => {
        console.error(`[i18n] 审计失败：${error instanceof Error ? error.message : String(error)}`)
        process.exitCode = 1
    })
}
