import { defineConfig } from '@playwright/test'
import { visualExpect, visualUse, visualWebServer } from './tests/visual/helpers/config'

/**
 * 视觉参考态层（visual reference）独立工程。
 *
 * 职责：把「组件迁移前的渲染原貌」固化为随仓库提交的参考快照，供迁移批次逐路由比对，
 * 避免「迁移后自拍自比」——仓库里的自基线无法自证与迁移前一致。
 *
 * 独立入口：
 * - `pnpm test:visual:parity`    比对当前渲染 ↔ 迁移前参考态
 * - `pnpm test:visual:reference` 采集参考态（`--update-snapshots`，仅允许在迁移前提交上执行）
 *
 * 依据见 docs/design/governance/2026-11-08-visual-baseline-harness.md。
 */
export default defineConfig({
    testDir: './tests/visual/parity',
    testMatch: '**/*.visual-parity.spec.ts',
    /* 截图层串行：避免并行渲染导致字体 / 布局抖动 */
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    /* 截图层不重试：不稳定即失败并归因，不用重试掩盖抖动 */
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: visualExpect,
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-parity-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual-parity' }], ['list']],
    /* 参考态快照随仓库提交；失败产物 -actual / -diff 落于 outputDir，不污染参考态目录 */
    snapshotPathTemplate: 'tests/visual/reference/{testFilePath}/{arg}{ext}',
    outputDir: 'test-results/visual-parity',
    use: visualUse,
    webServer: visualWebServer,
})
