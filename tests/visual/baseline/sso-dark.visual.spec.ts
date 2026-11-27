import { expect, test } from '@playwright/test'
import { applyTheme, dynamicMask, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'

/**
 * 阶段 16 M3.2：`/sso-login` 暗色基线（390 / 768 各 1 张）。
 *
 * 计算样式断言先于像素：token 映射错误时先红并给出具体色值，
 * 不必等基线漂移再反查是哪一块漏了暗色。浅色基线由认证矩阵保持，桌面浅色不变。
 */

const DARK_BACKGROUND = 'rgb(18, 18, 18)'
const DARK_SURFACE = 'rgb(30, 30, 30)'
const DARK_TEXT_MUTED = 'rgb(161, 161, 170)'

const VIEWPORTS = [
    { name: '390', width: 390, height: 844 },
    { name: '768', width: 768, height: 1024 },
] as const

test.describe('SSO 登录页暗色', () => {
    for (const viewport of VIEWPORTS) {
        test(`视口 ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
            await applyTheme(page, 'dark')
            await page.goto('/sso-login', { waitUntil: 'domcontentloaded' })
            await expect(page.locator('.sso-login')).toBeVisible()
            await waitForVisualStable(page)
            await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })

            /* 页面底色：不再有浅色渐变残留 */
            const pageBackground = await page.locator('.sso-login').evaluate((element) => getComputedStyle(element).backgroundImage)
            expect(pageBackground, `${viewport.name} SSO 页底色未使用暗色 token`).toContain(DARK_BACKGROUND)

            /* 方法卡 / 提供方区 / 普通登录入口同属暗色系 */
            for (const selector of ['.sso-method', '.regular-login']) {
                const card = page.locator(selector).first()
                await expect(card, `${viewport.name} ${selector} 未渲染`).toBeVisible()
                const background = await card.evaluate((element) => getComputedStyle(element).backgroundColor)
                expect(background, `${viewport.name} ${selector} 仍是浅色卡片`).toBe(DARK_SURFACE)
            }

            const providers = page.locator('.available-providers')
            if (await providers.count()) {
                const background = await providers.evaluate((element) => getComputedStyle(element).backgroundColor)
                expect(background, `${viewport.name} 提供方区仍是浅色卡片`).toBe(DARK_SURFACE)
            }

            /* 说明文字使用暗色 muted token，避免 #718096 在 #1e1e1e 上的低对比 */
            const mutedColor = await page.locator('.sso-method .text-muted').first().evaluate((element) => getComputedStyle(element).color)
            expect(mutedColor, `${viewport.name} SSO 说明文字未接入暗色 muted token`).toBe(DARK_TEXT_MUTED)

            await expectNoHorizontalOverflow(page, `${viewport.name} SSO 暗色页出现横向溢出`)
            await expect(page).toHaveScreenshot(`sso-login-dark-${viewport.name}.png`, { mask: dynamicMask(page) })
        })
    }
})
