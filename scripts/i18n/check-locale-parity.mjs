import process from 'node:process'
import { diffFlatKeys, formatList, listLocaleDirectories, loadLocaleMessages, loadLocaleRegistry } from './lib/locale-data.mjs'

async function main() {
    const registry = await loadLocaleRegistry()
    const defaultLocale = registry.DEFAULT_LOCALE
    const localeCodes = registry.LOCALE_REGISTRY.map((locale) => String(locale.code))
    const directories = await listLocaleDirectories()
    const errors = []

    for (const directory of directories) {
        if (!localeCodes.includes(directory)) {
            errors.push(`i18n/locales/${directory} 未在 Locale Registry 中登记`)
        }
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

        const target = await loadLocaleMessages(locale)
        if (target.duplicates.length > 0) {
            errors.push(`${locale} 存在跨模块重复键：${target.duplicates.map((item) => item.key).join(', ')}`)
        }

        const baseFiles = [...base.files].sort()
        const targetFiles = [...target.files].sort()
        const missingFiles = baseFiles.filter((file) => !targetFiles.includes(file))
        const extraFiles = targetFiles.filter((file) => !baseFiles.includes(file))
        if (missingFiles.length > 0) {
            errors.push(`${locale} 缺少语言文件：${missingFiles.join(', ')}`)
        }
        if (extraFiles.length > 0) {
            errors.push(`${locale} 存在基准语言没有的语言文件：${extraFiles.join(', ')}`)
        }

        const { missing, extra } = diffFlatKeys(base.flat, target.flat)
        if (missing.length > 0) {
            errors.push(`${locale} 缺少键（${missing.length}）`)
        }
        if (extra.length > 0) {
            errors.push(`${locale} 多余键（${extra.length}）`)
        }
        if (missing.length > 0 || extra.length > 0) {
            console.error(`\n[i18n] ${locale} 与 ${defaultLocale} 的键差异`)
            if (missing.length > 0) {
                console.error(`  缺少：\n${formatList(missing)}`)
            }
            if (extra.length > 0) {
                console.error(`  多余：\n${formatList(extra)}`)
            }
        }

        for (const [key, value] of target.flat) {
            if (typeof value !== 'string') {
                errors.push(`${locale} 的 ${key} 不是字符串（结构不一致）`)
            }
        }
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
