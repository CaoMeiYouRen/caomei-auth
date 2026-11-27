import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import process from 'node:process'
import { extractHeadingSlugs, githubSlugify } from './doc-slug.mjs'

/**
 * 文档锚点校验（阶段 18 D67 / M3.2）。
 *
 * 背景：`ignoreDeadLinks: true` 让 `docs:build` 不会因为锚点失效而报错，
 * 而站点旧 slug 规则（数字开头补 `_`）与仓库内 GitHub 形式的引用不一致，
 * 30+ 交叉引用在站点上点不到。阶段 18 已把站点 slugify 对齐 GitHub；
 * 本脚本负责证明「仓库里的锚点都能在目标文件里找到对应标题」。
 *
 * 扫描范围：`docs/**\/*.md`、`AGENTS.md`、`README.md`、`CLAUDE.md`。
 * 支持：同文件 `(#x)`、跨文件 `y.md#x`（相对路径，含 `./` / `../`）。
 * 忽略：外部 URL、纯 anchor 但目标文件不在扫描范围内的引用（如 issue 链接）。
 */

export const SCAN_ROOTS = ['docs', 'AGENTS.md', 'README.md', 'CLAUDE.md']

/** 收集待扫描的 md 文件 */
export function collectMarkdownFiles(rootDir, entries = SCAN_ROOTS) {
    const files = []
    const walk = (absolute) => {
        if (!existsSync(absolute)) {
            return
        }
        const stat = statSync(absolute)
        if (stat.isDirectory()) {
            for (const child of readdirSync(absolute)) {
                if (child === 'node_modules' || child === '.vitepress' || child === 'public') {
                    continue
                }
                walk(resolve(absolute, child))
            }
            return
        }
        if (extname(absolute) === '.md') {
            files.push(absolute)
        }
    }
    for (const entry of entries) {
        walk(resolve(rootDir, entry))
    }
    return files
}

/** 从一行里取出所有 markdown 链接目标：`[text](target)` 与 `[text]: target` */
export function extractLinkTargets(line) {
    const targets = []
    const inline = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu
    const reference = /^\s*\[[^\]]+\]:\s*(\S+)/u
    let match
    while ((match = inline.exec(line)) !== null) {
        targets.push(match[1])
    }
    const ref = reference.exec(line)
    if (ref) {
        targets.push(ref[1])
    }
    return targets
}

/**
 * 校验单个文件里的锚点引用。
 *
 * @returns {{ file: string, line: number, target: string, reason: string }[]}
 */
export function checkFile(rootDir, file, cache) {
    const problems = []
    const content = readFileSync(file, 'utf8')
    const fallbackSlugsOf = (absolute) => {
        if (!cache.has(absolute)) {
            cache.set(absolute, extractHeadingSlugs(readFileSync(absolute, 'utf8')))
        }
        return cache.get(absolute)
    }

    const lines = content.split(/\r?\n/u)
    lines.forEach((line, index) => {
        for (const target of extractLinkTargets(line)) {
            if (/^[a-z][a-z0-9+.-]*:/iu.test(target) || target.startsWith('//')) {
                continue
            }
            const [pathPart, rawAnchor] = target.split('#')
            if (!rawAnchor) {
                continue
            }
            const anchor = decodeURIComponent(rawAnchor)
            const targetFile = pathPart
                ? resolve(dirname(file), pathPart)
                : file
            if (!existsSync(targetFile)) {
                /* 文件级死链不归本脚本管（ignoreDeadLinks 另议）；只关心锚点 */
                continue
            }
            const slugs = fallbackSlugsOf(targetFile)
            const expected = githubSlugify(anchor)
            /* 引用还可能写成站点生成的完整 slug 或 GitHub 原文，两者同口径后应一致 */
            if (slugs.includes(anchor) || slugs.includes(expected)) {
                continue
            }
            problems.push({
                file: relative(rootDir, file),
                line: index + 1,
                target,
                reason: `目标文件没有匹配的标题（期望 slug: ${expected}）`,
            })
        }
    })

    return problems
}

export function checkAnchors(rootDir, entries = SCAN_ROOTS) {
    const files = collectMarkdownFiles(rootDir, entries)
    const cache = new Map()
    const problems = []
    for (const file of files) {
        problems.push(...checkFile(rootDir, file, cache))
    }
    return { files: files.length, problems }
}

function main() {
    const rootDir = resolve(import.meta.dirname, '../..')
    const { files, problems } = checkAnchors(rootDir)

    if (problems.length > 0) {
        console.error(`[docs:anchors] ${problems.length} 个锚点引用失效（扫描 ${files} 个文件）：`)
        for (const problem of problems) {
            console.error(`  - ${problem.file}:${problem.line} → ${problem.target}：${problem.reason}`)
        }
        process.exit(1)
    }

    console.log(`[docs:anchors] 锚点校验通过（扫描 ${files} 个文件）`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
    main()
}
