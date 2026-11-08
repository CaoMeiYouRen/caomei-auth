import { type Page, expect, test } from '@playwright/test'
import { visualBaseURL } from './config'
import { applyTheme, expectPageScreenshot, waitForVisualStable, type VisualTheme } from './visual'

/**
 * 认证页视觉矩阵（P2/P3）。
 *
 * 同一份矩阵同时驱动参考态层（迁移前原貌）与自基线层（当前接受态），避免两份断言分叉。
 * 新增路由时在 `ROUTES` 登记，并补齐提交按钮 / 错误锚点 / 可选 Tab。
 */

interface VisualViewport {
    name: string
    width: number
    height: number
}

interface VisualRoute {
    /** 业务路径 */
    path: string
    /** 快照前缀，同时用于用例标题 */
    slug: string
    /** 是否为登录后页面（需要先建立会话） */
    auth?: boolean
    /** 提交按钮可见文案 */
    submitLabel: string
    /** 空表单提交后应出现的首条错误文案，用于确认校验已执行 */
    errorAnchor: string
    /** 额外覆盖的 Tab：[可见文案, 快照后缀] */
    tabs?: ReadonlyArray<readonly [string, string]>
}

const VIEWPORTS: readonly VisualViewport[] = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
]

const THEMES: readonly VisualTheme[] = ['light', 'dark']

const ROUTES: readonly VisualRoute[] = [
    {
        path: '/login',
        slug: 'login',
        submitLabel: '登录',
        errorAnchor: '请输入用户名',
        tabs: [['用户名', 'username'], ['邮箱', 'email'], ['手机号', 'phone']],
    },
    {
        path: '/register',
        slug: 'register',
        submitLabel: '注册',
        errorAnchor: '请输入有效的邮箱地址',
        tabs: [['手机号', 'phone']],
    },
    {
        path: '/forgot-password',
        slug: 'forgot-password',
        submitLabel: '重置密码',
        errorAnchor: '请输入邮箱',
        tabs: [['手机号', 'phone']],
    },
    {
        path: '/change-password',
        slug: 'change-password',
        auth: true,
        submitLabel: '修改密码',
        errorAnchor: '请输入当前密码',
    },
]

/** 视觉服务固定账号：空库每次重建，首个用例注册，后续用例登录。 */
const VISUAL_ACCOUNT = {
    email: 'visual-baseline@example.com',
    password: 'VisualBaseline123',
    name: 'Visual Baseline',
    username: 'visualbaseline',
}

/** 为登录后页面建立会话；注册与登录都是幂等的，日志不进入截图。 */
async function ensureSession(page: Page): Promise<void> {
    const signUp = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, { data: VISUAL_ACCOUNT })
    if (signUp.ok()) {
        return
    }
    const signIn = await page.request.post(`${visualBaseURL}/api/auth/sign-in/email`, {
        data: { email: VISUAL_ACCOUNT.email, password: VISUAL_ACCOUNT.password },
    })
    expect(signIn.ok(), '视觉账号登录失败').toBeTruthy()
}

/** 参考态采集守卫：迁移后的页面不应再用于刷新参考态。 */
async function assertReferenceSource(page: Page): Promise<void> {
    if (process.env.VISUAL_REFERENCE_CAPTURE !== '1') {
        return
    }
    const primeVueNodes = await page.locator('.p-button').count()
    expect(primeVueNodes, '参考态必须采自迁移前的 PrimeVue 页面').toBeGreaterThan(0)
}

async function open(page: Page, route: VisualRoute, theme: VisualTheme): Promise<void> {
    if (route.auth) {
        await ensureSession(page)
    }
    await applyTheme(page, theme)
    await page.goto(route.path, { waitUntil: 'domcontentloaded' })
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

/** 默认态：主题 × 视口 × 路由。 */
function defineDefaultStates(): void {
    for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
            test.describe(`${theme} / ${viewport.name}`, () => {
                test.use({ colorScheme: theme, viewport: { width: viewport.width, height: viewport.height } })

                for (const route of ROUTES) {
                    test(`${route.slug} 默认态（${theme} / ${viewport.name}）`, async ({ page }) => {
                        await open(page, route, theme)
                        await shot(page, `${route.slug}-${theme}-${viewport.name}-default`)
                    })
                }
            })
        }
    }
}

/** 交互态：仅浅色桌面，覆盖 Tab 切换与校验错误。 */
function defineInteractionStates(): void {
    test.describe('light / desktop 交互态', () => {
        test.use({ colorScheme: 'light', viewport: { width: 1440, height: 900 } })

        for (const route of ROUTES) {
            test(`${route.slug} 校验错误态`, async ({ page }) => {
                await open(page, route, 'light')
                await page.getByRole('button', { name: route.submitLabel, exact: true }).click()
                await expect(page.getByText(route.errorAnchor, { exact: true })).toBeVisible()
                await shot(page, `${route.slug}-light-desktop-error`)
            })

            for (const [label, slug] of route.tabs ?? []) {
                test(`${route.slug} ${label} Tab`, async ({ page }) => {
                    await open(page, route, 'light')
                    /* 不使用 exact：CaomeiButton 的图标参与可访问名（如「󰏲 手机号」），PrimeVue 侧为纯文本 */
                    await page.getByRole('button', { name: label }).click()
                    await shot(page, `${route.slug}-light-desktop-tab-${slug}`)
                })
            }
        }
    })
}

export function defineAuthVisualMatrix(): void {
    defineDefaultStates()
    defineInteractionStates()
}
