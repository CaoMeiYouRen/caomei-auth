import { expect, test } from '@playwright/test'
import { applyTheme, expectPageScreenshot, waitForVisualStable } from '../helpers/visual'
import { ensureVisualUserSession, VISUAL_USER_ACCOUNT } from '../helpers/session'

/**
 * 新增语言（zh-TW / ja-JP / ko-KR）核心页自基线。
 *
 * 依据 [阶段 8 范围登记 §5.4](../../../docs/design/governance/2026-11-17-phase8-registration.md)：每语言只采登录 + 个人中心（浅 / 暗）4 张，3 语共 12 张，
 * 不扩全矩阵以控制 CI 时长。`ui-ready` 语言只保证可切换、可访问与不索引，
 * 文案质量留待母语审校后再升级 `seo-ready`。
 */

interface LocaleRoute {
    /** 语言码，用于 `lang` 断言 */
    code: string
    path: string
    slug: string
    readySelector: string
    readyText: string
    session?: 'user'
}

const ROUTES: readonly LocaleRoute[] = [
    { code: 'zh-TW', path: '/zh-TW/login', slug: 'tw-login', readySelector: '.auth-card', readyText: '歡迎回來' },
    {
        code: 'zh-TW',
        path: '/zh-TW/profile',
        slug: 'tw-profile',
        session: 'user',
        readySelector: '.profile-card',
        readyText: VISUAL_USER_ACCOUNT.email,
    },
    { code: 'ja-JP', path: '/ja-JP/login', slug: 'ja-login', readySelector: '.auth-card', readyText: 'おかえりなさい' },
    {
        code: 'ja-JP',
        path: '/ja-JP/profile',
        slug: 'ja-profile',
        session: 'user',
        readySelector: '.profile-card',
        readyText: VISUAL_USER_ACCOUNT.email,
    },
    { code: 'ko-KR', path: '/ko-KR/login', slug: 'ko-login', readySelector: '.auth-card', readyText: '다시 오신 것을 환영합니다' },
    {
        code: 'ko-KR',
        path: '/ko-KR/profile',
        slug: 'ko-profile',
        session: 'user',
        readySelector: '.profile-card',
        readyText: VISUAL_USER_ACCOUNT.email,
    },
]

for (const theme of ['light', 'dark'] as const) {
    test.describe(`新增语言 ${theme} / desktop`, () => {
        test.use({ colorScheme: theme, viewport: { width: 1440, height: 900 } })

        for (const route of ROUTES) {
            test(`${route.code} ${route.slug} 默认态（${theme}）`, async ({ page }) => {
                if (route.session === 'user') {
                    await ensureVisualUserSession(page)
                }

                await applyTheme(page, theme)
                await page.goto(route.path, { waitUntil: 'domcontentloaded' })
                await expect(page.locator(route.readySelector)).toBeVisible()
                await waitForVisualStable(page)

                /* 语言前缀与 html lang 必须一致，否则「可访问」只是路径可达而文案未切换 */
                await expect(page.locator('html')).toHaveAttribute('lang', route.code)
                await expect(page.getByText(route.readyText, { exact: true }).first()).toBeVisible()
                /* ui-ready 语言必须保持 noindex：readiness 回退时这条会先红，不必等视觉像素漂移 */
                await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)
                if (theme === 'dark') {
                    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
                }

                await expectPageScreenshot(page, `${route.slug}-${theme}-desktop-default`)
            })
        }
    })
}

test.describe('5 语切换', () => {
    test('切换器列出 5 个启用语言并可切到 한국어', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.auth-card')).toBeVisible()

        await page.locator('.language-switcher__trigger').click()
        const labels = await page.locator('.language-switcher__option-label').allTextContents()
        expect(labels).toEqual(['简体中文', 'English', '繁體中文', '日本語', '한국어'])

        await page.locator('.language-switcher__option', { hasText: '한국어' }).click()
        await page.waitForURL(/\/ko-KR\/login$/u)
        await expect(page.locator('html')).toHaveAttribute('lang', 'ko-KR')
    })
})
