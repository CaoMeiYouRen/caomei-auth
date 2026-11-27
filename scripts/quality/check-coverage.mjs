import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

/**
 * 覆盖率门禁（阶段 18 D66）。
 *
 * 背景：`docs/standards/testing.md` 写了 `pages ≥ 40%`、`plugins ≥ 40%` 与「全局不退化」，
 * 但 CI 只上传 Codecov，不阻断；Vitest 4 移除 `coverage.all` 后，覆盖率只统计被测试导入的
 * 文件，模块覆盖率悄悄下滑无人发现。
 *
 * 口径：
 * - 输入为 v8 provider 的 `coverage/coverage-final.json`（istanbul 结构）；
 * - 模块阈值按目录前缀聚合语句覆盖率；
 * - 全局四项指标与 `coverage-baseline.json` 比较，允许 0.05 的舍入误差，只要求「不降低」；
 * - 报告缺失视为未通过（fail closed），不把「没跑覆盖率」当成「没问题」。
 */

export const MODULE_THRESHOLDS = [
    { prefix: 'pages/', label: 'pages', minimum: 40 },
    { prefix: 'plugins/', label: 'plugins', minimum: 40 },
]

export const GLOBAL_METRICS = ['statements', 'branches', 'functions', 'lines']

/** 舍入容差：报告保留两位小数，避免 79.019 与 79.02 这类差异误报 */
export const TOLERANCE = 0.05

/** istanbul 覆盖率文件的最小结构 */
export function summarizeCoverage(coverageMap, rootDir = '') {
    const totals = {
        statements: { covered: 0, total: 0 },
        branches: { covered: 0, total: 0 },
        functions: { covered: 0, total: 0 },
        lines: { covered: 0, total: 0 },
    }
    const modules = Object.fromEntries(MODULE_THRESHOLDS.map((item) => [item.label, { covered: 0, total: 0 }]))

    for (const [file, data] of Object.entries(coverageMap)) {
        const relative = rootDir && file.startsWith(rootDir) ? file.slice(rootDir.length) : file
        const normalized = relative.replace(/^\/+/u, '')
        const statementCounts = Object.values(data.s ?? {})
        const functionCounts = Object.values(data.f ?? {})
        const branchCounts = Object.values(data.b ?? {}).flat()
        /* 行覆盖按 statementMap 的起始行聚合：同一行有任一语句执行即记为已覆盖 */
        const lineHits = new Map()
        for (const [id, count] of Object.entries(data.s ?? {})) {
            const line = data.statementMap?.[id]?.start?.line
            if (!line) {
                continue
            }
            lineHits.set(line, Math.max(lineHits.get(line) ?? 0, count))
        }
        const lineCounts = [...lineHits.values()]

        const add = (target, counts) => {
            target.total += counts.length
            target.covered += counts.filter((value) => value > 0).length
        }

        add(totals.statements, statementCounts)
        add(totals.functions, functionCounts)
        add(totals.branches, branchCounts)
        add(totals.lines, lineCounts)

        for (const item of MODULE_THRESHOLDS) {
            if (normalized.startsWith(item.prefix)) {
                add(modules[item.label], statementCounts)
            }
        }
    }

    const percent = (target) => (target.total === 0 ? 0 : Number(((target.covered / target.total) * 100).toFixed(2)))

    return {
        global: {
            statements: percent(totals.statements),
            branches: percent(totals.branches),
            functions: percent(totals.functions),
            lines: percent(totals.lines),
        },
        modules: Object.fromEntries(
            Object.entries(modules).map(([label, target]) => [label, percent(target)]),
        ),
    }
}

/** 逐项判定，返回失败清单（空数组即通过） */
export function evaluateGate(summary, baseline) {
    const failures = []

    for (const item of MODULE_THRESHOLDS) {
        const actual = summary.modules[item.label] ?? 0
        if (actual < item.minimum) {
            failures.push(`${item.label} 语句覆盖率 ${actual}% 低于下限 ${item.minimum}%`)
        }
    }

    for (const metric of GLOBAL_METRICS) {
        const actual = summary.global[metric]
        const expected = baseline.global?.[metric]
        if (typeof expected !== 'number') {
            failures.push(`基线缺少全局 ${metric} 记录`)
            continue
        }
        if (actual + TOLERANCE < expected) {
            failures.push(`全局 ${metric} ${actual}% 低于基线 ${expected}%`)
        }
    }

    return failures
}

export function loadCoverage(rootDir, coveragePath) {
    if (!existsSync(coveragePath)) {
        throw new Error(`覆盖率报告不存在：${coveragePath}（请先运行 pnpm test:coverage）`)
    }
    const raw = JSON.parse(readFileSync(coveragePath, 'utf8'))
    return summarizeCoverage(raw, rootDir)
}

function main() {
    const rootDir = resolve(import.meta.dirname, '../..')
    const coveragePath = process.env.COVERAGE_PATH
        ? resolve(process.env.COVERAGE_PATH)
        : resolve(rootDir, 'coverage/coverage-final.json')
    const baselinePath = resolve(rootDir, 'scripts/quality/coverage-baseline.json')

    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
    const summary = loadCoverage(rootDir, coveragePath)
    const failures = evaluateGate(summary, baseline)

    console.log(`[coverage] 全局：${GLOBAL_METRICS.map((metric) => `${metric} ${summary.global[metric]}%`).join(' / ')}`)
    console.log(`[coverage] 模块：${MODULE_THRESHOLDS.map((item) => `${item.label} ${summary.modules[item.label] ?? 0}%（下限 ${item.minimum}%）`).join(' / ')}`)

    if (failures.length > 0) {
        console.error('[coverage] 门禁未通过：')
        for (const failure of failures) {
            console.error(`  - ${failure}`)
        }
        process.exit(1)
    }
    console.log('[coverage] 门禁通过')
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
    main()
}
