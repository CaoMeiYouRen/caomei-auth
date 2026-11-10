import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')
const clientDir = path.join(projectRoot, '.output', 'public', '_nuxt')
const precomputedPath = path.join(projectRoot, '.output', 'server', 'chunks', 'virtual', 'precomputed.mjs')

/**
 * 从 Nuxt 预计算清单中提取入口 chunk 文件名。
 *
 * `precomputed.mjs` 形如 `file:"DoCmMT2q.js",name:"entry",...isEntry:true`；
 * CSS 形如 `file:"entry.CxWJT6FN.css"`。属性顺序可能随构建器变化，因此先定位
 * `name:"entry"`，再在邻近窗口内取 `file`。
 * @param {string} source
 */
export function extractEntryFiles(source) {
    const entryIndex = source.indexOf('name:"entry"')
    let js
    if (entryIndex !== -1) {
        const window = source.slice(Math.max(0, entryIndex - 200), entryIndex + 200)
        js = window.match(/file:"([^"]+)"/u)?.[1]
    }
    const css = source.match(/file:"(entry\.[^"]+\.css)"/u)?.[1]

    return { js, css }
}

/**
 * 汇总包体尺寸。
 * @param {{ entryJs?: number, entryCss?: number, totalJs: number, totalCss: number }} sizes
 */
export function summarizeBundle({ entryJs, entryCss, totalJs, totalCss }) {
    return {
        entryJs: entryJs ?? 0,
        entryCss: entryCss ?? 0,
        totalJs,
        totalCss,
    }
}

async function sizeOf(file) {
    const info = await stat(file)
    return info.size
}

async function listFiles(directory, suffix) {
    const { readdir } = await import('node:fs/promises')
    const entries = await readdir(directory, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
        .map((entry) => entry.name)
}

async function main() {
    const args = {}
    for (const arg of process.argv.slice(2)) {
        if (!arg.startsWith('--')) {
            continue
        }
        const separator = arg.indexOf('=')
        args[separator === -1 ? arg.slice(2) : arg.slice(2, separator)] = separator === -1 ? true : arg.slice(separator + 1)
    }

    const result = await measureBundle()

    if (typeof args.json === 'string') {
        const outputPath = path.resolve(projectRoot, args.json)
        await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
        process.stdout.write(`包体基线已写入 ${path.relative(projectRoot, outputPath)}\n`)
    }

    if (!args.quiet) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    }
}

/**
 * 测量当前 `.output` 的入口与全量包体尺寸。
 * 供 `migration:measure` 与 `migration:check-budget` 共用。
 */
export async function measureBundle() {
    const precomputed = await readFile(precomputedPath, 'utf8').catch((error) => {
        throw new Error(`找不到 ${path.relative(projectRoot, precomputedPath)}，请先运行 pnpm build`, { cause: error })
    })
    const entry = extractEntryFiles(precomputed)
    if (!entry.js || !entry.css) {
        throw new Error('无法从 precomputed.mjs 解析入口 chunk，请检查 Nuxt 构建产物结构')
    }

    const [entryJs, entryCss, jsFiles, cssFiles] = await Promise.all([
        sizeOf(path.join(clientDir, entry.js)),
        sizeOf(path.join(clientDir, entry.css)),
        listFiles(clientDir, '.js'),
        listFiles(clientDir, '.css'),
    ])
    const totals = await Promise.all([
        Promise.all(jsFiles.map((file) => sizeOf(path.join(clientDir, file)))),
        Promise.all(cssFiles.map((file) => sizeOf(path.join(clientDir, file)))),
    ])
    const summary = summarizeBundle({
        entryJs,
        entryCss,
        totalJs: totals[0].reduce((sum, size) => sum + size, 0),
        totalCss: totals[1].reduce((sum, size) => sum + size, 0),
    })
    const { version: nuxtVersion } = JSON.parse(await readFile(path.join(projectRoot, 'node_modules', 'nuxt', 'package.json'), 'utf8'))

    return {
        scope: '_nuxt 顶层 JS/CSS + precomputed name:"entry"',
        nuxtVersion,
        ...summary,
        entry: { js: entry.js, css: entry.css },
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    await main()
}
