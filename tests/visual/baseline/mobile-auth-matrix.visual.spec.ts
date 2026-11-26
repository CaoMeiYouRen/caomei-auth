import { expect, test } from '@playwright/test'
import { getLocaleDefinition } from '../../../i18n/config/locale-registry'
import { applyTheme, dynamicMask, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'

/**
 * 阶段 15 轻量移动端矩阵（360×640，5 语言 × 4 页 = 20 张）。
 *
 * 390 已有 zh-CN（auth.visual）与 ja / ko（localized-narrow）基线，这里补齐 360 这一档，
 * 覆盖登录 Tab、验证码行与 SSO 首屏的像素回归；新增 20 张对应当前阶段的矩阵上限。
 */
const LOCALES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'] as const

const PAGES = [
    { slug: 'login', path: '/login', readySelector: '#username' },
    { slug: 'register', path: '/register', readySelector: '#email' },
    { slug: 'forgot-password', path: '/forgot-password', readySelector: '#email' },
    { slug: 'sso-login', path: '/sso-login', readySelector: '.sso-login' },
] as const

function localizedPath(locale: (typeof LOCALES)[number], path: string): string {
    return locale === 'zh-CN' ? path : `/${locale}${path}`
}

test.describe('移动端 360 轻量矩阵', () => {
    test.use({ viewport: { width: 360, height: 640 }, colorScheme: 'light' })

    for (const locale of LOCALES) {
        for (const pageDefinition of PAGES) {
            test(`${locale} ${pageDefinition.slug}`, async ({ page }) => {
                await applyTheme(page, 'light')
                await page.goto(localizedPath(locale, pageDefinition.path), { waitUntil: 'domcontentloaded' })
                await expect(page.locator(pageDefinition.readySelector)).toBeVisible()
                await expect(page.locator('html')).toHaveAttribute('lang', locale)
                await waitForVisualStable(page)
                if (pageDefinition.slug === 'login') {
                    /* 社交按钮来自异步 providers 接口；负载下 networkidle 可能先于渲染完成，先等齐再截图 */
                    await expect(page.locator('.auth-card .social-btn')).toHaveCount(3)
                }
                if (getLocaleDefinition(locale)?.readiness === 'ui-ready') {
                    /* ui-ready 语言保持 noindex；readiness 回退时先红，不必等像素漂移 */
                    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)
                }

                await expectNoHorizontalOverflow(page, `${locale} ${pageDefinition.slug} 360 下出现横向溢出`)
                await expect(page).toHaveScreenshot(`auth-${pageDefinition.slug}-light-360-${locale}.png`, { mask: dynamicMask(page), fullPage: true })
            })
        }
    }
})
