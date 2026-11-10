import process from 'node:process'
import { formatList, loadLocaleMessages, loadLocaleRegistry } from './lib/locale-data.mjs'

const MAX_GROUPS = 50

async function main() {
    const registry = await loadLocaleRegistry()
    const defaultLocale = registry.DEFAULT_LOCALE
    const messages = await loadLocaleMessages(defaultLocale)

    const groups = new Map()
    for (const [key, value] of messages.flat) {
        if (typeof value !== 'string') {
            continue
        }
        const normalized = value.trim()
        if (normalized.length < 2) {
            continue
        }
        const keys = groups.get(normalized) ?? []
        keys.push(key)
        groups.set(normalized, keys)
    }

    const duplicates = [...groups.entries()]
        .filter(([, keys]) => keys.length > 1)
        .sort(([leftValue, leftKeys], [rightValue, rightKeys]) => rightKeys.length - leftKeys.length || leftValue.localeCompare(rightValue, 'zh-CN'))

    if (duplicates.length === 0) {
        console.log(`[i18n] ${defaultLocale} 未发现重复文案`)
        return
    }

    console.log(`[i18n] ${defaultLocale} 重复文案候选（${duplicates.length} 组，仅提示，不阻断）`)
    for (const [value, keys] of duplicates.slice(0, MAX_GROUPS)) {
        console.log(`\n  "${value}"`)
        console.log(formatList(keys, 20))
    }
    if (duplicates.length > MAX_GROUPS) {
        console.log(`\n  ... 还有 ${duplicates.length - MAX_GROUPS} 组未显示`)
    }
    console.log('\n[i18n] 重复文案不一定需要合并；是否上收到公共命名空间由组件职责与加载边界决定。')
}

main().catch((error) => {
    console.error(`[i18n] 重复文案审计失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
