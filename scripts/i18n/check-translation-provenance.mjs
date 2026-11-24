import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { formatList, loadLocaleRegistry, localeModulesPath, parseJson, provenancePath } from './lib/locale-data.mjs'
import { validateTranslationProvenance } from './lib/translation-provenance.mjs'

/**
 * 译文台账门禁（口径见 docs/standards/i18n.md §5.1）：台账字段与 Registry / 模块表对齐，
 * 避免台账长期无消费方而漂移。
 */


async function main() {
    const registry = await loadLocaleRegistry()
    const provenance = parseJson(await readFile(provenancePath, 'utf8'), provenancePath)
    const { LOCALE_MESSAGE_MODULES } = await import(pathToFileURL(localeModulesPath).href)

    const errors = validateTranslationProvenance({
        provenance,
        localeModules: LOCALE_MESSAGE_MODULES,
        localeDefinitions: registry.LOCALE_REGISTRY,
    })

    if (errors.length === 0) {
        console.log('[i18n] 译文台账与 Registry / 模块表一致')
        return
    }

    console.error(`\n[i18n] 译文台账校验失败（${errors.length}）：`)
    console.error(formatList(errors))
    process.exitCode = 1
}

main().catch((error) => {
    console.error(`[i18n] 译文台账校验失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
