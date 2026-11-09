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

interface VisualState {
    /** 用例标题与快照后缀 */
    label: string
    slug: string
    action: (page: Page) => Promise<void>
}

interface VisualRoute {
    /** 业务路径 */
    path: string
    /** 快照前缀，同时用于用例标题 */
    slug: string
    /** 是否为登录后页面（需要先建立会话） */
    auth?: boolean
    /** 为每次用例创建独立账号，避免同一账号的会话在用例间累积 */
    isolatedAccount?: boolean
    /** 异步加载页面：等待该文案出现后再截图 */
    readyText?: string
    /** 提交按钮可见文案；缺省则不跑校验错误态 */
    submitLabel?: string
    /** 空表单提交后应出现的首条错误文案；缺省则不跑校验错误态 */
    errorAnchor?: string
    /** 额外覆盖的 Tab：[可见文案, 快照后缀] */
    tabs?: ReadonlyArray<readonly [string, string]>
    /** 额外交互态 */
    states?: readonly VisualState[]
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
    {
        path: '/quick-login',
        slug: 'quick-login',
        submitLabel: '邮箱快速登录',
        errorAnchor: '请输入邮箱',
        tabs: [['短信验证码', 'phone']],
    },
    {
        path: '/security',
        slug: 'security',
        auth: true,
        isolatedAccount: true,
        readyText: '当前会话',
        states: [
            {
                label: '启用 2FA 对话框',
                slug: 'enable-2fa-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: '启用双因素认证' }).click()
                },
            },
            {
                label: '撤销所有会话确认',
                slug: 'revoke-all-confirm',
                action: async (page) => {
                    await page.getByRole('button', { name: '撤销所有会话' }).click()
                },
            },
        ],
    },
    {
        path: '/profile',
        slug: 'profile',
        auth: true,
        readyText: 'visual-baseline@example.com',
        states: [
            {
                label: '隐私模式',
                slug: 'privacy',
                action: async (page) => {
                    await page.getByRole('button', { name: '显示详情' }).click()
                },
            },
        ],
    },
]

/** 视觉服务固定账号：空库每次重建，首个用例注册，后续用例登录。 */
const VISUAL_ACCOUNT = {
    email: 'visual-baseline@example.com',
    password: 'VisualBaseline123',
    name: 'Visual Baseline',
    username: 'visualbaseline',
}

let isolatedAccountSeq = 0

/** 为登录后页面建立会话；注册与登录都是幂等的，日志不进入截图。 */
async function ensureSession(page: Page, route: VisualRoute): Promise<void> {
    if (route.isolatedAccount) {
        /* 会话类页面按用例建号：同一账号反复登录会让会话表行数随用例顺序增长 */
        isolatedAccountSeq += 1
        const account = {
            email: `visual-security-${isolatedAccountSeq}@example.com`,
            password: VISUAL_ACCOUNT.password,
            name: `Visual Security ${isolatedAccountSeq}`,
            username: `visualsecurity${isolatedAccountSeq}`,
        }
        const created = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, { data: account })
        expect(created.ok(), '视觉隔离账号注册失败').toBeTruthy()
        return
    }
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
        await ensureSession(page, route)
    }
    await applyTheme(page, theme)
    await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.auth-card')).toBeVisible()
    /* 先等网络空闲（完成 hydration），再断言主题；重页面在负载下可能超过默认 5s */
    await waitForVisualStable(page)
    if (route.readyText) {
        await expect(page.getByText(route.readyText)).toBeVisible()
    }
    if (theme === 'dark') {
        await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
    } else {
        await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 15000 })
    }
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
            if (route.submitLabel && route.errorAnchor) {
                const submitLabel = route.submitLabel
                const errorAnchor = route.errorAnchor
                test(`${route.slug} 校验错误态`, async ({ page }) => {
                    await open(page, route, 'light')
                    await page.getByRole('button', { name: submitLabel, exact: true }).click()
                    await expect(page.getByText(errorAnchor, { exact: true })).toBeVisible()
                    await shot(page, `${route.slug}-light-desktop-error`)
                })
            }

            for (const [label, slug] of route.tabs ?? []) {
                test(`${route.slug} ${label} Tab`, async ({ page }) => {
                    await open(page, route, 'light')
                    /* 不使用 exact：CaomeiButton 的图标参与可访问名（如「󰏲 手机号」），PrimeVue 侧为纯文本 */
                    await page.getByRole('button', { name: label }).click()
                    await shot(page, `${route.slug}-light-desktop-tab-${slug}`)
                })
            }

            for (const state of route.states ?? []) {
                test(`${route.slug} ${state.label}`, async ({ page }) => {
                    await open(page, route, 'light')
                    await state.action(page)
                    await shot(page, `${route.slug}-light-desktop-${state.slug}`)
                })
            }
        }
    })
}

export function defineAuthVisualMatrix(): void {
    defineDefaultStates()
    defineInteractionStates()
}
