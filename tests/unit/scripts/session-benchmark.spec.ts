import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
    createRandom,
    createSchema,
    hasFullScan,
    percentile,
    runBenchmark,
    seedSessions,
} from '../../../scripts/perf/session-benchmark.mjs'

describe('scripts/perf/session-benchmark', () => {
    it('计算分位数（线性插值）', () => {
        expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5)
        expect(percentile([5], 0.95)).toBe(5)
        expect(() => percentile([], 0.5)).toThrow('不能为空')
        expect(() => percentile([1], 0)).toThrow('(0, 1]')
    })

    it('识别全表扫描', () => {
        expect(hasFullScan([{ detail: 'SCAN session' }])).toBe(true)
        expect(hasFullScan([{ detail: 'SEARCH session USING INDEX IDX_session_token (token=?)' }])).toBe(false)
        expect(hasFullScan([{ detail: 'SEARCH session USING COVERING INDEX IDX_session_userId (userId=?)' }])).toBe(false)
    })

    it('同 seed 生成相同数据', () => {
        const randomA = createRandom(42)
        const randomB = createRandom(42)
        expect([randomA(), randomA()]).toEqual([randomB(), randomB()])

        const db = new Database(':memory:')
        createSchema(db)
        seedSessions(db, { rows: 10, seed: 7 })
        const rows = db.prepare('SELECT token FROM session ORDER BY id').all()
        expect(rows).toHaveLength(10)
        db.close()
    })

    it('热点查询走索引且无全表扫描', () => {
        const result = runBenchmark({ rows: 2000, iterations: 10 })
        expect(result.fullScanQueries).toEqual([])
        expect(result.timings.sessionByToken.p50).toBeGreaterThanOrEqual(0)
        expect(result.timings.sessionByToken.iterations).toBe(10)
        expect(result.plans.sessionByToken[0].detail).toContain('IDX_session_token')
    })
})

describe('scripts/perf/check-perf-threshold', () => {
    it('按 p95 上限判定通过 / 失败 / 缺项', async () => {
        const { evaluateThresholds } = await import('../../../scripts/perf/check-perf-threshold.mjs')
        const thresholds = { p95Ms: { a: 10, b: 1 } }

        expect(evaluateThresholds({ timings: { a: { p95: 5 }, b: { p95: 0.5 } } }, thresholds).passed).toBe(true)

        const failed = evaluateThresholds({ timings: { a: { p95: 11 }, b: { p95: 0.5 } } }, thresholds)
        expect(failed.passed).toBe(false)
        expect(failed.failures[0]).toContain('a')

        const missing = evaluateThresholds({ timings: {} }, thresholds)
        expect(missing.failures).toHaveLength(2)
        expect(missing.failures[0]).toContain('缺少基准结果')
    })
})
