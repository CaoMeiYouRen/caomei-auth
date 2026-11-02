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

describe('scripts/ai/check-governance', () => {
    it('reports references that no execution entry indexes', async () => {
        const { skillRoot, agentRoot } = await createWorkspace()

        await writeFile(path.join(skillRoot, 'demo', 'SKILL.md'), '见 references/indexed.md\n', 'utf8')

        const issues = await collectSkillReferenceIssues(skillRoot, agentRoot) as GovernanceIssue[]

        expect(issues).toHaveLength(1)
        expect(issues[0]?.type).toBe('unindexed-skill-reference')
        expect(issues[0]?.filePath.endsWith('references/nested/orphan.md')).toBe(true)
    })

    it('accepts references indexed by the matching agent file', async () => {
        const { skillRoot, agentRoot } = await createWorkspace()

        await writeFile(path.join(skillRoot, 'demo', 'SKILL.md'), '无引用\n', 'utf8')
        await writeFile(
            path.join(agentRoot, 'demo.agent.md'),
            '- references/indexed.md\n- references/nested/orphan.md\n',
            'utf8',
        )

        const issues = await collectSkillReferenceIssues(skillRoot, agentRoot) as GovernanceIssue[]

        expect(issues).toHaveLength(0)
    })

    it('ignores skills without a references directory', async () => {
        const { skillRoot, agentRoot } = await createWorkspace()

        await mkdir(path.join(skillRoot, 'plain'), { recursive: true })
        await writeFile(path.join(skillRoot, 'plain', 'SKILL.md'), '无 references\n', 'utf8')

        const issues = await collectSkillReferenceIssues(skillRoot, agentRoot) as GovernanceIssue[]

        expect(issues.map((issue) => issue.filePath).some((file) => file.includes('plain'))).toBe(false)
    })
})
