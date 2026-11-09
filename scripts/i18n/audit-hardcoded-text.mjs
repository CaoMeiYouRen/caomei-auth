import process from 'node:process'
import {
    diffHardcodedAllowlist,
    loadHardcodedAllowlist,
    scanHardcodedText,
    writeHardcodedAllowlist,
} from './lib/hardcoded-scan.mjs'

const USAGE = `用法：node scripts/i18n/audit-hardcoded-text.mjs [选项]

扫描 Vue 模板、composables、服务端 API / 工具与 MJML 模板中的中文硬编码，
与 i18n/hardcoded-text-allowlist.json 的存量基线比较。

选项：
  --update   按当前扫描结果重写基线（翻译完成后用于收紧）
  --help     显示帮助`

function printEntries(title, entries, formatter) {
    if (entries.length === 0) {
        return
    }
    console.log(`\n${title}`)
    for (const entry of entries) {
        console.log(`  - ${formatter(entry)}`)
    }
}

async function main() {
    const args = process.argv.slice(2)
    if (args.includes('--help')) {
        console.log(USAGE)
        return
    }
    const update = args.includes('--update')
    const unknown = args.filter((arg) => arg !== '--update' && arg !== '--help')
    if (unknown.length > 0) {
        throw new Error(`未知参数：${unknown.join(', ')}`)
    }

    const current = await scanHardcodedText()
    const totalLines = [...current.values()].reduce((total, count) => total + count, 0)
    console.log(`[i18n] 硬编码中文扫描：${current.size} 个文件，${totalLines} 行`)

    if (update) {
        const payload = await writeHardcodedAllowlist(current)
        console.log(`[i18n] 已更新基线：i18n/hardcoded-text-allowlist.json（${Object.keys(payload.files).length} 个文件）`)
        return
    }

    const allowlist = await loadHardcodedAllowlist()
    const { newFiles, increased, decreased, stale } = diffHardcodedAllowlist(current, allowlist.files)

    printEntries('[blocker] 新增文件中的中文硬编码', newFiles, (entry) => `${entry.file}: ${entry.count} 行`)
    printEntries('[blocker] 基线外新增的中文硬编码', increased, (entry) => `${entry.file}: ${entry.count} 行（基线 ${entry.allowed}）`)
    printEntries('[warning] 基线可收紧', decreased, (entry) => `${entry.file}: ${entry.count} 行（基线 ${entry.allowed}）`)
    printEntries('[warning] 基线中已不存在的文件', stale, (entry) => `${entry.file}（基线 ${entry.allowed}）`)

    if (newFiles.length > 0 || increased.length > 0) {
        console.error('\n[i18n] 检测到基线外的中文硬编码。请改为 i18n 键；翻译完成后运行 pnpm i18n:audit:hardcoded:update 收紧基线。')
        process.exitCode = 1
        return
    }

    if (decreased.length > 0 || stale.length > 0) {
        console.log('\n[i18n] 基线通过，但存在可收紧项，建议运行 pnpm i18n:audit:hardcoded:update。')
        return
    }

    console.log('[i18n] 硬编码中文基线通过')
}

main().catch((error) => {
    console.error(`[i18n] 硬编码中文审计失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
})
