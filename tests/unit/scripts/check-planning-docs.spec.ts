import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    checkArchiveBlock,
    checkPlanningDocs,
    extractStageSections,
    parseProgressTable,
} from '../../../scripts/quality/check-planning-docs.mjs'

function createRoot(files: Record<string, string>) {
    const root = mkdtempSync(join(tmpdir(), 'planning-docs-'))
    for (const [relative, content] of Object.entries(files)) {
        const absolute = join(root, relative)
        mkdirSync(join(absolute, '..'), { recursive: true })
        writeFileSync(absolute, content)
    }
    return root
}

const TODO_VALID = `# 项目待办

## 当前状态

**当前阶段：阶段 10**

## 阶段 10：测试阶段

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 甲 | 2/2 | 已闭环 | \`abc1234\` | R1 Pass | 2 → 2 |

### M1 甲

- 目标
`

const INDEX_VALID = `# 阶段归档索引

## 阶段索引

| 阶段 | 主题 | 归档文件 | 归档日期 |
| :--- | :--- | :--- | :--- |
| 10 | 测试 | [分片](./archive/todo-archive-phases-10.md) | 2026-11-21 |
`

const SHARD_VALID = `# 阶段 10 归档

- **阶段**：阶段 10（2026-11-21）
- **大条目**：M1 已闭环
- **提交清单**：abc1234
- **质量门**：pnpm lint / typecheck / test 通过
- **Review Gate**：R1 Pass
- **未覆盖边界**：无
`

describe('scripts/quality/check-planning-docs', () => {
    it('passes a consistent todo and archive set', () => {
        const root = createRoot({
            'docs/plan/todo.md': TODO_VALID,
            'docs/plan/todo-archive.md': INDEX_VALID,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
        })
        expect(checkPlanningDocs(root)).toEqual([])
    })

    it('parses stage sections and progress rows', () => {
        const sections = extractStageSections(TODO_VALID)
        expect(sections).toHaveLength(1)
        const rows = parseProgressTable(sections[0]!.lines)
        expect(rows[0]).toMatchObject({ milestone: 'M1 甲', items: '2/2', status: '已闭环', audit: 'R1 Pass' })
    })

    it('rejects row/milestone mismatches, invalid status and missing audit', () => {
        const invalidStatus = createRoot({
            'docs/plan/todo.md': TODO_VALID.replace('| M1 甲 | 2/2 | 已闭环 | `abc1234` | R1 Pass | 2 → 2 |', '| M1 甲 | 2/2 | 做完了 | `abc1234` | R1 Pass | 2 → 2 |'),
            'docs/plan/todo-archive.md': INDEX_VALID,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
        })
        expect(checkPlanningDocs(invalidStatus).some((error) => error.includes('不在'))).toBe(true)

        const missingAudit = createRoot({
            'docs/plan/todo.md': TODO_VALID.replace('| M1 甲 | 2/2 | 已闭环 | `abc1234` | R1 Pass | 2 → 2 |', '| M1 甲 | 2/2 | 已闭环 | `abc1234` | — | 2 → 2 |'),
            'docs/plan/todo-archive.md': INDEX_VALID,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
        })
        expect(checkPlanningDocs(missingAudit).some((error) => error.includes('已闭环但审计列'))).toBe(true)

        const mismatch = createRoot({
            'docs/plan/todo.md': TODO_VALID.replace('### M1 甲', '### M1 甲\n\n### M2 乙'),
            'docs/plan/todo-archive.md': INDEX_VALID,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
        })
        expect(checkPlanningDocs(mismatch).some((error) => error.includes('进度表行数'))).toBe(true)
    })

    it('rejects duplicate, missing, out-of-order and unregistered archive shards', () => {
        const duplicateIndex = INDEX_VALID.replace(
            '| 10 | 测试 | [分片](./archive/todo-archive-phases-10.md) | 2026-11-21 |',
            '| 10 | 测试 | [分片](./archive/todo-archive-phases-10.md) | 2026-11-21 |\n| 9 | 测试 | [分片](./archive/todo-archive-phases-10.md) | 2026-11-22 |',
        )
        const root = createRoot({
            'docs/plan/todo.md': TODO_VALID,
            'docs/plan/todo-archive.md': duplicateIndex,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
            'docs/plan/archive/todo-archive-phases-9.md': SHARD_VALID,
            'docs/plan/archive/roadmap-phases-ten.md': '# bad',
        })
        const errors = checkPlanningDocs(root)
        expect(errors.some((error) => error.includes('重复分片'))).toBe(true)
        expect(errors.some((error) => error.includes('未登记分片 docs/plan/archive/todo-archive-phases-9.md'))).toBe(true)
        expect(errors.some((error) => error.includes('倒序'))).toBe(true)
        expect(errors.some((error) => error.includes('命名不符合 roadmap-phases'))).toBe(true)
    })

    it('rejects stage content inside the archive index', () => {
        const root = createRoot({
            'docs/plan/todo.md': TODO_VALID,
            'docs/plan/todo-archive.md': `${INDEX_VALID}\n## 阶段 10\n\n### M1 甲\n`,
            'docs/plan/archive/todo-archive-phases-10.md': SHARD_VALID,
        })
        expect(checkPlanningDocs(root).some((error) => error.includes('不应包含阶段正文'))).toBe(true)
    })

    it('reports missing archive block fields', () => {
        expect(checkArchiveBlock(SHARD_VALID)).toEqual([])
        expect(checkArchiveBlock('# 阶段 10\n')).toEqual([
            '阶段名与时间',
            '大条目清单与状态',
            '提交清单',
            '质量门结果',
            'Review Gate 结论与轮次',
            '未覆盖边界',
        ])
        const root = createRoot({
            'docs/plan/todo.md': TODO_VALID,
            'docs/plan/todo-archive.md': INDEX_VALID,
            'docs/plan/archive/todo-archive-phases-10.md': '# 只有标题\n',
        })
        expect(checkPlanningDocs(root).some((error) => error.includes('归档块缺少字段'))).toBe(true)
    })
})
