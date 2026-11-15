import { expect, test } from '@playwright/test'
import { visualBaseURL, visualSessionHeaders } from '../helpers/config'
import { applyTheme, expectPageScreenshot, waitForVisualStable } from '../helpers/visual'

/**
 * 核心页 `en-US` 自基线。
 *
 * 只覆盖未登录可复现的核心路径的浅 / 暗桌面：登录、注册、个人中心。
 * Admin 页面的数据随用例顺序变化，英文渲染由浏览器抽检覆盖，不进入像素基线。
 */

const VISUAL_ACCOUNT = {
    email: 'visual-baseline@example.com',
    password: 'VisualBaseline123',
    name: 'Visual Baseline',
    username: 'visualbaseline',
}

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
        readyText: 'visual-baseline@example.com',
    },
]

/** 普通账号会话：注册幂等，已存在时登录。 */
async function ensureUserSession(page: import('@playwright/test').Page): Promise<void> {
    const signUp = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, {
        data: VISUAL_ACCOUNT,
        headers: visualSessionHeaders,
    })
    if (signUp.ok()) {
        return
    }
    const signIn = await page.request.post(`${visualBaseURL}/api/auth/sign-in/email`, {
        data: { email: VISUAL_ACCOUNT.email, password: VISUAL_ACCOUNT.password },
        headers: visualSessionHeaders,
    })
    expect(signIn.ok(), '视觉账号登录失败').toBeTruthy()
}

for (const theme of ['light', 'dark'] as const) {
    test.describe(`en-US ${theme} / desktop`, () => {
        test.use({ colorScheme: theme, viewport: { width: 1440, height: 900 } })

        for (const route of ROUTES) {
            test(`en-US ${route.slug} 默认态（${theme}）`, async ({ page }) => {
                if (route.session === 'user') {
                    await ensureUserSession(page)
                }

                await applyTheme(page, theme)
                await page.goto(route.path, { waitUntil: 'domcontentloaded' })
                await expect(page.locator(route.readySelector)).toBeVisible()
                await waitForVisualStable(page)
                await expect(page.getByText(route.readyText).first()).toBeVisible()
                if (theme === 'dark') {
                    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
                }

                await expectPageScreenshot(page, `${route.slug}-${theme}-desktop-default`)
            })
        }
    })
}
