import { expect, test } from '@playwright/test'
import { visualBaseURL } from '../helpers/config'
import { applyTheme, expectNoHorizontalOverflow, expectPageScreenshot, waitForVisualStable, type VisualTheme } from '../helpers/visual'

/**
 * 登录页 2FA 挑战交互态（阶段 11 M5.2）。
 *
 * 覆盖桌面 / 移动与浅色 / 暗色；挑战由 URL 查询触发，完成后 URL 参数应被清理。
 */
const VIEWPORTS = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
] as const

const THEMES: readonly VisualTheme[] = ['light', 'dark']

for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })

        for (const theme of THEMES) {
            test(`login 2FA 挑战（${theme} / ${viewport.name}）`, async ({ page }) => {
                await applyTheme(page, theme)
                await page.goto(`${visualBaseURL}/login?twoFactor=1&channel=magic-link`, { waitUntil: 'domcontentloaded' })
                await expect(page.getByRole('dialog')).toBeVisible()
                await expect(page.getByText('双因素认证', { exact: true })).toBeVisible()
                await expect(page.getByText(/本次登录由魔法链接触发/u)).toBeVisible()
                await expect(page).not.toHaveURL(/twoFactor=1/u)
                await waitForVisualStable(page)
                await expectNoHorizontalOverflow(page)
                await expectPageScreenshot(page, `login-two-factor-challenge-${theme}-${viewport.name}`)
            })
        }
    })
}
