import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { runBenchmark } from './session-benchmark.mjs'

function readOption(name, fallback) {
    const prefix = `--${name}=`
    const arg = process.argv.slice(2).find((item) => item.startsWith(prefix))
    return arg ? Number(arg.slice(prefix.length)) : fallback
}

const rows = readOption('rows', 50000)
const iterations = readOption('iterations', 200)

const result = runBenchmark({ rows, iterations })
const report = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    ...result,
}

const outDir = join(process.cwd(), 'artifacts', 'perf')
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, `session-benchmark-${report.generatedAt.slice(0, 10)}.json`)
writeFileSync(outFile, `${JSON.stringify(report, null, 4)}\n`)

console.log(`[perf] rows=${rows} iterations=${iterations}`)
for (const [name, timing] of Object.entries(result.timings)) {
    console.log(`  ${name}: p50=${timing.p50.toFixed(3)}ms p95=${timing.p95.toFixed(3)}ms max=${timing.max.toFixed(3)}ms`)
}
console.log(`[perf] report: ${outFile}`)

if (result.fullScanQueries.length > 0) {
    console.error(`[perf] 发现全表扫描：${result.fullScanQueries.join(', ')}`)
    process.exitCode = 1
}
