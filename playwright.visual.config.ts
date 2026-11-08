import { defineConfig } from '@playwright/test'
import { visualExpect, visualUse, visualWebServer } from './tests/visual/helpers/config'

/**
 * 视觉自基线层（visual baseline）独立工程。
 *
 * 职责：记录「当前已接受的渲染状态」，用于后续回归检测；与参考态层（迁移前原貌）分离，
 * 避免更新自基线时丢掉迁移一致性证据。
 *
 * 独立入口：
 * - `pnpm test:visual`        比对当前渲染 ↔ 自基线
 * - `pnpm test:visual:update` 更新自基线（仅在差异完成归因后使用）
 *
 * 依据见 docs/design/governance/2026-11-08-visual-baseline-harness.md。
 */
export default defineConfig({
    testDir: './tests/visual/baseline',
    testMatch: '**/*.visual.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: visualExpect,
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual' }], ['list']],
    snapshotPathTemplate: 'tests/visual/__screenshots__/{testFilePath}/{arg}{ext}',
    outputDir: 'test-results/visual',
    use: visualUse,
    webServer: visualWebServer,
})
