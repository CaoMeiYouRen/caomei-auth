import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    analyzeSource,
    collectFiles,
    countE2ePClassAssertions,
    extractPrimeVueComponents,
    summarize,
} from '../../../scripts/migration/primevue-usage.mjs'

const COMPONENTS = ['Button', 'InputText', 'Column']

describe('scripts/migration/primevue-usage', () => {
    let tempDir = ''

    afterEach(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true })
            tempDir = ''
        }
    })

    it('extracts component names from primevue index.d.ts', () => {
        const content = `
export * from 'primevue/utils';
export { default as Button } from 'primevue/button';
export { default as InputText } from 'primevue/inputtext';
export { default as __Internal } from 'primevue/internal';
`
        expect(extractPrimeVueComponents(content)).toEqual(['Button', 'InputText', '__Internal'])
    })

    it('counts open tags, token and class coupling', () => {
        const source = `
<template>
    <Button label="保存" />
    <Button />
    <InputText v-model="value" />
    <!-- <Column> 注释里的标签同样计入，脚本只做存在性盘点 -->
</template>
<style>
.x { color: var(--p-primary-color); border-color: var(--p-primary-color); }
.y { color: var(--p-surface-0); }
:deep(.p-button) { }
.p-inputtext { }
</style>
<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
const toast = useToast()
const confirm = useConfirm()
</script>
`
        const analysis = analyzeSource(source, COMPONENTS)

        expect(analysis.openTagCount).toBe(4)
        expect(analysis.openTags).toEqual({ Button: 2, InputText: 1, Column: 1 })
        expect(analysis.useToast).toBe(true)
        expect(analysis.useConfirm).toBe(true)
        expect(analysis.explicitPrimeVueImport).toBe(true)
        expect(analysis.primeVueMock).toBe(false)
        expect(analysis.pTokenCount).toBe(2)
        expect(analysis.pClasses).toBe(2)
        expect(analysis.deepSelectors).toBe(1)
    })

    it('does not match partial component names', () => {
        const analysis = analyzeSource('<ButtonGroup /><Button />', ['Button'])

        expect(analysis.openTags).toEqual({ Button: 1 })
    })

    it('summarizes metrics deterministically', () => {
        const analyses = [
            {
                file: 'b.vue',
                openTags: { Button: 2 },
                openTagCount: 2,
                useToast: true,
                useConfirm: false,
                explicitPrimeVueImport: false,
                primeVueMock: false,
                pTokenCount: 0,
                pClasses: 3,
                deepSelectors: 1,
            },
            {
                file: 'a.vue',
                openTags: { Button: 1, Column: 4 },
                openTagCount: 5,
                useToast: false,
                useConfirm: true,
                explicitPrimeVueImport: true,
                primeVueMock: true,
                pTokenCount: 2,
                pClasses: 0,
                deepSelectors: 0,
            },
        ]

        const summary = summarize(analyses, { e2ePClassAssertions: 0 })

        expect(summary.totals).toEqual({ componentFamilies: 2, openTags: 7, files: 2 })
        expect(Object.keys(summary.components)).toEqual(['Column', 'Button'])
        expect(summary.components).toEqual({ Column: 4, Button: 3 })
        expect(summary.filesByComponent.Button).toEqual(['a.vue', 'b.vue'])
        expect(summary.metrics.useToastFiles).toEqual(['b.vue'])
        expect(summary.metrics.useConfirmFiles).toEqual(['a.vue'])
        expect(summary.metrics.pTokenOccurrences).toBe(2)
        expect(summary.metrics.pClassOccurrences).toBe(3)
        expect(summary.metrics.deepSelectors).toBe(1)
    })

    it('counts e2e p-class assertions', () => {
        expect(countE2ePClassAssertions([
            'expect(page.locator(\'.p-button\')).toBeVisible()',
            'expect(page.locator(\'.p-dialog\')).toBeVisible()',
            'expect(page).toHaveTitle(/登录/)',
        ])).toBe(2)
    })

    it('collects files while skipping excluded directories', async () => {
        tempDir = await mkdtemp(path.join(tmpdir(), 'primevue-usage-'))
        await mkdir(path.join(tempDir, 'components'), { recursive: true })
        await mkdir(path.join(tempDir, 'node_modules'), { recursive: true })
        await writeFile(path.join(tempDir, 'components', 'a.vue'), '<template />')
        await writeFile(path.join(tempDir, 'b.vue'), '<template />')
        await writeFile(path.join(tempDir, 'notes.md'), '#')
        await writeFile(path.join(tempDir, 'node_modules', 'c.vue'), '<template />')

        await expect(collectFiles(tempDir, { suffix: '.vue' })).resolves.toEqual([
            'b.vue',
            'components/a.vue',
        ])
    })
})
