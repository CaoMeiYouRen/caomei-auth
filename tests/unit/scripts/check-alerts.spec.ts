import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../..')
const scriptPath = path.join(projectRoot, 'scripts/security/check-alerts.mjs')
const fixturesDir = path.join(projectRoot, 'tests/fixtures/security-alerts')

function fixture(name: string) {
    return path.join(fixturesDir, name)
}

interface GateResult {
    code: number
    output: string
}

async function runGate(args: string[]): Promise<GateResult> {
    try {
        const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, ...args], {
            cwd: projectRoot,
            encoding: 'utf8',
        })
        return { code: 0, output: `${stdout}\n${stderr}` }
    } catch (error) {
        const failure = error as { code?: number | string, stdout?: string, stderr?: string }
        return {
            code: typeof failure.code === 'number' ? failure.code : 1,
            output: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}`,
        }
    }
}

const dependabotOpenArgs = [
    `--dependabot-json=${fixture('dependabot-open.json')}`,
    `--code-scanning-json=${fixture('code-scanning-empty.json')}`,
]

describe('scripts/security/check-alerts', () => {
    it('blocks when a high alert has no exemption', async () => {
        const result = await runGate([...dependabotOpenArgs, `--exemptions=${fixture('exemptions-empty.json')}`])

        expect(result.code).toBe(1)
        expect(result.output).toContain('未通过')
        expect(result.output).toContain('high 未登记豁免')
    })

    it('passes when a high alert has a valid exemption', async () => {
        const result = await runGate([...dependabotOpenArgs, `--exemptions=${fixture('exemptions-high.json')}`])

        expect(result.code).toBe(0)
        expect(result.output).toContain('✅ 通过')
        expect(result.output).toContain('已豁免的 high 告警')
        expect(result.output).toContain('上游暂无可用修复版本')
    })

    it('rejects exemptions registered for critical alerts', async () => {
        const result = await runGate([
            `--dependabot-json=${fixture('dependabot-empty.json')}`,
            `--code-scanning-json=${fixture('code-scanning-open.json')}`,
            `--exemptions=${fixture('exemptions-critical.json')}`,
        ])

        expect(result.code).toBe(1)
        expect(result.output).toContain('critical 不允许豁免')
    })

    it('blocks when the exemption expired', async () => {
        const result = await runGate([...dependabotOpenArgs, `--exemptions=${fixture('exemptions-expired.json')}`])

        expect(result.code).toBe(1)
        expect(result.output).toContain('high 豁免已过期')
    })

    it('fails when an exemption misses the tracking field', async () => {
        const result = await runGate([...dependabotOpenArgs, `--exemptions=${fixture('exemptions-missing-tracking.json')}`])

        expect(result.code).toBe(1)
        expect(result.output).toContain('缺少 tracking')
    })

    it('does not block on medium and low alerts', async () => {
        const result = await runGate([
            `--dependabot-json=${fixture('dependabot-non-blocking.json')}`,
            `--code-scanning-json=${fixture('code-scanning-empty.json')}`,
            `--exemptions=${fixture('exemptions-empty.json')}`,
        ])

        expect(result.code).toBe(0)
        expect(result.output).toContain('暂不阻塞')
    })

    it('writes machine-readable report when --json is provided', async () => {
        const reportDir = await mkdtemp(path.join(tmpdir(), 'security-alert-gate-'))
        const jsonPath = path.join(reportDir, 'report.json')
        const result = await runGate([
            ...dependabotOpenArgs,
            `--exemptions=${fixture('exemptions-high.json')}`,
            '--scope=weekly',
            `--json=${jsonPath}`,
        ])

        expect(result.code).toBe(0)

        const payload = JSON.parse(await readFile(jsonPath, 'utf8')) as {
            passed: boolean
            scope: string
            counts: { exempted: number, nonBlocking: number, bySeverity: Record<string, number> }
        }

        expect(payload.passed).toBe(true)
        expect(payload.scope).toBe('weekly')
        expect(payload.counts.exempted).toBe(1)
        expect(payload.counts.nonBlocking).toBe(1)
        expect(payload.counts.bySeverity.high).toBe(1)
    })
})
