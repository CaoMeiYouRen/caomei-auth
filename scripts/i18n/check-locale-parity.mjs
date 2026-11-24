import process from 'node:process'
import { formatList, listLocaleDirectories, loadLocaleMessages, loadLocaleRegistry } from './lib/locale-data.mjs'
import { auditDisabledLocales, auditLocaleDirectory, formatLocaleDiffDetails, parseAllowIncompleteArg } from './lib/locale-parity.mjs'

/**
 * 语言目录结构门禁（口径见 docs/standards/i18n.md §7.1）。
 *
 * - 已启用语言：文件 / 键 / 占位符 / 值类型必须与默认语言同构；
 * - 未启用语言：目录未创建只输出待建清单；目录一旦创建即进入同一套同构校验，
 *   确需分批补数据时用 `--allow-incomplete=<locale[,locale]>` 临时降级为 warning。
 * - 位置参数（lint-staged 追加的文件路径）一律忽略，始终审计全量目录。
 */

async function main() {
    const registry = await loadLocaleRegistry()
    const defaultLocale = registry.DEFAULT_LOCALE
    const allLocaleCodes = registry.LOCALE_REGISTRY.map((locale) => String(locale.code))
    const localeCodes = registry.LOCALE_REGISTRY
        .filter((locale) => locale.enabled === true)
        .map((locale) => String(locale.code))
    const disabledLocaleCodes = registry.LOCALE_REGISTRY
        .filter((locale) => locale.enabled !== true)
        .map((locale) => String(locale.code))
    const { codes: allowIncomplete, bare: hasBareAllowIncomplete } = parseAllowIncompleteArg(process.argv)
    const directories = await listLocaleDirectories()
    const errors = []

    for (const directory of directories) {
        if (!allLocaleCodes.includes(directory)) {
            errors.push(`i18n/locales/${directory} 未在 Locale Registry 中登记`)
        }
    }

    if (hasBareAllowIncomplete) {
        errors.push('--allow-incomplete 必须使用等号形式：--allow-incomplete=<locale[,locale]>')
    }

    const unknownAllowIncomplete = allowIncomplete.filter((code) => !disabledLocaleCodes.includes(code))
    if (unknownAllowIncomplete.length > 0) {
        errors.push(`--allow-incomplete 包含未登记的未启用语言：${unknownAllowIncomplete.join(', ')}（可选：${disabledLocaleCodes.join(', ')}）`)
    }

    if (!localeCodes.includes(defaultLocale)) {
        errors.push(`DEFAULT_LOCALE（${defaultLocale}）不在 LOCALE_REGISTRY 中`)
        report(errors)
        return
    }

    const base = await loadLocaleMessages(defaultLocale)
    if (base.duplicates.length > 0) {
        errors.push(`${defaultLocale} 存在跨模块重复键：${base.duplicates.map((item) => item.key).join(', ')}`)
    }

    for (const locale of localeCodes) {
        if (locale === defaultLocale) {
            continue
        }

        if (!directories.includes(locale)) {
            errors.push(`${locale} 在 i18n/locales 下缺少目录`)
            continue
        }

        const reportItem = auditLocaleDirectory({
            locale,
            target: await loadLocaleMessages(locale),
            base,
            baseLocale: defaultLocale,
        })
        errors.push(...reportItem.errors)
        const detailText = formatLocaleDiffDetails(reportItem.details)
        if (detailText) {
            console.error(`\n[i18n] ${locale} 与 ${defaultLocale} 的目录差异`)
            console.error(detailText)
        }
    }

    const disabled = await auditDisabledLocales({
        locales: disabledLocaleCodes,
        directories,
        base,
        baseLocale: defaultLocale,
        allowIncomplete: allowIncomplete.filter((code) => disabledLocaleCodes.includes(code)),
    })
    errors.push(...disabled.errors)

    for (const reportItem of disabled.reports) {
        if (reportItem.errors.length === 0) {
            continue
        }
        const detailText = formatLocaleDiffDetails(reportItem.details)
        if (detailText) {
            console.error(`\n[i18n] 未启用语言 ${reportItem.locale} 与 ${defaultLocale} 的目录差异`)
            console.error(detailText)
        }
    }

    for (const warning of disabled.warnings) {
        console.warn(`[i18n] 警告（--allow-incomplete 降级）：${warning.locale} 尚未与 ${defaultLocale} 同构（${warning.errors.length} 项）`)
    }

    if (disabled.pending.length > 0) {
        console.log(`[i18n] 未启用语言目录未创建（补数据前不阻断）：${disabled.pending.join(', ')}`)
    }

    report(errors)
}

function report(errors) {
    if (errors.length === 0) {
        console.log('[i18n] 语言包结构一致')
        return
    }
    console.error(`\n[i18n] 语言包结构校验失败（${errors.length}）：`)
    console.error(formatList(errors))
    process.exitCode = 1
}

main().catch((error) => {
    console.error(`[i18n] 语言包结构校验失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
