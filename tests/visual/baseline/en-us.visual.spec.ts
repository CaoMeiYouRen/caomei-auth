import { expect, test } from '@playwright/test'
import { useAdminSession } from '../helpers/admin-session'
import { visualBaseURL, visualSessionHeaders } from '../helpers/config'
import { applyTheme, expectPageScreenshot, waitForVisualStable } from '../helpers/visual'

/**
 * 核心页 `en-US` 自基线（阶段 5 M17）。
 *
 * 只覆盖核心路径的浅 / 暗桌面：登录、注册、个人中心、Admin 用户 / 日志 / SSO。
 * 其余页面的英文渲染由批次内的浅 / 暗 + 双语言浏览器抽检覆盖，不在视觉矩阵里翻倍。
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
    /** 会话类型：管理员用预置会话，普通页签用注册账号 */
    session?: 'admin' | 'user'
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
    {
        path: '/en-US/admin/users',
        slug: 'en-admin-users',
        session: 'admin',
        readySelector: '.admin-users',
        readyText: 'User management',
    },
    {
        path: '/en-US/admin/logs',
        slug: 'en-admin-logs',
        session: 'admin',
        readySelector: '.admin-logs',
        readyText: 'Login statistics',
    },
    {
        path: '/en-US/admin/sso/providers',
        slug: 'en-admin-sso',
        session: 'admin',
        readySelector: '.admin-sso',
        readyText: 'SSO Providers',
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
                if (route.session === 'admin') {
                    await useAdminSession(page)
                } else if (route.session === 'user') {
                    await ensureUserSession(page)
                }

                await applyTheme(page, theme)
                await page.goto(route.path, { waitUntil: 'domcontentloaded' })
                await expect(page.locator(route.readySelector)).toBeVisible()
                await waitForVisualStable(page)
                await expect(page.getByText(route.readyText).first()).toBeVisible()
                /* Admin 数据页的 SSR 首帧没有会话会 401，客户端 hydration 后才拉到数据；
                 * 等首行出现再截图，避免空表 / 有数据两种状态随机进入基线。 */
                if (route.session === 'admin') {
                    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 })
                }

                if (theme === 'dark') {
                    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
                }

                /* Admin 表格数据随用例顺序变化（认证用例会新建账号 / 会话），整表掩码保证基线稳定 */
                const masks = route.session === 'admin' ? [page.locator('tbody')] : []
                await expectPageScreenshot(page, `${route.slug}-${theme}-desktop-default`, masks)
            })
        }
    })
}
