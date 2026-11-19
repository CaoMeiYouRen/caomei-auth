import { expect, test } from '@playwright/test'
import { applyTheme, expectPageScreenshot, waitForVisualStable } from '../helpers/visual'
import { ensureVisualUserSession, VISUAL_USER_ACCOUNT } from '../helpers/session'

/**
 * 核心页 `en-US` 自基线。
 *
 * 只覆盖未登录可复现的核心路径的浅 / 暗桌面：登录、注册、个人中心。
 * Admin 页面的数据随用例顺序变化，英文渲染由浏览器抽检覆盖，不进入像素基线。
 */

interface EnRoute {
    path: string
    slug: string
    /** 个人中心需要登录账号 */
    session?: 'user'
    readySelector: string
    readyText: string
}

const ROUTES: readonly EnRoute[] = [
    { path: '/en-US/login', slug: 'en-login', readySelector: '.auth-card', readyText: 'Sign in' },
    { path: '/en-US/register', slug: 'en-register', readySelector: '.auth-card', readyText: 'Create account' },
    {
        path: '/en-US/profile',
        slug: 'en-profile',
        session: 'user',
        readySelector: '.profile-card',
        readyText: VISUAL_USER_ACCOUNT.email,
    },
]

for (const theme of ['light', 'dark'] as const) {
    test.describe(`en-US ${theme} / desktop`, () => {
        test.use({ colorScheme: theme, viewport: { width: 1440, height: 900 } })

        for (const route of ROUTES) {
            test(`en-US ${route.slug} 默认态（${theme}）`, async ({ page }) => {
                if (route.session === 'user') {
                    await ensureVisualUserSession(page)
                }

                await applyTheme(page, theme)
                await page.goto(route.path, { waitUntil: 'domcontentloaded' })
                await expect(page.locator(route.readySelector)).toBeVisible()
                await waitForVisualStable(page)
                await expect(page.getByText(route.readyText).first()).toBeVisible()
                /* 语言可索引；个人中心属私有页，按既有口径保持 noindex */
                const robots = page.locator('meta[name="robots"]')
                if (route.path.endsWith('/profile')) {
                    await expect(robots).toHaveAttribute('content', /noindex/u)
                } else {
                    await expect(robots).toHaveCount(0)
                }
                if (theme === 'dark') {
                    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
                }

                await expectPageScreenshot(page, `${route.slug}-${theme}-desktop-default`)
            })
        }
    })
}
