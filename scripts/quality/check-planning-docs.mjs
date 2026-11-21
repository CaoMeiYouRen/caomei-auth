import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

/**
 * 规划文档机检（阶段 10 M5.4）。
 *
 * 覆盖 [规划规范](../../docs/standards/planning.md) §6 中可自动核验的条目：
 * 1. `todo.md` 进度表行数 = 正文大条目数，状态值在四值内，已闭环必须有审计结论；
 * 2. `todo-archive.md` 索引覆盖全部 `todo-archive-phases-*` 分片、无重复、倒序、无正文；
 * 3. 归档分片命名匹配 `todo-archive-phases-<起>[-<止>].md` / `roadmap-phases-<起>[-<止>].md`；
 * 4. 归档分片含 6 项必填字段。
 *
 * 不做事项：SHA 真实性、审计轮次真实性、容量数值合理性（依赖人工与 Review Gate）。
 */

export const STATUS_VALUES = ['未开始', '进行中', '已闭环', '已阻塞']

export const TODO_PATH = 'docs/plan/todo.md'
export const ARCHIVE_INDEX_PATH = 'docs/plan/todo-archive.md'
export const ARCHIVE_DIR = 'docs/plan/archive'

const TODO_SHARD_PATTERN = /^todo-archive-phases-\d+(?:-\d+)?\.md$/u
const ROADMAP_SHARD_PATTERN = /^roadmap-phases-\d+(?:-\d+)?\.md$/u

function readText(rootDir, relativePath) {
    const absolute = resolve(rootDir, relativePath)
    return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null
}

function listFiles(rootDir, relativeDir) {
    const absolute = resolve(rootDir, relativeDir)
    return existsSync(absolute) ? readdirSync(absolute) : []
}

function splitTableRow(line) {
    return line.split('|').slice(1, -1).map((cell) => cell.trim())
}

/** 提取 `todo.md` 中已授权阶段的进度表与大条目数量 */
export function extractStageSections(text) {
    const lines = text.split(/\r?\n/u)
    const sections = []
    let current = null
    for (const line of lines) {
        const heading = /^## (阶段\s*\d+.*)$/u.exec(line)
        if (heading) {
            if (current) {
                sections.push(current)
            }
            current = { title: heading[1], lines: [] }
            continue
        }
        if (/^## /u.test(line) && current) {
            sections.push(current)
            current = null
            continue
        }
        if (current) {
            current.lines.push(line)
        }
    }
    if (current) {
        sections.push(current)
    }
    return sections
}

export function parseProgressTable(lines) {
    const rows = []
    for (const line of lines) {
        if (!/^\|\s*M\d+/u.test(line)) {
            continue
        }
        const cells = splitTableRow(line)
        if (cells.length < 6) {
            continue
        }
        rows.push({
            milestone: cells[0],
            items: cells[1],
            status: cells[2],
            commits: cells[3],
            audit: cells[4],
            capacity: cells[5],
        })
    }
    return rows
}

function checkTodoDocument(rootDir, errors) {
    const text = readText(rootDir, TODO_PATH)
    if (text === null) {
        errors.push(`${TODO_PATH} 不存在`)
        return
    }
    const sections = extractStageSections(text)
    for (const section of sections) {
        const milestones = section.lines.filter((line) => /^###\s+M\d+/u.test(line))
        const rows = parseProgressTable(section.lines)
        if (milestones.length !== rows.length) {
            errors.push(`${TODO_PATH}「${section.title}」进度表行数（${rows.length}）≠ 正文大条目数（${milestones.length}）`)
        }
        for (const row of rows) {
            if (!/^\d+\/\d+$/u.test(row.items)) {
                errors.push(`${TODO_PATH}「${row.milestone}」小条目列应为「已闭环/总数」，实际为「${row.items}」`)
            }
            if (!STATUS_VALUES.includes(row.status)) {
                errors.push(`${TODO_PATH}「${row.milestone}」状态「${row.status}」不在 ${STATUS_VALUES.join(' / ')} 内`)
            }
            if (row.status === '已闭环' && !/^R\d/u.test(row.audit)) {
                errors.push(`${TODO_PATH}「${row.milestone}」已闭环但审计列没有 Review Gate 轮次`)
            }
        }
    }
}

function parseArchiveIndexRows(text) {
    const rows = []
    for (const line of text.split(/\r?\n/u)) {
        if (!/^\|/u.test(line) || !/todo-archive-phases-/u.test(line)) {
            continue
        }
        const cells = splitTableRow(line)
        if (cells.length < 4) {
            continue
        }
        const link = /\((?:\.\/)?(archive\/[^)]+\.md)\)/u.exec(cells[2]) ?? /(archive\/[^)|]+\.md)/u.exec(cells[2])
        rows.push({
            stage: cells[0],
            topic: cells[1],
            file: link ? link[1].replace(/^\.\//u, '') : null,
            date: cells[3],
        })
    }
    return rows
}

function checkArchive(rootDir, errors) {
    const indexText = readText(rootDir, ARCHIVE_INDEX_PATH)
    if (indexText === null) {
        errors.push(`${ARCHIVE_INDEX_PATH} 不存在`)
        return
    }
    const files = listFiles(rootDir, ARCHIVE_DIR)
    const todoShards = files.filter((file) => file.startsWith('todo-archive-phases-'))
    const roadmapShards = files.filter((file) => file.startsWith('roadmap-phases-'))

    for (const shard of todoShards) {
        if (!TODO_SHARD_PATTERN.test(shard)) {
            errors.push(`${ARCHIVE_DIR}/${shard} 命名不符合 todo-archive-phases-<起>[-<止>].md`)
        }
    }
    for (const shard of roadmapShards) {
        if (!ROADMAP_SHARD_PATTERN.test(shard)) {
            errors.push(`${ARCHIVE_DIR}/${shard} 命名不符合 roadmap-phases-<起>[-<止>].md`)
        }
    }

    if (/^###\s+M\d+/mu.test(indexText) || /^##\s+阶段\s*\d+/mu.test(indexText)) {
        errors.push(`${ARCHIVE_INDEX_PATH} 不应包含阶段正文`)
    }

    const rows = parseArchiveIndexRows(indexText)
    const listed = rows
        .map((row) => row.file)
        .filter(Boolean)
        .map((file) => (file.startsWith('docs/') ? file : `docs/plan/${file}`))
    if (new Set(listed).size !== listed.length) {
        errors.push(`${ARCHIVE_INDEX_PATH} 索引存在重复分片`)
    }
    for (const file of todoShards) {
        const relative = `${ARCHIVE_DIR}/${file}`
        if (!listed.includes(relative)) {
            errors.push(`${ARCHIVE_INDEX_PATH} 未登记分片 ${relative}`)
        }
    }
    for (const file of listed) {
        if (!existsSync(resolve(rootDir, file))) {
            errors.push(`${ARCHIVE_INDEX_PATH} 指向不存在的分片 ${file}`)
        }
    }

    let previous = null
    for (const row of rows) {
        if (!/^\d{4}-\d{2}-\d{2}$/u.test(row.date)) {
            errors.push(`${ARCHIVE_INDEX_PATH} 归档日期「${row.date}」不是 YYYY-MM-DD`)
            continue
        }
        if (previous && row.date > previous) {
            errors.push(`${ARCHIVE_INDEX_PATH} 未按归档日期倒序：${row.date} 晚于 ${previous}`)
        }
        previous = row.date
    }
}

const REQUIRED_BLOCK_FIELDS = [
    { label: '阶段名与时间', pattern: /阶段\**\s*[:：]/u },
    { label: '大条目清单与状态', pattern: /大条目/u },
    { label: '提交清单', pattern: /提交清单/u },
    { label: '质量门结果', pattern: /质量门/u },
    { label: 'Review Gate 结论与轮次', pattern: /Review Gate/u },
    { label: '未覆盖边界', pattern: /未覆盖边界/u },
]

export function checkArchiveBlock(text) {
    return REQUIRED_BLOCK_FIELDS
        .filter((field) => !field.pattern.test(text))
        .map((field) => field.label)
}

function checkArchiveBlocks(rootDir, errors) {
    const files = listFiles(rootDir, ARCHIVE_DIR).filter((file) => TODO_SHARD_PATTERN.test(file))
    for (const file of files) {
        const text = readText(rootDir, `${ARCHIVE_DIR}/${file}`)
        const missing = checkArchiveBlock(text ?? '')
        if (missing.length) {
            errors.push(`${ARCHIVE_DIR}/${file} 归档块缺少字段：${missing.join('、')}`)
        }
    }
}

/** 返回全部机检错误；空数组表示通过 */
export function checkPlanningDocs(rootDir = process.cwd()) {
    const errors = []
    checkTodoDocument(rootDir, errors)
    checkArchive(rootDir, errors)
    checkArchiveBlocks(rootDir, errors)
    return errors
}

function main() {
    const errors = checkPlanningDocs(process.cwd())
    if (errors.length) {
        for (const error of errors) {
            console.error(`[planning] ${error}`)
        }
        console.error(`[planning] ${errors.length} 项不通过`)
        process.exit(1)
    }
    console.log('[planning] 规划文档机检通过')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main()
}
