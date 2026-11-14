import { type Page, expect, test } from '@playwright/test'
import { useAdminSession } from './admin-session'
import { visualFixedNow } from './config'
import { applyTheme, expectPageScreenshot, waitForVisualStable, type VisualTheme } from './visual'

/**
 * Admin 数据页视觉矩阵（P4）。
 *
 * 同一份矩阵同时驱动参考态层（迁移前 PrimeVue 原貌）与自基线层（当前接受态）。
 * 数据由 `scripts/testing/visual-fixtures.mjs` 固定，时钟由 `server/plugins/visual-clock.ts`
 * 固定在 `VISUAL_FIXED_NOW`，因此时间、相对时间与趋势图不随运行日期漂移。
 *
 * 新增页面 / 弹窗时在 `ROUTES` 或 `states` 登记，并同步 `reference-manifest.json`。
 * 依据：docs/design/governance/2026-11-10-p4-admin-migration-plan.md §3.5。
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

interface AdminRoute {
    /** 业务路径 */
    path: string
    /** 快照前缀，同时用于用例标题 */
    slug: string
    /** 是否需要管理员会话；首页 / 错误页也注入会话，避免全局守卫先跳到登录页 */
    auth?: boolean
    /** 页面就绪选择器 */
    readySelector: string
    /** 异步加载页面：等待该文案出现后再截图 */
    readyText?: string
    /** 需要采集的主题，缺省为浅色 + 暗色；错误页不接入主题插件，只采浅色 */
    themes?: readonly VisualTheme[]
    /** 额外交互态（仅浅色桌面） */
    states?: readonly VisualState[]
}

const VIEWPORTS: readonly VisualViewport[] = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
]

const THEMES: readonly VisualTheme[] = ['light', 'dark']

/** 等待指定标题的对话框可见。 */
async function expectDialog(page: Page, title: string): Promise<void> {
    const dialog = page.getByRole('dialog').filter({ hasText: title })
    await expect(dialog.first()).toBeVisible()
}

/** 按行内文本定位表格行。 */
function tableRow(page: Page, text: string) {
    return page.locator('tbody tr').filter({ hasText: text })
}

const ROUTES: readonly AdminRoute[] = [
    {
        path: '/admin/users',
        slug: 'admin-users',
        auth: true,
        readySelector: '.admin-users',
        readyText: '用户管理',
        states: [
            {
                label: '选择用户行',
                slug: 'selection',
                action: async (page) => {
                    /* CaomeiDataTable 的选择列是 role="checkbox" 的按钮，不是原生 input */
                    await page.locator('tbody tr').first().getByRole('checkbox').click()
                    await expect(page.getByRole('checkbox', { name: '选择该行' }).first()).toBeChecked()
                    await expect(page.getByRole('button', { name: '批量操作' })).toBeVisible()
                },
            },
            {
                label: '创建用户对话框',
                slug: 'create-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: '创建用户' }).click()
                    await expectDialog(page, '创建用户')
                },
            },
            {
                label: '用户详情对话框',
                slug: 'detail-dialog',
                action: async (page) => {
                    await tableRow(page, 'wang.qiang@example.com').getByRole('button', { name: '编辑详情' }).click()
                    await expectDialog(page, '用户详情')
                },
            },
            {
                label: '禁用用户对话框',
                slug: 'ban-dialog',
                action: async (page) => {
                    await tableRow(page, 'wang.qiang@example.com').getByRole('button', { name: '禁用用户' }).click()
                    await expectDialog(page, '禁用用户')
                },
            },
            {
                label: '用户会话对话框',
                slug: 'sessions-dialog',
                action: async (page) => {
                    await tableRow(page, 'wang.qiang@example.com').getByRole('button', { name: '会话管理' }).click()
                    await expectDialog(page, '用户会话')
                },
            },
        ],
    },
    {
        path: '/admin/oauth/applications',
        slug: 'admin-applications',
        auth: true,
        readySelector: '.admin-clients',
        readyText: '应用管理',
        states: [
            {
                label: '创建应用对话框',
                slug: 'create-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: '创建应用' }).click()
                    await expectDialog(page, '创建新应用')
                },
            },
            {
                label: 'API 文档对话框',
                slug: 'api-docs-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: 'API 文档' }).click()
                    await expectDialog(page, 'OIDC API 端点文档')
                },
            },
        ],
    },
    {
        path: '/admin/sso/providers',
        slug: 'admin-sso',
        auth: true,
        readySelector: '.admin-sso',
        readyText: 'SSO 提供商管理',
        states: [
            {
                label: '创建提供商（OIDC）对话框',
                slug: 'create-oidc-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: '创建提供商' }).click()
                    await expectDialog(page, '添加 SSO 提供商')
                },
            },
            {
                label: '创建提供商（SAML）对话框',
                slug: 'create-saml-dialog',
                action: async (page) => {
                    await page.getByRole('button', { name: '创建提供商' }).click()
                    await expectDialog(page, '添加 SSO 提供商')
                    /* 视觉层用 page.clock.setFixedTime 冻结 Date.now()，Vue 的 `_vts` 守卫会丢弃
                     * 对话框内 Select 的 pointerdown（真实时钟下正常，见 docs/plan/backlog.md）。
                     * Enter 路径没有前置 keydown 监听，不会命中同一守卫，因此交互态统一用键盘打开下拉再点选项。 */
                    const typeSelect = page.getByRole('dialog').getByRole('combobox', { name: '协议类型' })
                    await typeSelect.focus()
                    await typeSelect.press('Enter')
                    await expect(page.getByRole('listbox')).toBeVisible()
                    await page.getByRole('option', { name: 'SAML 2.0' }).click()
                    await expect(page.getByText('SAML 配置', { exact: true })).toBeVisible()
                },
            },
            {
                label: '提供商详情对话框',
                slug: 'detail-dialog',
                action: async (page) => {
                    await tableRow(page, '企业办公系统').locator('button').nth(0).click()
                    await expectDialog(page, 'SSO 提供商详情')
                },
            },
        ],
    },
    {
        path: '/admin/logs',
        slug: 'admin-logs',
        auth: true,
        readySelector: '.admin-logs',
        readyText: '登录统计',
        states: [
            {
                label: '会话状态筛选',
                slug: 'status-filter',
                action: async (page) => {
                    await page.locator('.detail-filters').getByRole('combobox', { name: '会话状态' }).click()
                    await page.getByRole('option', { name: '已过期' }).click()
                    /* 等筛选结果落表，避免截到「加载中」空表 */
                    await expect(page.locator('.logs-detail tbody tr').first()).toContainText('已过期')
                    /* 显式滚到日志区：筛选状态要展示筛选结果，而不是页头统计卡 */
                    await page.locator('.logs-detail').scrollIntoViewIfNeeded()
                },
            },
            {
                label: '日期范围选择',
                slug: 'date-range',
                action: async (page) => {
                    await page.getByRole('button', { name: '选择日期范围' }).click()
                    await expect(page.locator('.caomei-date-picker__content')).toBeVisible()
                    /* 日历浮层跟随输入框；显式滚到可见区域，避免截图只截到页头 */
                    await page.getByRole('button', { name: '选择日期范围' }).scrollIntoViewIfNeeded()
                },
            },
        ],
    },
    {
        path: '/oauth/clients',
        slug: 'oauth-clients',
        auth: true,
        readySelector: '.oauth-clients-page',
        readyText: '已授权应用',
    },
    {
        path: '/',
        slug: 'home',
        auth: true,
        readySelector: '.auth-container',
        readyText: '页面入口',
    },
    {
        path: '/visual-not-found',
        slug: 'error',
        auth: true,
        readySelector: '.error-card',
        readyText: '页面未找到 (404)',
        /* 错误页是 Nuxt 独立错误实例，未接入主题插件（html 不挂 dark），只采浅色 */
        themes: ['light'],
    },
]

/** 参考态采集守卫：迁移后的页面不应再用于刷新参考态。 */
async function assertReferenceSource(page: Page, route: AdminRoute): Promise<void> {
    if (process.env.VISUAL_REFERENCE_CAPTURE !== '1') {
        return
    }
    const primeVueNodes = await page.locator('.p-button').count()
    expect(primeVueNodes, `参考态必须采自迁移前的 PrimeVue 页面：${route.path}`).toBeGreaterThan(0)
}

async function open(page: Page, route: AdminRoute, theme: VisualTheme): Promise<void> {
    if (route.auth) {
        await useAdminSession(page)
    }
    await applyTheme(page, theme)
    /* 客户端时钟同样固定在锚点：DatePicker 当前月、客户端相对时间不随真实日期漂移；
     * setFixedTime 只替换 Date，不暂停定时器，debounce / 渲染仍正常。 */
    await page.clock.setFixedTime(new Date(visualFixedNow))
    await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(route.readySelector)).toBeVisible()
    /* 先等网络空闲（完成 hydration），再断言主题；Admin 页面在负载下可能超过默认 5s */
    await waitForVisualStable(page)
    if (route.readyText) {
        await expect(page.getByText(route.readyText).first()).toBeVisible()
    }
    if (theme === 'dark') {
        await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
    } else {
        await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 15000 })
    }
    await assertReferenceSource(page, route)
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
                    if (!(route.themes ?? THEMES).includes(theme)) {
                        continue
                    }
                    test(`${route.slug} 默认态（${theme} / ${viewport.name}）`, async ({ page }) => {
                        await open(page, route, theme)
                        await shot(page, `${route.slug}-${theme}-${viewport.name}-default`)
                    })
                }
            })
        }
    }
}

/** 交互态：仅浅色桌面，覆盖选择、弹窗与筛选。 */
function defineInteractionStates(): void {
    test.describe('light / desktop 交互态', () => {
        test.use({ colorScheme: 'light', viewport: { width: 1440, height: 900 } })

        for (const route of ROUTES) {
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

export function defineAdminVisualMatrix(): void {
    defineDefaultStates()
    defineInteractionStates()
}
