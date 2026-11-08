import { type Page, expect, test } from '@playwright/test'
import { applyTheme, expectPageScreenshot, waitForVisualStable, type VisualTheme } from './visual'

/**
 * 认证页视觉矩阵（P2 `/login` + P3 `/register`）。
 *
 * 同一份矩阵同时用于参考态层（迁移前）与后续自基线层，避免两份断言分叉。
 * 新增路由时在 `ROUTES` 中登记，并在对应主题 / 视口下补交互态用例。
 */

interface VisualViewport {
    name: string
    width: number
    height: number
}

const VIEWPORTS: readonly VisualViewport[] = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
]

const THEMES: readonly VisualTheme[] = ['light', 'dark']

/** 参考态采集守卫：迁移后的页面不应再用于刷新参考态。 */
async function assertReferenceSource(page: Page): Promise<void> {
    if (process.env.VISUAL_REFERENCE_CAPTURE !== '1') {
        return
    }
    const primeVueNodes = await page.locator('.p-button').count()
    expect(primeVueNodes, '参考态必须采自迁移前的 PrimeVue 页面').toBeGreaterThan(0)
}

async function open(page: Page, path: string, theme: VisualTheme): Promise<void> {
    await applyTheme(page, theme)
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.auth-card')).toBeVisible()
    if (theme === 'dark') {
        await expect(page.locator('html')).toHaveClass(/dark/)
    } else {
        await expect(page.locator('html')).not.toHaveClass(/dark/)
    }
    await waitForVisualStable(page)
    await assertReferenceSource(page)
}

async function shot(page: Page, name: string): Promise<void> {
    await waitForVisualStable(page)
    await expectPageScreenshot(page, name)
}

/** 登录 / 注册页默认态：主题 × 视口。 */
function defineDefaultStates(): void {
    for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
            test.describe(`${theme} / ${viewport.name}`, () => {
                test.use({ colorScheme: theme, viewport: { width: viewport.width, height: viewport.height } })

                test(`login 默认态（${theme} / ${viewport.name}）`, async ({ page }) => {
                    await open(page, '/login', theme)
                    await shot(page, `login-${theme}-${viewport.name}-default`)
                })

                test(`register 默认态（${theme} / ${viewport.name}）`, async ({ page }) => {
                    await open(page, '/register', theme)
                    await shot(page, `register-${theme}-${viewport.name}-default`)
                })
            })
        }
    }
}

/** 交互态：仅浅色桌面，覆盖 Tab 切换与校验错误。 */
function defineInteractionStates(): void {
    test.describe('light / desktop 交互态', () => {
        test.use({ colorScheme: 'light', viewport: { width: 1440, height: 900 } })

        test('login 校验错误态', async ({ page }) => {
            await open(page, '/login', 'light')
            await page.getByRole('button', { name: '登录', exact: true }).click()
            await expect(page.getByText('请输入用户名')).toBeVisible()
            await shot(page, 'login-light-desktop-error')
        })

        for (const [tab, slug] of [['用户名', 'username'], ['邮箱', 'email'], ['手机号', 'phone']] as const) {
            test(`login ${tab} Tab`, async ({ page }) => {
                await open(page, '/login', 'light')
                /* 不使用 exact：CaomeiButton 的图标参与可访问名（如「󰏲 手机号」），PrimeVue 侧为纯文本 */
                await page.getByRole('button', { name: tab }).click()
                await shot(page, `login-light-desktop-tab-${slug}`)
            })
        }

        test('register 校验错误态', async ({ page }) => {
            await open(page, '/register', 'light')
            await page.getByRole('button', { name: '注册', exact: true }).click()
            await expect(page.getByText('请输入有效的邮箱地址')).toBeVisible()
            await shot(page, 'register-light-desktop-error')
        })

        test('register 手机号 Tab', async ({ page }) => {
            await open(page, '/register', 'light')
            await page.getByRole('button', { name: '手机号' }).click()
            await shot(page, 'register-light-desktop-tab-phone')
        })
    })
}

export function defineAuthVisualMatrix(): void {
    defineDefaultStates()
    defineInteractionStates()
}
