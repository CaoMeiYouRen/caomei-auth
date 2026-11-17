import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

/** 与 `eslint.config.js` 的 `max-lines` 保持一致；超过该行数的新文件会被拦截 */
export const DEFAULT_THRESHOLD = 600
export const DEFAULT_BASELINE_PATH = path.join(__dirname, 'file-size-baseline.json')

/** 统计口径覆盖 ESLint 可检查的脚本与单文件组件 */
export const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.vue', '.mjs', '.js', '.cjs', '.jsx'])

/** 忽略目录须与 `eslint.config.js` 的 `globalIgnores` 保持同步 */
export const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.nuxt',
    '.output',
    '.vercel',
    '.vitepress',
    'coverage',
    'dist',
    'jscpd-report',
    'logs',
    'node_modules',
    'playwright-report',
    'public',
    'static',
    'test-results',
])

/**
 * 按 `wc -l` 口径统计行数：末尾换行不计为空行。
 * @param {string} content
 */
export function countLines(content) {
    if (content.length === 0) {
        return 0
    }
    const newlineCount = content.split('\n').length - 1
    return content.endsWith('\n') ? newlineCount : newlineCount + 1
}

/**
 * 递归收集仓库内的源文件行数。
 * @param {string} rootDir
 * @param {string} [prefix]
 * @returns {{ path: string, lines: number }[]}
 */
export function collectSourceFiles(rootDir, prefix = '') {
    const files = []
    for (const entry of readdirSync(path.join(rootDir, prefix), { withFileTypes: true })) {
        if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
            continue
        }
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(rootDir, relativePath))
        } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            const content = readFileSync(path.join(rootDir, relativePath), 'utf8')
            files.push({ path: relativePath, lines: countLines(content) })
        }
    }
    return files.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * 阈值只由门禁常量决定；基线文件里的 `threshold` 仅用于自检，出现不一致时直接失败，
 * 防止通过改一行 JSON 放宽全仓预算。
 * @param {{ threshold?: number }} baseline
 */
export function resolveThreshold(baseline) {
    if (baseline.threshold !== undefined && baseline.threshold !== DEFAULT_THRESHOLD) {
        throw new Error(`基线阈值 ${baseline.threshold} 与门禁常量 ${DEFAULT_THRESHOLD} 不一致；阈值不得由基线文件放宽`)
    }
    return DEFAULT_THRESHOLD
}

/**
 * 对比基线引用，找出被新增的基线条目（新增基线文件必须经人工评审，不允许直接加入）。
 * @param {FileSizeBaseline} current
 * @param {FileSizeBaseline} previous
 */
export function findAddedBaselineEntries(current, previous) {
    return Object.keys(current.files ?? {}).filter((filePath) => !Object.hasOwn(previous.files ?? {}, filePath))
}

/**
 * @typedef {{ lines: number, owner: string, plan: string }} BaselineEntry
 * @typedef {{ threshold?: number, files: Record<string, BaselineEntry> }} FileSizeBaseline
 * @typedef {{ code: string, path: string, message: string }} FileSizeIssue
 */

/**
 * 评估当前文件规模是否满足门禁。
 * @param {{ path: string, lines: number }[]} files
 * @param {FileSizeBaseline} baseline
 * @param {number} [threshold]
 * @returns {{ threshold: number, passed: boolean, errors: FileSizeIssue[], warnings: FileSizeIssue[] }}
 */
export function evaluateFileSizes(files, baseline, threshold = DEFAULT_THRESHOLD) {
    const errors = []
    const warnings = []
    const baselineFiles = baseline.files ?? {}
    const scanned = new Map(files.map((file) => [file.path, file.lines]))

    for (const [filePath, entry] of Object.entries(baselineFiles)) {
        if (!entry.owner || !entry.plan) {
            errors.push({
                code: 'baseline-metadata',
                path: filePath,
                message: '基线条目必须写明 owner 与拆分计划',
            })
        }
        if (!Number.isInteger(entry.lines) || entry.lines <= 0) {
            errors.push({
                code: 'baseline-invalid',
                path: filePath,
                message: '基线条目缺少有效的行数',
            })
            continue
        }
        if (entry.lines <= threshold) {
            warnings.push({
                code: 'baseline-below-threshold',
                path: filePath,
                message: `已低于 ${threshold} 行，可从基线移除`,
            })
        }
        if (!scanned.has(filePath)) {
            errors.push({
                code: 'baseline-stale',
                path: filePath,
                message: '基线文件已不存在，请更新基线',
            })
            continue
        }
        const current = scanned.get(filePath)
        if (current > entry.lines) {
            errors.push({
                code: 'baseline-growth',
                path: filePath,
                message: `基线文件增长：${entry.lines} → ${current} 行（基线只允许缩减）`,
            })
        } else if (current < entry.lines) {
            warnings.push({
                code: 'baseline-shrinkable',
                path: filePath,
                message: `已缩减：${entry.lines} → ${current} 行，可执行 quality:file-size:update`,
            })
        }
    }

    for (const file of files) {
        if (Object.hasOwn(baselineFiles, file.path)) {
            continue
        }
        if (file.lines > threshold) {
            errors.push({
                code: 'over-threshold',
                path: file.path,
                message: `${file.lines} 行超过 ${threshold} 行上限；请拆分文件，不得直接加入基线`,
            })
        }
    }

    return {
        threshold,
        passed: errors.length === 0,
        errors,
        warnings,
    }
}

/**
 * 生成收紧后的基线：只更新既有条目的行数、移除低于阈值或已删除的条目，绝不新增条目。
 * @param {{ path: string, lines: number }[]} files
 * @param {FileSizeBaseline} baseline
 * @param {number} [threshold]
 * @returns {{ baseline: FileSizeBaseline, updated: string[], removed: string[] }}
 */
export function buildUpdatedBaseline(files, baseline, threshold = DEFAULT_THRESHOLD) {
    const evaluation = evaluateFileSizes(files, baseline, threshold)
    const blocking = evaluation.errors.filter((error) => error.code !== 'baseline-stale')
    if (blocking.length > 0) {
        throw new Error(blocking.map((error) => `${error.path}: ${error.message}`).join('\n'))
    }

    const scanned = new Map(files.map((file) => [file.path, file.lines]))
    const updated = []
    const removed = []
    const nextFiles = {}
    for (const [filePath, entry] of Object.entries(baseline.files ?? {})) {
        const current = scanned.get(filePath)
        if (current === undefined || current <= threshold) {
            removed.push(filePath)
            continue
        }
        if (current !== entry.lines) {
            updated.push(`${filePath}: ${entry.lines} → ${current}`)
        }
        nextFiles[filePath] = { ...entry, lines: current }
    }

    return {
        baseline: { ...baseline, threshold, files: nextFiles },
        updated,
        removed,
    }
}

function parseArgs(argv) {
    const options = { update: false, compareRef: '', allowNewBaseline: false }
    for (const arg of argv) {
        if (!arg.startsWith('--')) {
            continue
        }
        if (arg === '--update') {
            options.update = true
        } else if (arg === '--allow-new-baseline') {
            options.allowNewBaseline = true
        } else if (arg === '--help') {
            options.help = true
        } else if (arg.startsWith('--compare-ref=')) {
            options.compareRef = arg.slice('--compare-ref='.length)
        } else {
            throw new Error(`未知参数：${arg}`)
        }
    }
    return options
}

/**
 * 读取指定 git 引用里的基线，用于发现手工新增的基线条目。
 * @param {string} ref
 * @returns {FileSizeBaseline | null}
 */
function readBaselineFromRef(ref) {
    try {
        const relativePath = path.relative(projectRoot, DEFAULT_BASELINE_PATH).replaceAll('\\', '/')
        const content = execFileSync('git', ['show', `${ref}:${relativePath}`], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        return JSON.parse(content)
    } catch {
        return null
    }
}

function printReport(evaluation) {
    for (const warning of evaluation.warnings) {
        console.warn(`[warn] ${warning.path}: ${warning.message}`)
    }
    for (const error of evaluation.errors) {
        console.error(`[error] ${error.path}: ${error.message}`)
    }
    const summary = `文件规模门禁：${evaluation.errors.length} 个错误 / ${evaluation.warnings.length} 个提示（阈值 ${evaluation.threshold} 行）`
    if (evaluation.passed) {
        console.log(summary)
    } else {
        console.error(summary)
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
        console.log('用法：node scripts/quality/check-file-size.mjs [--update] [--compare-ref=<git-ref>] [--allow-new-baseline]')
        return 0
    }

    const baseline = JSON.parse(readFileSync(DEFAULT_BASELINE_PATH, 'utf8'))
    const threshold = resolveThreshold(baseline)
    const files = collectSourceFiles(projectRoot)

    if (options.compareRef) {
        const previous = readBaselineFromRef(options.compareRef)
        if (!previous) {
            console.warn(`[warn] 无法读取基线引用 ${options.compareRef}，跳过新增条目校验`)
        } else {
            const added = findAddedBaselineEntries(baseline, previous)
            if (added.length > 0 && !options.allowNewBaseline) {
                for (const filePath of added) {
                    console.error(`[error] ${filePath}: 不允许把新文件直接加入基线，请先拆分文件（新增基线需 --allow-new-baseline 并人工评审）`)
                }
                return 1
            }
        }
    }

    const evaluation = evaluateFileSizes(files, baseline, threshold)

    if (!options.update) {
        printReport(evaluation)
        return evaluation.passed ? 0 : 1
    }

    const { baseline: nextBaseline, updated, removed } = buildUpdatedBaseline(files, baseline, threshold)
    /* 原子写：先写临时文件再改名，避免中断留下半份基线 */
    const temporaryPath = `${DEFAULT_BASELINE_PATH}.tmp`
    writeFileSync(temporaryPath, `${JSON.stringify(nextBaseline, null, 4)}\n`)
    renameSync(temporaryPath, DEFAULT_BASELINE_PATH)
    for (const item of updated) {
        console.log(`[updated] ${item}`)
    }
    for (const item of removed) {
        console.log(`[removed] ${item}`)
    }
    /* 打印收紧后的结果，避免把更新前的 stale / 错误信息当成最终状态 */
    printReport(evaluateFileSizes(files, nextBaseline, threshold))
    return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main()
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
    }
}
