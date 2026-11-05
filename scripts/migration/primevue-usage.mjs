import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

/** 扫描时跳过的目录：构建产物、依赖、报告与缓存 */
export const DEFAULT_EXCLUDED_DIRS = new Set([
    '.git',
    '.nuxt',
    '.output',
    '.vercel',
    '.vitepress',
    'coverage',
    'dist',
    'node_modules',
    'reports',
])

const PRIMEVUE_INDEX_PATH = path.join(projectRoot, 'node_modules', 'primevue', 'index.d.ts')

/**
 * 递归收集指定后缀的文件（相对 root，POSIX 分隔符）
 * @param {string} root
 * @param {{ suffix?: string, suffixes?: string[], excludeDirs?: Set<string> }} options
 * @returns {Promise<string[]>}
 */
export async function collectFiles(root, { suffix, suffixes, excludeDirs = DEFAULT_EXCLUDED_DIRS }) {
    const wanted = suffixes ?? (suffix ? [suffix] : [])
    const results = []

    async function walk(directory) {
        const entries = await readdir(directory, { withFileTypes: true })

        for (const entry of entries) {
            const absolute = path.join(directory, entry.name)

            if (entry.isDirectory()) {
                if (excludeDirs.has(entry.name)) {
                    continue
                }
                await walk(absolute)
                continue
            }

            if (entry.isFile() && wanted.some((item) => entry.name.endsWith(item))) {
                results.push(path.relative(root, absolute).split(path.sep).join('/'))
            }
        }
    }

    await walk(root)
    return results.sort()
}

/**
 * 从 primevue/index.d.ts 提取可以出现在模板里的组件名
 * @param {string} content
 * @returns {string[]}
 */
export function extractPrimeVueComponents(content) {
    const names = new Set()

    for (const match of content.matchAll(/export\s*\{\s*default\s+as\s+(\w+)\s*\}/gu)) {
        names.add(match[1])
    }

    return [...names].sort()
}

/**
 * 统计单个文件中的 PrimeVue 使用面
 * @param {string} source
 * @param {string[]} components
 */
export function analyzeSource(source, components) {
    const openTags = {}
    let openTagCount = 0

    for (const name of components) {
        const matches = source.match(new RegExp(`<${name}(?=[\\s/>])`, 'gu'))
        if (matches?.length) {
            openTags[name] = matches.length
            openTagCount += matches.length
        }
    }

    const pTokens = new Set(source.match(/--p-[a-z0-9-]+/gu) ?? [])
    const pClasses = source.match(/\.p-[a-z0-9-]+/gu) ?? []
    const deepSelectors = source.match(/:deep\(/gu) ?? []

    return {
        openTags,
        openTagCount,
        useToast: source.includes('useToast('),
        useConfirm: source.includes('useConfirm('),
        explicitPrimeVueImport: /from\s+['"]primevue\//u.test(source),
        primeVueMock: /vi\.mock\(\s*['"]primevue\//u.test(source),
        pTokenCount: pTokens.size,
        pClasses: pClasses.length,
        deepSelectors: deepSelectors.length,
    }
}

/**
 * 汇总扫描结果（输出稳定排序，便于 diff）
 * @param {Array<{ file: string } & ReturnType<typeof analyzeSource>>} analyses
 * @param {{ e2ePClassAssertions: number }} extra
 */
export function summarize(analyses, extra) {
    const components = {}
    const filesByComponent = {}
    let tagFiles = 0
    const metrics = {
        files: 0,
        openTags: 0,
        useToastFiles: [],
        useConfirmFiles: [],
        explicitPrimeVueImportFiles: [],
        primeVueMockFiles: [],
        pTokenOccurrences: 0,
        pTokenFiles: [],
        pClassOccurrences: 0,
        pClassFiles: [],
        deepSelectors: 0,
        e2ePClassAssertions: extra.e2ePClassAssertions,
    }

    for (const analysis of analyses) {
        metrics.files += 1
        metrics.openTags += analysis.openTagCount

        if (analysis.openTagCount > 0) {
            tagFiles += 1
        }

        if (analysis.useToast) {
            metrics.useToastFiles.push(analysis.file)
        }
        if (analysis.useConfirm) {
            metrics.useConfirmFiles.push(analysis.file)
        }
        if (analysis.explicitPrimeVueImport) {
            metrics.explicitPrimeVueImportFiles.push(analysis.file)
        }
        if (analysis.primeVueMock) {
            metrics.primeVueMockFiles.push(analysis.file)
        }
        if (analysis.pTokenCount > 0) {
            metrics.pTokenOccurrences += analysis.pTokenCount
            metrics.pTokenFiles.push(analysis.file)
        }
        if (analysis.pClasses > 0) {
            metrics.pClassOccurrences += analysis.pClasses
            metrics.pClassFiles.push(analysis.file)
        }
        metrics.deepSelectors += analysis.deepSelectors

        for (const [name, count] of Object.entries(analysis.openTags)) {
            components[name] = (components[name] ?? 0) + count
            filesByComponent[name] ??= []
            filesByComponent[name].push(analysis.file)
        }
    }

    const sortedComponents = Object.fromEntries(
        Object.entries(components).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    )
    const sortedFilesByComponent = Object.fromEntries(
        Object.keys(sortedComponents).map((name) => [name, filesByComponent[name].sort()]),
    )

    return {
        totals: {
            componentFamilies: Object.keys(sortedComponents).length,
            openTags: metrics.openTags,
            files: tagFiles,
        },
        components: sortedComponents,
        filesByComponent: sortedFilesByComponent,
        metrics: {
            ...metrics,
            useToastFiles: metrics.useToastFiles.sort(),
            useConfirmFiles: metrics.useConfirmFiles.sort(),
            explicitPrimeVueImportFiles: metrics.explicitPrimeVueImportFiles.sort(),
            primeVueMockFiles: metrics.primeVueMockFiles.sort(),
            pTokenFiles: metrics.pTokenFiles.sort(),
            pClassFiles: metrics.pClassFiles.sort(),
        },
    }
}

/** 统计 e2e 目录中的 `.p-*` 断言数量 */
export function countE2ePClassAssertions(sources) {
    let count = 0
    for (const source of sources) {
        count += (source.match(/\.p-[a-z0-9-]+/gu) ?? []).length
    }
    return count
}

export async function buildSnapshot({ root = projectRoot, primeVueIndexPath = PRIMEVUE_INDEX_PATH } = {}) {
    const indexContent = await readFile(primeVueIndexPath, 'utf8')
    const components = extractPrimeVueComponents(indexContent)

    const sourceFiles = await collectFiles(root, { suffixes: ['.vue', '.ts', '.scss', '.css', '.mjs'] })
    const analyses = []

    for (const file of sourceFiles) {
        // 测试与脚本里的 `.p-*` / token 字符串不是运行时耦合，单独统计 mock、不进入样式指标
        if (file.startsWith('tests/') || file.startsWith('scripts/')) {
            continue
        }

        const source = await readFile(path.join(root, file), 'utf8')
        const analysis = analyzeSource(source, components)

        if (analysis.openTagCount > 0 || analysis.explicitPrimeVueImport || analysis.useToast || analysis.useConfirm
            || analysis.pTokenCount > 0 || analysis.pClasses > 0 || analysis.deepSelectors > 0) {
            analyses.push({ file, ...analysis })
        }
    }

    const testFiles = await collectFiles(path.join(root, 'tests'), { suffix: '.ts' })
    const mockAnalyses = []
    for (const file of testFiles) {
        if (!file.includes('.spec.')) {
            continue
        }
        const source = await readFile(path.join(root, 'tests', file), 'utf8')
        if (/vi\.mock\(\s*['"]primevue\//u.test(source)) {
            mockAnalyses.push(file)
        }
    }

    const e2eDir = path.join(root, 'tests', 'e2e')
    const e2eFiles = await collectFiles(e2eDir, { suffix: '.ts' }).catch(() => [])
    const e2eSources = []
    for (const file of e2eFiles) {
        e2eSources.push(await readFile(path.join(e2eDir, file), 'utf8'))
    }

    const summary = summarize(analyses, { e2ePClassAssertions: countE2ePClassAssertions(e2eSources) })
    summary.metrics.primeVueMockFiles = mockAnalyses.sort()

    return {
        snapshotVersion: 1,
        scope: 'PrimeVue 组件族 / 开标签 / 类名与 token 耦合（不含 node_modules、构建产物与报告目录）',
        ...summary,
    }
}

function parseArgs(argv) {
    const args = {}
    for (const arg of argv) {
        if (!arg.startsWith('--')) {
            continue
        }
        const separator = arg.indexOf('=')
        if (separator === -1) {
            args[arg.slice(2)] = true
            continue
        }
        args[arg.slice(2, separator)] = arg.slice(separator + 1)
    }
    return args
}

async function main() {
    const args = parseArgs(process.argv.slice(2))
    const snapshot = await buildSnapshot()
    const serialized = `${JSON.stringify(snapshot, null, 2)}\n`

    if (typeof args.json === 'string') {
        const outputPath = path.resolve(projectRoot, args.json)
        await writeFile(outputPath, serialized, 'utf8')
        process.stdout.write(`PrimeVue 用量快照已写入 ${path.relative(projectRoot, outputPath)}\n`)
    }

    if (!args.quiet) {
        process.stdout.write(serialized)
    }

    const { totals } = snapshot
    process.stderr.write(
        `PrimeVue 用量：${totals.componentFamilies} 个组件族 / ${totals.openTags} 个开标签 / ${totals.files} 个 .vue 文件\n`,
    )
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    await main()
}
