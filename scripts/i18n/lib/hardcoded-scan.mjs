import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CJK_PATTERN, parseJson, projectRoot } from './locale-data.mjs'

/**
 * 用户可见文本面：Vue 模板、Toast / Confirm 组合式函数、服务端 API 与模板。
 * 新增文件或新增中文行会与 allowlist 基线比较，基线外新增视为 blocker。
 */
export const HARDCODED_SCAN_TARGETS = [
    { path: 'app.vue', extensions: ['.vue'] },
    { path: 'pages', extensions: ['.vue'] },
    { path: 'components', extensions: ['.vue'] },
    { path: 'layouts', extensions: ['.vue'] },
    { path: 'composables', extensions: ['.ts'] },
    { path: 'server/api', extensions: ['.ts'] },
    { path: 'server/utils', extensions: ['.ts'] },
    { path: 'server/routes', extensions: ['.ts'] },
    { path: 'server/middleware', extensions: ['.ts'] },
    { path: 'server/templates', extensions: ['.mjml', '.ts'] },
]

export const HARDCODED_ALLOWLIST_PATH = path.join(projectRoot, 'i18n', 'hardcoded-text-allowlist.json')

const IGNORED_DIRECTORIES = new Set(['node_modules', '.nuxt', '.output', 'dist', 'coverage', 'test-results', 'playwright-report', '.git'])

const TS_BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu
const TS_LINE_COMMENT_PATTERN = /^\s*\/\/.*$/gmu

/**
 * 逐段移除 HTML 注释，避免单次正则替换留下的 `<!--` 片段。
 * 扫描器只做行计数，不做 HTML 输出；这里仍按完整注释区间消费输入。
 * @param {string} text
 */
function stripHtmlComments(text) {
    let result = ''
    let cursor = 0
    while (cursor < text.length) {
        const start = text.indexOf('<!--', cursor)
        if (start === -1) {
            result += text.slice(cursor)
            break
        }
        result += text.slice(cursor, start)
        const end = text.indexOf('-->', start + 4)
        if (end === -1) {
            break
        }
        cursor = end + 3
    }
    return result
}

/**
 * 提取 `.vue` 的根模板。使用最后一个 `</template>` 以保留嵌套的 `<template #slot>`。
 * @param {string} source
 */
export function extractVueTemplate(source) {
    const startMatch = /<template\b[^>]*>/u.exec(source)
    if (!startMatch) {
        return ''
    }
    const start = startMatch.index + startMatch[0].length
    const end = source.lastIndexOf('</template>')
    if (end <= start) {
        return ''
    }
    return source.slice(start, end)
}

/**
 * 去掉注释后统计包含中文的行数。
 * @param {string} filePath 相对路径，用于判断文件类型
 * @param {string} source
 */
export function countHardcodedLines(filePath, source) {
    const extension = path.extname(filePath)
    let text = source
    if (extension === '.vue') {
        text = stripHtmlComments(extractVueTemplate(source))
    } else if (extension === '.mjml') {
        text = stripHtmlComments(source)
    } else {
        text = source
            .replace(TS_BLOCK_COMMENT_PATTERN, '')
            .replace(TS_LINE_COMMENT_PATTERN, '')
    }

    return text
        .split(/\r?\n/u)
        .filter((line) => CJK_PATTERN.test(line))
        .length
}

async function collectFiles(targetPath, extensions, files) {
    const targetStat = await stat(targetPath)
    if (targetStat.isDirectory()) {
        const entries = await readdir(targetPath, { withFileTypes: true })
        for (const entry of entries) {
            if (IGNORED_DIRECTORIES.has(entry.name)) {
                continue
            }
            await collectFiles(path.join(targetPath, entry.name), extensions, files)
        }
        return
    }
    if (targetStat.isFile() && extensions.has(path.extname(targetPath))) {
        files.push(targetPath)
    }
}

/**
 * 扫描全部目标文件，返回相对路径 → 中文行数。
 * @returns {Promise<Map<string, number>>}
 */
export async function scanHardcodedText() {
    const targets = []
    for (const target of HARDCODED_SCAN_TARGETS) {
        await collectFiles(path.join(projectRoot, target.path), new Set(target.extensions), targets)
    }

    const result = new Map()
    for (const file of targets.sort()) {
        const relativePath = path.relative(projectRoot, file).replaceAll('\\', '/')
        const count = countHardcodedLines(relativePath, await readFile(file, 'utf8'))
        if (count > 0) {
            result.set(relativePath, count)
        }
    }
    return result
}

export function normalizeAllowlist(parsed) {
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.files !== 'object' || parsed.files === null) {
        throw new Error('硬编码中文基线格式不正确：缺少 files 对象')
    }
    const files = {}
    for (const [file, count] of Object.entries(parsed.files)) {
        if (!Number.isInteger(count) || count < 0) {
            throw new Error(`硬编码中文基线计数非法：${file} → ${String(count)}`)
        }
        files[file] = count
    }
    return { version: 1, files }
}

export async function loadHardcodedAllowlist() {
    try {
        const content = await readFile(HARDCODED_ALLOWLIST_PATH, 'utf8')
        return normalizeAllowlist(parseJson(content, HARDCODED_ALLOWLIST_PATH))
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return { version: 1, files: {} }
        }
        throw error
    }
}

function sortObject(entries) {
    return Object.fromEntries([...entries].sort(([left], [right]) => left.localeCompare(right, 'en')))
}

export async function writeHardcodedAllowlist(current) {
    const payload = {
        version: 1,
        description: '存量硬编码中文基线：文件 → 中文行数。新增文件或增加行数会被 i18n:audit:hardcoded 阻断；翻译完成后运行 pnpm i18n:audit:hardcoded:update 收紧。',
        files: sortObject([...current.entries()].filter(([, count]) => count > 0)),
    }
    await writeFile(HARDCODED_ALLOWLIST_PATH, `${JSON.stringify(payload, null, 4)}\n`, 'utf8')
    return payload
}

export function diffHardcodedAllowlist(current, allowlistFiles) {
    const newFiles = []
    const increased = []
    const decreased = []
    for (const [file, count] of [...current.entries()].sort(([left], [right]) => left.localeCompare(right, 'en'))) {
        const allowed = allowlistFiles[file]
        if (allowed === undefined) {
            newFiles.push({ file, count })
        } else if (count > allowed) {
            increased.push({ file, count, allowed })
        } else if (count < allowed) {
            decreased.push({ file, count, allowed })
        }
    }

    const stale = Object.keys(allowlistFiles)
        .filter((file) => !current.has(file))
        .sort((left, right) => left.localeCompare(right, 'en'))
        .map((file) => ({ file, allowed: allowlistFiles[file] }))

    return { newFiles, increased, decreased, stale }
}
