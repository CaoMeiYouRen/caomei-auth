import { expect, test } from '@playwright/test'
import { applyTheme, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'
import { useAdminSession } from '../helpers/admin-session'

/**
 * `/admin/logs` 窄桌面布局守卫（阶段 14 M5）。
 *
 * 1440 的页面级无溢出由 admin 矩阵与热力图用例覆盖；769–1240 这一档既不走移动端堆叠分支，
 * 也不在既有视觉矩阵内，筛选行换行一旦回退会被 `overflow: hidden` 裁掉且无提示。
 * 这里用一条无截图的轻量用例守住：页面无横向溢出，且筛选控件全部落在卡片边界内。
 */
test('admin-logs 1024 窄桌面筛选行不被裁切', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await applyTheme(page, 'light')
    await useAdminSession(page)
    await page.goto('/admin/logs')

    await expect(page.locator('.login-event-heatmap').getByRole('heading', { name: '事件热力图' })).toBeVisible()
    await expect(page.locator('.detail-filters').getByRole('button').first()).toBeVisible()
    await waitForVisualStable(page)

    await expectNoHorizontalOverflow(page, '1024 桌面下日志页出现横向溢出')

    const clipping = await page.evaluate(() => {
        const detail = document.querySelector<HTMLElement>('.logs-detail')
        const filters = document.querySelector<HTMLElement>('.detail-filters')
        if (!detail || !filters) {
            return { missing: true, clipped: [] as string[] }
        }
        const boundary = detail.getBoundingClientRect()
        const clipped = Array.from(filters.querySelectorAll<HTMLElement>('button, input, [role="combobox"], .filter-item'))
            .filter((element) => {
                const rect = element.getBoundingClientRect()
                return rect.width > 0 && (rect.right > boundary.right + 1 || rect.left < boundary.left - 1)
            })
            .map((element) => (typeof element.className === 'string' ? element.className : element.tagName))
        return { missing: false, clipped }
    })

    expect(clipping.missing).toBe(false)
    expect(clipping.clipped, `筛选控件越出卡片边界：${clipping.clipped.join(', ')}`).toEqual([])
})
