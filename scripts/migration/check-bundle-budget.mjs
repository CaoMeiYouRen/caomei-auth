import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { measureBundle } from './measure-bundle.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

/** M1-1 建立的入口 CSS 基线；只对 `keyCss` 设硬预算 */
export const DEFAULT_BASELINE_PATH = path.join(projectRoot, 'docs', 'design', 'governance', 'bundle-baseline-2026-11-08.json')
export const DEFAULT_MAX_CSS_GROWTH = 0.1

/**
 * 比较当前入口 CSS 与基线。
 * @param {{ entryCss: number }} baseline
 * @param {{ entryCss: number }} current
 * @param {{ maxCssGrowth?: number }} [options]
 */
export function evaluateBundleBudget(baseline, current, options = {}) {
    const maxCssGrowth = options.maxCssGrowth ?? DEFAULT_MAX_CSS_GROWTH
    if (!Number.isFinite(baseline.entryCss) || baseline.entryCss <= 0) {
        throw new Error('包体基线缺少有效的 entryCss')
    }

    const growth = (current.entryCss - baseline.entryCss) / baseline.entryCss
    return {
        baselineCss: baseline.entryCss,
        currentCss: current.entryCss,
        growth,
        maxCssGrowth,
        passed: growth <= maxCssGrowth,
    }
}

function parseArgs(argv) {
    const options = {
        baseline: DEFAULT_BASELINE_PATH,
        maxCssGrowth: DEFAULT_MAX_CSS_GROWTH,
    }

    for (const arg of argv) {
        if (!arg.startsWith('--')) {
            continue
        }
        if (arg === '--help') {
            options.help = true
            continue
        }
        const separator = arg.indexOf('=')
        const key = separator === -1 ? arg.slice(2) : arg.slice(2, separator)
        const value = separator === -1 ? '' : arg.slice(separator + 1)

        if (key === 'baseline' && value) {
            options.baseline = path.resolve(projectRoot, value)
        } else if (key === 'max-css-growth' && value) {
            options.maxCssGrowth = Number(value)
        } else {
            throw new Error(`未知参数：${arg}`)
        }
    }

    if (!Number.isFinite(options.maxCssGrowth) || options.maxCssGrowth < 0) {
        throw new Error('--max-css-growth 必须是非负数字，例如 0.1 表示 +10%')
    }
    return options
}

async function main() {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
        process.stdout.write(`用法：node scripts/migration/check-bundle-budget.mjs [选项]

选项：
  --baseline=<path>        包体基线 JSON（默认 docs/design/governance/bundle-baseline-2026-11-08.json）
  --max-css-growth=<ratio> 入口 CSS 允许增幅（默认 0.1，即 +10%）
  --help                   显示帮助

需要先运行 pnpm build；只对 keyCss（entry.*.css）设硬预算，入口 JS / 总 JS / 总 CSS 仅记录。
`)
        return
    }

    const baseline = JSON.parse(await readFile(options.baseline, 'utf8'))
    const current = await measureBundle()
    const result = evaluateBundleBudget(baseline, current, { maxCssGrowth: options.maxCssGrowth })
    const percent = (value) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`

    process.stdout.write(`包体基线：${path.relative(projectRoot, options.baseline)}\n`)
    process.stdout.write(`入口 CSS：${result.baselineCss} B → ${result.currentCss} B（${percent(result.growth)}，上限 ${percent(result.maxCssGrowth)}）\n`)
    process.stdout.write(`入口 JS：${current.entryJs} B（记录，不设硬预算）\n`)
    process.stdout.write(`总 JS / CSS：${current.totalJs} B / ${current.totalCss} B（记录）\n`)

    if (!result.passed) {
        process.stderr.write(`\n包体预算超限：入口 CSS 增幅 ${percent(result.growth)} > ${percent(result.maxCssGrowth)}\n`)
        process.exitCode = 1
        return
    }

    process.stdout.write('包体预算通过\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    await main().catch((error) => {
        process.stderr.write(`包体预算检查失败：${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
    })
}
