import { diffFlatKeys, diffPlaceholders, formatList, loadLocaleMessages } from './locale-data.mjs'

/**
 * 语言目录级差异审计（口径见 docs/standards/i18n.md §7.1）。
 *
 * 同一套判定同时服务已启用与未启用语言：已启用语言缺失即阻断发布；
 * 未启用语言由调用方决定目录缺失时是否放行、是否用 `--allow-incomplete` 降级。
 */

/**
 * 比较目标语言与基准语言目录：跨模块重复键、文件、键集合、占位符与值类型。
 * @param {object} options
 * @param {string} options.locale
 * @param {{ files: string[], flat: Map<string, unknown>, duplicates: { key: string }[] }} options.target
 * @param {{ files: string[], flat: Map<string, unknown> }} options.base
 * @param {string} options.baseLocale
 */
export function auditLocaleDirectory({ locale, target, base, baseLocale }) {
    const errors = []
    const details = {
        missingFiles: [],
        extraFiles: [],
        missing: [],
        extra: [],
        placeholderDiffs: [],
    }

    if (target.duplicates.length > 0) {
        errors.push(`${locale} 存在跨模块重复键：${target.duplicates.map((item) => item.key).join(', ')}`)
    }

    const baseFiles = [...base.files].sort()
    const targetFiles = [...target.files].sort()
    details.missingFiles = baseFiles.filter((file) => !targetFiles.includes(file))
    details.extraFiles = targetFiles.filter((file) => !baseFiles.includes(file))
    if (details.missingFiles.length > 0) {
        errors.push(`${locale} 缺少语言文件：${details.missingFiles.join(', ')}`)
    }
    if (details.extraFiles.length > 0) {
        errors.push(`${locale} 存在基准语言没有的语言文件：${details.extraFiles.join(', ')}`)
    }

    const { missing, extra } = diffFlatKeys(base.flat, target.flat)
    details.missing = missing
    details.extra = extra
    if (missing.length > 0) {
        errors.push(`${locale} 缺少键（${missing.length}）`)
    }
    if (extra.length > 0) {
        errors.push(`${locale} 多余键（${extra.length}）`)
    }

    details.placeholderDiffs = diffPlaceholders(base.flat, target.flat)
    if (details.placeholderDiffs.length > 0) {
        errors.push(`${locale} 占位符不一致（${details.placeholderDiffs.length}）`)
    }

    for (const [key, value] of target.flat) {
        if (typeof value !== 'string') {
            errors.push(`${locale} 的 ${key} 不是字符串（结构不一致）`)
        }
    }

    return { locale, errors, details }
}

/**
 * 遍历未启用语言：目录缺失进 `pending`，目录存在则执行目录级审计；
 * `allowIncomplete` 中的语言（分批补数据白名单）降级为 warning，不阻断发布。
 * @param {object} options
 * @param {string[]} options.locales
 * @param {string[]} options.directories
 * @param {{ files: string[], flat: Map<string, unknown> }} options.base
 * @param {string} options.baseLocale
 * @param {string[]} [options.allowIncomplete]
 * @param {(locale: string) => Promise<Parameters<typeof auditLocaleDirectory>[0]['target']>} [options.loadMessages]
 */
export async function auditDisabledLocales({
    locales,
    directories,
    base,
    baseLocale,
    allowIncomplete = [],
    loadMessages = loadLocaleMessages,
}) {
    const errors = []
    const warnings = []
    const pending = []
    const reports = []

    for (const locale of locales) {
        if (!directories.includes(locale)) {
            pending.push(locale)
            continue
        }
        const target = await loadMessages(locale)
        const report = auditLocaleDirectory({ locale, target, base, baseLocale })
        reports.push(report)
        if (report.errors.length === 0) {
            continue
        }
        if (allowIncomplete.includes(locale)) {
            warnings.push(report)
        } else {
            errors.push(...report.errors)
        }
    }

    return { errors, warnings, pending, reports }
}

/**
 * 渲染占位符差异明细，供门禁输出定位到键。
 * @param {{ key: string, missing: string[], extra: string[] }[]} diffs
 * @param {number} [limit]
 */
export function formatPlaceholderDiffs(diffs, limit = 50) {
    const lines = diffs.map(({ key, missing, extra }) => {
        const parts = []
        if (missing.length > 0) {
            parts.push(`缺少 ${missing.map((name) => `{${name}}`).join(' ')}`)
        }
        if (extra.length > 0) {
            parts.push(`多余 ${extra.map((name) => `{${name}}`).join(' ')}`)
        }
        return `${key}: ${parts.join('；')}`
    })
    return formatList(lines, limit)
}

/**
 * 解析白名单参数：只接受 `--allow-incomplete=de-DE,es-ES` 形式；
 * 裸参数（空格分隔）按未提供处理并回报 `bare`，由调用方 fail-closed 报错。
 * @param {string[]} argv
 * @returns {{ codes: string[], bare: boolean }}
 */
export function parseAllowIncompleteArg(argv) {
    const prefix = '--allow-incomplete='
    const codes = argv
        .filter((arg) => arg.startsWith(prefix))
        .flatMap((arg) => arg.slice(prefix.length).split(','))
        .map((code) => code.trim())
        .filter(Boolean)
    return { codes, bare: argv.includes('--allow-incomplete') }
}

/**
 * 渲染目录级差异明细（文件 / 键 / 占位符），供门禁输出。
 * @param {ReturnType<typeof auditLocaleDirectory>['details']} details
 */
export function formatLocaleDiffDetails(details) {
    const lines = []
    if (details.missingFiles.length > 0) {
        lines.push(`  缺少语言文件：\n${formatList(details.missingFiles)}`)
    }
    if (details.extraFiles.length > 0) {
        lines.push(`  多余语言文件：\n${formatList(details.extraFiles)}`)
    }
    if (details.missing.length > 0) {
        lines.push(`  缺少键：\n${formatList(details.missing)}`)
    }
    if (details.extra.length > 0) {
        lines.push(`  多余键：\n${formatList(details.extra)}`)
    }
    if (details.placeholderDiffs.length > 0) {
        lines.push(`  占位符：\n${formatPlaceholderDiffs(details.placeholderDiffs)}`)
    }
    return lines.filter(Boolean).join('\n')
}
