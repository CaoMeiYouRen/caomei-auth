import process from 'node:process'
import {
    CJK_PATTERN,
    collectSourceText,
    diffFlatKeys,
    formatList,
    hasKeyReference,
    loadLocaleMessages,
    loadLocaleRegistry,
} from './lib/locale-data.mjs'

const USAGE = `用法：node scripts/i18n/audit-locale-keys.mjs [选项]

选项：
  --only=all|missing|unused|untranslated  只输出指定维度（默认 all）
  --fail-on-missing                       存在缺失键时退出码为 1
  --fail-on-unused                        存在未使用键时退出码为 1
  --fail-on-untranslated                  存在未翻译候选时退出码为 1
  --help                                  显示帮助

位置参数（lint-staged 传入的文件路径）会被忽略，脚本始终审计全量语言包。`

function parseArgs(argv) {
    const options = {
        only: 'all',
        failOnMissing: false,
        failOnUnused: false,
        failOnUntranslated: false,
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
        } else if (arg.startsWith('-')) {
            throw new Error(`未知参数：${arg}`)
        }
        // 其余位置参数为 lint-staged 传入的文件路径；语言包审计始终覆盖全量
    }

    if (!['all', 'missing', 'unused', 'untranslated'].includes(options.only)) {
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
        unused = [...base.flat.keys()].filter((key) => !hasKeyReference(sourceText, key)).sort()
        printSection('未使用键（源码中找不到完整键名引用；动态拼接会误报）', unused, 'warning')
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
    if (failures.length > 0) {
        console.error(`\n[i18n] 审计未通过：${failures.join('，')}`)
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error(`[i18n] 审计失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
