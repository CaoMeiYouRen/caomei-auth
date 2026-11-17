import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
    buildUpdatedBaseline,
    collectSourceFiles,
    countLines,
    DEFAULT_THRESHOLD,
    evaluateFileSizes,
    findAddedBaselineEntries,
    resolveThreshold,
} from '../../../scripts/quality/check-file-size.mjs'

type BaselineEntry = { lines: number, owner: string, plan: string }
type Baseline = { threshold?: number, files: Record<string, BaselineEntry> }

function entry(lines: number): BaselineEntry {
    return { lines, owner: 'owner', plan: 'plan' }
}

function evaluate(files: { path: string, lines: number }[], baseline: Baseline, threshold = DEFAULT_THRESHOLD) {
    return evaluateFileSizes(files, baseline, threshold)
}

const temporaryRoots: string[] = []

afterAll(() => {
    for (const root of temporaryRoots) {
        rmSync(root, { recursive: true, force: true })
    }
})

describe('scripts/quality/check-file-size', () => {
    describe('countLines', () => {
        it('treats the trailing newline as a line terminator, not a new line', () => {
            expect(countLines('')).toBe(0)
            expect(countLines('a\nb\n')).toBe(2)
            expect(countLines('a\nb')).toBe(2)
        })
    })

    describe('resolveThreshold', () => {
        it('uses the gate constant and rejects a relaxed baseline threshold', () => {
            expect(resolveThreshold({})).toBe(DEFAULT_THRESHOLD)
            expect(resolveThreshold({ threshold: DEFAULT_THRESHOLD })).toBe(DEFAULT_THRESHOLD)
            expect(() => resolveThreshold({ threshold: 5000 })).toThrow('阈值不得由基线文件放宽')
        })
    })

    describe('collectSourceFiles', () => {
        it('walks nested directories, filters extensions and skips ignored directories', () => {
            const root = mkdtempSync(join(tmpdir(), 'file-size-scan-'))
            temporaryRoots.push(root)
            mkdirSync(join(root, 'sub'))
            mkdirSync(join(root, 'node_modules'))
            writeFileSync(join(root, 'a.ts'), 'const a = 1\n')
            writeFileSync(join(root, 'sub', 'b.vue'), '<template><div /></template>\n')
            writeFileSync(join(root, 'node_modules', 'ignored.ts'), 'x\n'.repeat(1000))
            writeFileSync(join(root, 'notes.md'), '# notes\n')

            expect(collectSourceFiles(root)).toEqual([
                { path: 'a.ts', lines: 1 },
                { path: 'sub/b.vue', lines: 1 },
            ])
        })
    })

    describe('findAddedBaselineEntries', () => {
        it('reports only entries absent from the reference baseline', () => {
            const added = findAddedBaselineEntries(
                { files: { 'a.ts': entry(700), 'b.ts': entry(650) } },
                { files: { 'a.ts': entry(700) } },
            )
            expect(added).toEqual(['b.ts'])
        })
    })

    describe('evaluateFileSizes', () => {
        it('accepts files at the threshold and rejects files above it', () => {
            expect(evaluate([{ path: 'a.ts', lines: 600 }], { files: {} }).passed).toBe(true)

            const result = evaluate([{ path: 'a.ts', lines: 601 }], { files: {} })
            expect(result.passed).toBe(false)
            expect(result.errors).toEqual([expect.objectContaining({ code: 'over-threshold', path: 'a.ts' })])
        })

        it('rejects growth beyond the baseline line count', () => {
            const result = evaluate([{ path: 'a.ts', lines: 701 }], { files: { 'a.ts': entry(700) } })
            expect(result.passed).toBe(false)
            expect(result.errors).toEqual([expect.objectContaining({ code: 'baseline-growth' })])
        })

        it('warns when a baseline file shrinks or falls below the threshold', () => {
            const result = evaluate([{ path: 'a.ts', lines: 650 }, { path: 'b.ts', lines: 590 }], {
                files: { 'a.ts': entry(700), 'b.ts': entry(600) },
            })
            expect(result.passed).toBe(true)
            expect(result.warnings.map((warning) => warning.code)).toEqual([
                'baseline-shrinkable',
                'baseline-below-threshold',
                'baseline-shrinkable',
            ])
        })

        it('rejects stale baseline entries and missing metadata', () => {
            const result = evaluate([], { files: { 'gone.ts': { lines: 700, owner: '', plan: '' } } })
            expect(result.errors.map((error) => error.code)).toEqual(['baseline-metadata', 'baseline-stale'])
        })

        it('rejects baseline entries without a valid line count', () => {
            const result = evaluate([], { files: { 'a.ts': { lines: 0, owner: 'owner', plan: 'plan' } } })
            expect(result.errors).toEqual([expect.objectContaining({ code: 'baseline-invalid' })])
        })
    })

    describe('buildUpdatedBaseline', () => {
        it('lowers baseline counts, drops covered and stale entries, and keeps metadata', () => {
            const result = buildUpdatedBaseline(
                [{ path: 'big.ts', lines: 650 }, { path: 'small.ts', lines: 580 }],
                { threshold: 600, files: { 'big.ts': entry(700), 'small.ts': entry(610), 'gone.ts': entry(620) } },
            )

            expect(result.updated).toEqual(['big.ts: 700 → 650'])
            expect(result.removed).toEqual(['small.ts', 'gone.ts'])
            expect(result.baseline).toEqual({ threshold: 600, files: { 'big.ts': entry(650) } })
        })

        it('refuses to update when a baseline file grew or a new file exceeds the threshold', () => {
            expect(() => buildUpdatedBaseline([{ path: 'big.ts', lines: 701 }], { files: { 'big.ts': entry(700) } })).toThrow('big.ts')
            expect(() => buildUpdatedBaseline([{ path: 'new.ts', lines: 650 }], { files: {} })).toThrow('new.ts')
        })
    })
})
