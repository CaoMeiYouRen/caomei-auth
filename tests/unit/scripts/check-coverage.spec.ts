import { describe, expect, it } from 'vitest'
import {
    evaluateGate,
    GLOBAL_METRICS,
    loadCoverage,
    MODULE_THRESHOLDS,
    summarizeCoverage,
    TOLERANCE,
} from '../../../scripts/quality/check-coverage.mjs'

/**
 * 阶段 18 M2.1：覆盖率门禁的纯函数。
 *
 * 重点不是覆盖率数字本身，而是「低于阈值必须非零退出、报告缺失必须报错」这两条不变量。
 */

const baseline = {
    global: { statements: 79.02, branches: 66.16, functions: 72.78, lines: 79.23 },
}

function fakeCoverage(entries: Array<{ path: string, statements: number[], lines: number[] }>) {
    const map: Record<string, unknown> = {}
    for (const entry of entries) {
        map[entry.path] = {
            s: Object.fromEntries(entry.statements.map((count, index) => [String(index), count])),
            f: {},
            b: {},
            statementMap: Object.fromEntries(entry.lines.map((line, index) => [String(index), { start: { line } }])),
        }
    }
    return map
}

describe('scripts/quality/check-coverage', () => {
    it('按目录前缀聚合模块覆盖率，并按起始行聚合行覆盖', () => {
        const coverage = fakeCoverage([
            { path: '/app/pages/a.vue', statements: [1, 0], lines: [10, 11] },
            { path: '/app/pages/b.vue', statements: [0, 0], lines: [20, 21] },
            { path: '/app/plugins/x.ts', statements: [1, 1], lines: [30, 30] },
            { path: '/app/server/y.ts', statements: [1, 1], lines: [40, 41] },
        ])

        const summary = summarizeCoverage(coverage, '/app')

        expect(summary.modules.pages).toBe(25)
        expect(summary.modules.plugins).toBe(100)
        /* 8 条语句里 5 条执行；行覆盖按「文件 + 起始行」去重后 7 行中 4 行覆盖 */
        expect(summary.global.statements).toBe(62.5)
        expect(summary.global.lines).toBe(57.14)
    })

    it('达标时返回空失败清单', () => {
        expect(evaluateGate({ global: { ...baseline.global }, modules: { pages: 40, plugins: 40 } }, baseline)).toEqual([])
    })

    it('模块低于下限时失败并点名', () => {
        const failures = evaluateGate({ global: { ...baseline.global }, modules: { pages: 39.9, plugins: 50 } }, baseline)
        expect(failures).toHaveLength(1)
        expect(failures[0]).toContain('pages')
        expect(MODULE_THRESHOLDS.map((item) => item.label)).toEqual(['pages', 'plugins'])
    })

    it('全局指标低于基线时失败，容差内不失败', () => {
        const dropped = evaluateGate(
            { global: { ...baseline.global, lines: baseline.global.lines - 0.5 }, modules: { pages: 50, plugins: 50 } },
            baseline,
        )
        expect(dropped).toHaveLength(1)
        expect(dropped[0]).toContain('lines')

        const withinTolerance = evaluateGate(
            { global: { ...baseline.global, lines: baseline.global.lines - TOLERANCE }, modules: { pages: 50, plugins: 50 } },
            baseline,
        )
        expect(withinTolerance).toEqual([])
    })

    it('基线缺项时失败而不是静默跳过', () => {
        const failures = evaluateGate(
            { global: { statements: 90, branches: 90, functions: 90, lines: 90 }, modules: { pages: 50, plugins: 50 } },
            { global: { statements: 90 } },
        )
        expect(failures).toHaveLength(GLOBAL_METRICS.length - 1)
    })

    it('覆盖率报告缺失时报错（fail closed）', () => {
        expect(() => loadCoverage('/tmp', '/tmp/definitely-missing-coverage.json')).toThrow(/覆盖率报告不存在/u)
    })
})
