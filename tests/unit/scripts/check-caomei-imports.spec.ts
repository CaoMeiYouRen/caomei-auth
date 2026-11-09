import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    checkProject,
    collectSourceFiles,
    findMissingImports,
    hasExplicitImport,
} from '../../../scripts/migration/check-caomei-imports.mjs'

describe('scripts/migration/check-caomei-imports', () => {
    let tempDir = ''

    afterEach(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true })
            tempDir = ''
        }
    })

    it('accepts explicit imports', () => {
        const source = `
import { useToast } from 'primevue/usetoast'
const toast = useToast()
`
        expect(hasExplicitImport(source, { name: 'useToast', source: 'primevue/usetoast' })).toBe(true)
        expect(findMissingImports(source)).toEqual([])
    })

    it('reports usage without explicit import', () => {
        const source = 'const toast = useToast()'

        expect(findMissingImports(source)).toEqual([
            { name: 'useToast', sources: ['primevue/usetoast', 'caomei-ui'] },
        ])
    })

    it('does not require imports when the composable is unused', () => {
        expect(findMissingImports('const value = 1')).toEqual([])
    })

    it('accepts caomei-ui as an explicit source', () => {
        const source = `
import { useToast } from 'caomei-ui'
const toast = useToast()
`
        expect(findMissingImports(source)).toEqual([])
    })

    it('ignores imports from other packages', () => {
        const source = `
import { useToast } from 'some-ui'
const toast = useToast()
`
        expect(findMissingImports(source)).toEqual([
            { name: 'useToast', sources: ['primevue/usetoast', 'caomei-ui'] },
        ])
    })

    it('handles multi-import statements', () => {
        const source = `
import { useConfirm, useToast } from 'primevue/usetoast'
useToast()
useConfirm()
`
        expect(hasExplicitImport(source, { name: 'useConfirm', source: 'primevue/usetoast' })).toBe(true)
    })

    it('collects source files from roots', async () => {
        tempDir = await mkdtemp(path.join(tmpdir(), 'caomei-imports-'))
        await mkdir(path.join(tempDir, 'pages'), { recursive: true })
        await mkdir(path.join(tempDir, 'pages', 'node_modules'), { recursive: true })
        await writeFile(path.join(tempDir, 'app.vue'), '<template />')
        await writeFile(path.join(tempDir, 'pages', 'login.vue'), '<template />')
        await writeFile(path.join(tempDir, 'pages', 'node_modules', 'ignored.vue'), '<template />')
        await writeFile(path.join(tempDir, 'pages', 'notes.md'), '#')

        await expect(collectSourceFiles(tempDir, ['app.vue', 'pages'])).resolves.toEqual([
            'app.vue',
            'pages/login.vue',
        ])
    })

    it('checks a project end to end', async () => {
        tempDir = await mkdtemp(path.join(tmpdir(), 'caomei-imports-'))
        await mkdir(path.join(tempDir, 'composables'), { recursive: true })
        await writeFile(
            path.join(tempDir, 'composables', 'ok.ts'),
            'import { useToast } from \'primevue/usetoast\'\nuseToast()\n',
        )
        await writeFile(path.join(tempDir, 'composables', 'bad.ts'), 'useConfirm()\n')

        const violations = await checkProject({ root: tempDir, roots: ['composables'] })

        expect(violations).toEqual([
            { file: 'composables/bad.ts', missing: [{ name: 'useConfirm', sources: ['primevue/useconfirm', 'caomei-ui'] }] },
        ])
    })
})
