import { expect, test } from '@playwright/test'
import { applyTheme, expectNoHorizontalOverflow, waitForVisualStable, type VisualTheme } from '../helpers/visual'
import { useAdminSession } from '../helpers/admin-session'

/**
 * 登录事件热力图基线（阶段 12 M3.2；阶段 13 M4.1 补 1440 交互态基准宽度）。
 *
 * - 四个视口均截取 `.login-event-heatmap` 元素，浅 / 暗各 1 张；
 * - 1440 交互态基准宽度下，168 个桶的最小内容宽度（1480px）超过容器，
 *   由容器内部横向滚动承载；阶段 14 M5.2 起同时断言页面级横向溢出为 0
 *   （布局主区允许收缩，宽表格 / 热力图各自内部滚动），并断言溢出量、
 *   7 个类型标签与 7 × 168 个 cell；右端溢出区不入像素基线，由 cell 计数断言覆盖。
 * 数据来自 `scripts/testing/visual-fixtures.mjs` 的 80 条确定性登录事件。
 */
const VIEWPORTS = [
    { name: 'desktop', width: 1800, height: 900 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
] as const

const THEMES: readonly VisualTheme[] = ['light', 'dark']

for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
        test(`登录事件热力图（${theme} / ${viewport.name}）`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
            await applyTheme(page, theme)
            await useAdminSession(page)
            await page.goto('/admin/logs')

            const heatmap = page.locator('.login-event-heatmap')
            await expect(heatmap.getByRole('heading', { name: '事件热力图' })).toBeVisible()
            await expect(heatmap.locator('.heatmap-cell').first()).toBeVisible()
            await heatmap.scrollIntoViewIfNeeded()
            await page.waitForTimeout(200)
            if (theme === 'dark') {
                await expect(page.locator('html')).toHaveClass(/dark/)
            } else {
                await expect(page.locator('html')).not.toHaveClass(/dark/)
            }
            await waitForVisualStable(page)

            if (viewport.name === 'desktop-1440') {
                const overflow = await heatmap.locator('.heatmap-scroll').evaluate((element) => {
                    element.scrollLeft = 0
                    return element.scrollWidth - element.clientWidth
                })
                expect(overflow).toBeGreaterThan(0)
                await expect(heatmap.locator('.heatmap-row__label')).toHaveCount(7)
                await expect(heatmap.locator('.heatmap-cell')).toHaveCount(7 * 168)
                /* 主区允许收缩后页面不应再有横向滚动，宽内容由热力图 / 表格容器内部承载 */
                await expectNoHorizontalOverflow(page, '1440 桌面下日志页出现横向溢出')
                await expect(heatmap).toHaveScreenshot(`login-event-heatmap-${theme}-${viewport.name}.png`)
            } else {
                await expect(heatmap).toHaveScreenshot(`login-event-heatmap-${theme}-${viewport.name}.png`)
            }
        })
    }
}
