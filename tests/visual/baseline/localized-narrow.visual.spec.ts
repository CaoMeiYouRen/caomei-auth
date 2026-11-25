import { expect, test } from '@playwright/test'
import { applyTheme, dynamicMask, expectNoHorizontalOverflow, waitForVisualStable, type VisualTheme } from '../helpers/visual'

/**
 * ja-JP / ko-KR 窄屏基线（阶段 14 M3.1，2026-11-26 用户裁定 12 张）。
 *
 * 口径：2 语言 × register / forgot-password / sso-login × 2 视口；
 * 390×844 采浅色、768×1024 采暗色，共 12 张整页截图。
 * 每个视口不重复覆盖双主题（CI 预算取舍，见阶段 14 登记 D44）；页面级无横向溢出同时断言。
 */
interface NarrowRoute {
    code: 'ja-JP' | 'ko-KR'
    slug: string
    path: string
    readySelector: string
}

const ROUTES: readonly NarrowRoute[] = [
    { code: 'ja-JP', slug: 'ja-register', path: '/ja-JP/register', readySelector: '#email' },
    { code: 'ja-JP', slug: 'ja-forgot-password', path: '/ja-JP/forgot-password', readySelector: '#email' },
    { code: 'ja-JP', slug: 'ja-sso-login', path: '/ja-JP/sso-login', readySelector: '.sso-login' },
    { code: 'ko-KR', slug: 'ko-register', path: '/ko-KR/register', readySelector: '#email' },
    { code: 'ko-KR', slug: 'ko-forgot-password', path: '/ko-KR/forgot-password', readySelector: '#email' },
    { code: 'ko-KR', slug: 'ko-sso-login', path: '/ko-KR/sso-login', readySelector: '.sso-login' },
]

const VIEWPORTS: readonly { name: string, width: number, height: number, theme: VisualTheme }[] = [
    { name: 'mobile', width: 390, height: 844, theme: 'light' },
    { name: 'tablet', width: 768, height: 1024, theme: 'dark' },
]

for (const viewport of VIEWPORTS) {
    test.describe(`窄屏 ${viewport.name}（${viewport.theme}）`, () => {
        test.use({ colorScheme: viewport.theme, viewport: { width: viewport.width, height: viewport.height } })

        for (const route of ROUTES) {
            test(`${route.slug} 默认态（${viewport.theme} / ${viewport.name}）`, async ({ page }) => {
                await applyTheme(page, viewport.theme)
                await page.goto(route.path, { waitUntil: 'domcontentloaded' })
                await expect(page.locator(route.readySelector)).toBeVisible()
                await waitForVisualStable(page)

                await expect(page.locator('html')).toHaveAttribute('lang', route.code)
                /* ui-ready 语言保持 noindex；readiness 回退时先红，不必等像素漂移 */
                await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)
                if (viewport.theme === 'dark') {
                    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
                }

                await expectNoHorizontalOverflow(page, `${route.slug} 在 ${viewport.name} 下出现横向溢出`)
                await expect(page).toHaveScreenshot(`${route.slug}-${viewport.theme}-${viewport.name}-default.png`, {
                    mask: dynamicMask(page),
                    fullPage: true,
                })
            })
        }
    })
}
