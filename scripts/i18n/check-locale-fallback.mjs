import { readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { formatList, listLocaleDirectories, loadLocaleRegistry, localesRoot } from './lib/locale-data.mjs'
import { validateLocaleRegistry } from './lib/registry-rules.mjs'

async function listJsonFiles(locale) {
    const entries = await readdir(path.join(localesRoot, locale), { withFileTypes: true })
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
        .sort()
}

async function main() {
    const registry = await loadLocaleRegistry()
    const directories = await listLocaleDirectories()

    const filesByLocale = {}
    for (const directory of directories) {
        filesByLocale[directory] = await listJsonFiles(directory)
    }

    const errors = validateLocaleRegistry(registry, { directories, filesByLocale })
    if (errors.length === 0) {
        console.log(`[i18n] Locale Registry 校验通过（${registry.LOCALE_REGISTRY.length} 个语言，${directories.length} 个目录）`)
        return
    }

    console.error(`\n[i18n] Locale Registry 校验失败（${errors.length}）：`)
    console.error(formatList(errors))
    process.exitCode = 1
}

main().catch((error) => {
    console.error(`[i18n] Locale Registry 校验失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
