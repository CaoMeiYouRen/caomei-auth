import { expect, test } from '@playwright/test'
import { applyTheme, waitForVisualStable, type VisualTheme } from '../helpers/visual'
import { useAdminSession } from '../helpers/admin-session'

/**
 * 登录事件热力图基线（阶段 12 M3.2）。
 *
 * 3 个视口 × 浅 / 暗色共 6 张，截取 `.login-event-heatmap` 元素：
 * 数据来自 `scripts/testing/visual-fixtures.mjs` 的 80 条确定性登录事件。
 */
const VIEWPORTS = [
    { name: 'desktop', width: 1800, height: 900 },
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

            await expect(heatmap).toHaveScreenshot(`login-event-heatmap-${theme}-${viewport.name}.png`)
        })
    }
}
