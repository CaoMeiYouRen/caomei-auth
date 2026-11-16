import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import process from 'node:process'
import { runBenchmark } from './session-benchmark.mjs'

const CONFIG_PATH = join(import.meta.dirname, 'perf-thresholds.json')

/** 读取阈值配置（绝对毫秒上限，避免运行环境波动把相对比例放大成噪声） */
export function loadThresholds(path = CONFIG_PATH) {
    const config = JSON.parse(readFileSync(path, 'utf8'))
    if (!config || typeof config !== 'object' || !config.p95Ms) {
        throw new Error('perf-thresholds.json 缺少 p95Ms')
    }
    return config
}

/**
 * 用阈值评估基准结果。
 * @param {{ timings: Record<string, { p95: number }> }} result
 * @param {{ p95Ms: Record<string, number> }} thresholds
 */
export function evaluateThresholds(result, thresholds) {
    const failures = []
    for (const [name, limit] of Object.entries(thresholds.p95Ms)) {
        const timing = result.timings[name]
        if (!timing) {
            failures.push(`${name}: 缺少基准结果`)
            continue
        }
        if (timing.p95 > limit) {
            failures.push(`${name}: p95 ${timing.p95.toFixed(3)}ms > ${limit}ms`)
        }
    }
    return { passed: failures.length === 0, failures }
}

export function main() {
    const thresholds = loadThresholds()
    const result = runBenchmark({ rows: 50000, iterations: 200 })
    const { passed, failures } = evaluateThresholds(result, thresholds)

    console.log(`[perf] 阈值检查（${result.rows} 行 / ${result.iterations} 次）`)
    for (const [name, limit] of Object.entries(thresholds.p95Ms)) {
        const timing = result.timings[name]
        console.log(`  ${name}: p95=${timing?.p95.toFixed(3) ?? '-'}ms（上限 ${limit}ms）`)
    }

    if (result.fullScanQueries.length > 0) {
        console.error(`[perf] 发现全表扫描：${result.fullScanQueries.join(', ')}`)
        process.exitCode = 1
    }
    if (!passed) {
        console.error(`[perf] 未通过：${failures.join('；')}`)
        process.exitCode = 1
    }
}

const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
    main()
}
