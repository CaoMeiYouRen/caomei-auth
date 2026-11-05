import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectSkillReferenceIssues } from '../../../scripts/ai/check-governance.mjs'

interface GovernanceIssue {
    type: string
    filePath: string
    message: string
}

async function createWorkspace() {
    const root = await mkdtemp(path.join(tmpdir(), 'ai-governance-'))
    const skillRoot = path.join(root, 'skills')
    const agentRoot = path.join(root, 'agents')

    await mkdir(path.join(skillRoot, 'demo', 'references', 'nested'), { recursive: true })
    await mkdir(agentRoot, { recursive: true })
    await writeFile(path.join(skillRoot, 'demo', 'references', 'indexed.md'), '# indexed\n', 'utf8')
    await writeFile(path.join(skillRoot, 'demo', 'references', 'nested', 'orphan.md'), '# orphan\n', 'utf8')

    return { skillRoot, agentRoot, root }
}

async function collectIssues(skillContent: string, agentContent?: string) {
    const { skillRoot, agentRoot } = await createWorkspace()

    await writeFile(path.join(skillRoot, 'demo', 'SKILL.md'), skillContent, 'utf8')

    if (agentContent !== undefined) {
        await writeFile(path.join(agentRoot, 'demo.agent.md'), agentContent, 'utf8')
    }

    return await collectSkillReferenceIssues(skillRoot, agentRoot) as GovernanceIssue[]
}

describe('scripts/ai/check-governance', () => {
    it('rejects bare text mentions and reports unindexed references', async () => {
        const issues = await collectIssues('见 references/indexed.md\n')

        expect(issues).toHaveLength(2)
        expect(issues.every((issue) => issue.type === 'unindexed-skill-reference')).toBe(true)
        expect(issues.map((issue) => issue.filePath).some((file) => file.endsWith('references/nested/orphan.md'))).toBe(true)
    })

    it('accepts references indexed by relative markdown links', async () => {
        const issues = await collectIssues(
            '- [indexed](./references/indexed.md)\n- [orphan](./references/nested/orphan.md)\n',
        )

        expect(issues).toHaveLength(0)
    })

    it('accepts references indexed by the matching agent file', async () => {
        const issues = await collectIssues(
            '无引用\n',
            '- [indexed](./references/indexed.md)\n- [orphan](./references/nested/orphan.md)\n',
        )

        expect(issues).toHaveLength(0)
    })

    it('accepts angle-bracket targets and optional titles', async () => {
        const issues = await collectIssues(
            '[indexed](<./references/indexed.md> "标题")\n[orphan](./references/nested/orphan.md \'标题\')\n',
        )

        expect(issues).toHaveLength(0)
    })

    it('ignores image links and links inside code fences or inline code', async () => {
        const issues = await collectIssues(
            [
                '![indexed](./references/indexed.md)',
                '',
                '`[indexed](./references/indexed.md)`',
                '',
                '```md',
                '[orphan](./references/nested/orphan.md)',
                '```',
            ].join('\n'),
        )

        expect(issues).toHaveLength(2)
    })

    it('ignores external links and pure anchors', async () => {
        const issues = await collectIssues(
            '[external](https://example.com/references/indexed.md)\n[anchor](#references-indexed)\n',
        )

        expect(issues).toHaveLength(2)
    })

    it('ignores skills without a references directory', async () => {
        const { skillRoot, agentRoot } = await createWorkspace()

        await mkdir(path.join(skillRoot, 'plain'), { recursive: true })
        await writeFile(path.join(skillRoot, 'plain', 'SKILL.md'), '无 references\n', 'utf8')

        const issues = await collectSkillReferenceIssues(skillRoot, agentRoot) as GovernanceIssue[]

        expect(issues.map((issue) => issue.filePath).some((file) => file.includes('plain'))).toBe(false)
    })
})
