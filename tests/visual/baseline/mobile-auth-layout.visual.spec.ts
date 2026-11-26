import { expect, test, type Locator, type Page } from '@playwright/test'
import { useAdminSession } from '../helpers/admin-session'
import { ensureVisualUserSession } from '../helpers/session'
import { applyTheme, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'

/**
 * 认证移动端布局断言。
 *
 * 与像素基线的分工：这里只断言可回归的几何关系（是否溢出、控件是否完整可见、是否互相遮挡），
 * 不产出截图；跨语言像素矩阵由后续轻量矩阵承担，避免同一缺陷维护两份像素基线。
 * 768×1024 只在几何断言内出现（该断点卡片容器比 390 更窄），不新增像素基线。
 */

/** 5 个启用语言；zh-CN 是默认语言，不带前缀 */
const LOCALES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'] as const

const VIEWPORTS = [
    { name: '390', width: 390, height: 844 },
    { name: '360', width: 360, height: 640 },
    { name: '768', width: 768, height: 1024 },
] as const

function localizedPath(locale: (typeof LOCALES)[number], path: string): string {
    return locale === 'zh-CN' ? path : `/${locale}${path}`
}

/** 断言元素完整落在容器内（允许 1px 的反锯齿误差） */
async function expectInside(container: Locator, child: Locator, message: string) {
    const containerBox = await container.boundingBox()
    const childBox = await child.boundingBox()
    expect(containerBox, `${message}：容器缺少边界框`).not.toBeNull()
    expect(childBox, `${message}：子元素缺少边界框`).not.toBeNull()
    expect(childBox!.x, `${message}：左缘越界`).toBeGreaterThanOrEqual(containerBox!.x - 1)
    expect(childBox!.x + childBox!.width, `${message}：右缘越界`).toBeLessThanOrEqual(containerBox!.x + containerBox!.width + 1)
}

/** 断言文本内容没有被裁切（换行后完整可见） */
async function expectContentNotClipped(button: Locator, message: string) {
    const clipped = await button.evaluate((element) => {
        const content = element.querySelector<HTMLElement>('.caomei-button__content')
        if (!content) {
            return null
        }
        return {
            horizontal: content.scrollWidth - content.clientWidth,
            vertical: content.scrollHeight - content.clientHeight,
        }
    })
    expect(clipped, `${message}：按钮缺少文本内容层`).not.toBeNull()
    expect(clipped!.horizontal, `${message}：按钮文案被横向截断`).toBeLessThanOrEqual(1)
    expect(clipped!.vertical, `${message}：按钮文案被纵向截断`).toBeLessThanOrEqual(1)
}

test.describe('验证码行窄屏不溢出', () => {
    for (const viewport of VIEWPORTS) {
        test.describe(`视口 ${viewport.name}`, () => {
            test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'light' })

            for (const locale of LOCALES) {
                test(`${locale} 输入可收缩且按钮不压缩`, async ({ page }) => {
                    await applyTheme(page, 'light')
                    await page.goto(localizedPath(locale, '/forgot-password'), { waitUntil: 'domcontentloaded' })
                    const card = page.locator('.auth-card').first()
                    await expect(card).toBeVisible()
                    await expect(page.locator('html')).toHaveAttribute('lang', locale)
                    await waitForVisualStable(page)

                    await expectNoHorizontalOverflow(page, `${locale} 找回密码页在 ${viewport.name} 下出现横向溢出`)

                    const row = card.locator('.code-row').first()
                    const input = row.locator('.caomei-input').first()
                    const button = row.locator('.caomei-button').first()
                    await expect(row).toBeVisible()
                    await expect(input).toBeVisible()
                    await expect(button).toBeVisible()

                    /* 契约：输入承担收缩（flex: 1 1 0 + min-width: 0），按钮不参与压缩 */
                    const inputStyle = await input.evaluate((element) => {
                        const style = getComputedStyle(element)
                        return { grow: style.flexGrow, shrink: style.flexShrink, basis: style.flexBasis, minWidth: style.minWidth }
                    })
                    expect(inputStyle.grow, `${locale} 输入未参与扩展`).toBe('1')
                    expect(inputStyle.shrink, `${locale} 输入未参与收缩`).toBe('1')
                    expect(Number.parseFloat(inputStyle.basis), `${locale} 输入 flex-basis 不为 0`).toBe(0)
                    expect(inputStyle.minWidth, `${locale} 输入未解除 min-width: auto`).toBe('0px')

                    const buttonShrink = await button.evaluate((element) => getComputedStyle(element).flexShrink)
                    expect(buttonShrink, `${locale} 按钮被压缩`).toBe('0')

                    await expectInside(row, input, `${locale} 输入越出验证码行`)
                    await expectInside(row, button, `${locale} 按钮越出验证码行`)
                    await expectInside(card, row, `${locale} 验证码行越出卡片`)
                })
            }
        })
    }
})

/** 两个矩形相交面积（px²），任一维度不相交即为 0 */
function intersectionArea(a: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>, b: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>): number {
    const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
    const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
    return width > 0 && height > 0 ? width * height : 0
}

/** 固定悬浮控件：主题切换恒在；反馈按钮仅在配置 feedbackUrl 的部署渲染 */
const FLOATING_CONTROLS = ['.theme-toggle', '.feedback-button'] as const

/** 反馈按钮未配置时的文档盒：右锚 16px、宽度上限 48px（实际宽约 46px） */
const FEEDBACK_RIGHT_INSET = 16
const FEEDBACK_MAX_WIDTH = 48

/** 认证页在 ≤768 下必须不被悬浮控件遮挡的可交互元素 */
const OVERLAY_GUARDS = [
    {
        path: '/login',
        name: '登录页',
        selector: '.auth-card .social-btn, .auth-card .agreement-link, .auth-card .toggle-link, .auth-card button.btn-primary',
        /* 内容右缘锚点：卡片的 padding 盒 */
        contentBox: '.auth-card',
        cardBox: null,
    },
    {
        path: '/register',
        name: '注册页',
        selector: '.auth-card #agreement, .auth-card .agreement-link, .auth-card button.btn-primary',
        contentBox: '.auth-card',
        cardBox: null,
    },
    {
        path: '/sso-login',
        name: 'SSO 页',
        selector: '.sso-button, .sso-login .login-link, .provider-card',
        contentBox: '.sso-login',
        /* 廊道收窄后内层卡片需仍在父容器内 */
        cardBox: { container: '.available-providers', item: '.provider-card' },
    },
] as const

async function expectNoOverlapWithFloating(page: Page, selector: string, context: string) {
    const controls = page.locator(selector)
    const total = await controls.count()
    expect(total, `${context}：未找到待保护控件`).toBeGreaterThan(0)
    for (let index = 0; index < total; index += 1) {
        const control = controls.nth(index)
        if (!(await control.isVisible())) {
            continue
        }
        const controlBox = await control.boundingBox()
        if (!controlBox) {
            continue
        }
        for (const floatingSelector of FLOATING_CONTROLS) {
            const floating = page.locator(floatingSelector).first()
            if ((await floating.count()) === 0 || !(await floating.isVisible())) {
                continue
            }
            const floatingBox = await floating.boundingBox()
            expect(floatingBox, `${context}：${floatingSelector} 缺少边界框`).not.toBeNull()
            expect(
                intersectionArea(controlBox, floatingBox!),
                `${context}：第 ${index + 1} 个控件与 ${floatingSelector} 重叠`,
            ).toBe(0)
        }
    }
}

/**
 * 右侧安全廊道：内容右缘必须早于固定按钮左缘。
 * 反馈按钮未配置时按文档盒（right 16 + 宽 48 上限）计算，保证该分支不依赖渲染配置。
 */
async function expectContentCorridor(page: Page, contentBox: string, context: string) {
    const corridor = await page.evaluate((selector) => {
        const element = document.querySelector<HTMLElement>(selector)
        if (!element) {
            return null
        }
        const style = getComputedStyle(element)
        const right = element.getBoundingClientRect().right - Number.parseFloat(style.paddingRight)
        return { right, viewportWidth: window.innerWidth }
    }, contentBox)
    expect(corridor, `${context}：${contentBox} 缺少边界框`).not.toBeNull()

    const themeBox = await page.locator('.theme-toggle').first().boundingBox()
    expect(themeBox, `${context}：.theme-toggle 缺少边界框`).not.toBeNull()
    /* 主题切换与反馈按钮同锚 right: 16px；反馈按钮宽约 46px，按 48px 上限推导 */
    const feedbackLeft = corridor!.viewportWidth - FEEDBACK_RIGHT_INSET - FEEDBACK_MAX_WIDTH
    expect(corridor!.right, `${context}：内容右缘越入固定按钮廊道（主题切换）`).toBeLessThanOrEqual(themeBox!.x - 8)
    expect(corridor!.right, `${context}：内容右缘越入固定按钮廊道（反馈按钮）`).toBeLessThanOrEqual(feedbackLeft - 8)
}

test.describe('认证页悬浮控件遮挡', () => {
    for (const viewport of VIEWPORTS) {
        test.describe(`视口 ${viewport.name}`, () => {
            test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'light' })

            for (const locale of LOCALES) {
                for (const guard of OVERLAY_GUARDS) {
                    test(`${locale} ${guard.name} 任意滚动位置均不被遮挡`, async ({ page }) => {
                        await applyTheme(page, 'light')
                        await page.goto(localizedPath(locale, guard.path), { waitUntil: 'domcontentloaded' })
                        await expect(page.locator('html')).toHaveAttribute('lang', locale)
                        await waitForVisualStable(page)
                        await expectNoHorizontalOverflow(page, `${locale} ${guard.name} 在 ${viewport.name} 下出现横向溢出`)
                        /* 主题切换是廊道契约的基准，缺失时断言必须失败而不是静默跳过 */
                        await expect(page.locator('.theme-toggle')).toHaveCount(1)

                        /* 右侧廊道与滚动位置无关（固定按钮占固定 x 带）；首屏取样即覆盖全部滚动位置 */
                        await expectContentCorridor(page, guard.contentBox, `${locale} ${guard.name}（首屏）`)
                        await expectNoOverlapWithFloating(page, guard.selector, `${locale} ${guard.name}（首屏）`)

                        if (guard.cardBox) {
                            const container = page.locator(guard.cardBox.container).first()
                            if (await container.isVisible()) {
                                const items = container.locator(guard.cardBox.item)
                                const total = await items.count()
                                expect(total, `${locale} ${guard.name}：无卡片可断言`).toBeGreaterThan(0)
                                for (let index = 0; index < total; index += 1) {
                                    await expectInside(container, items.nth(index), `${locale} ${guard.name} 第 ${index + 1} 张卡片越出容器`)
                                }
                            }
                        }
                    })
                }
            }
        })
    }
})

test.describe('SSO 首屏顶部安全区', () => {
    for (const viewport of VIEWPORTS) {
        test.describe(`视口 ${viewport.name}`, () => {
            test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'light' })

            for (const locale of LOCALES) {
                test(`${locale} 标题与语言切换器不重叠`, async ({ page }) => {
                    await applyTheme(page, 'light')
                    await page.goto(localizedPath(locale, '/sso-login'), { waitUntil: 'domcontentloaded' })
                    const title = page.locator('.sso-title').first()
                    const switcher = page.locator('.language-switcher__trigger').first()
                    await expect(title).toBeVisible()
                    await expect(switcher).toBeVisible()
                    await expect(page.locator('html')).toHaveAttribute('lang', locale)
                    await waitForVisualStable(page)

                    await expectNoHorizontalOverflow(page, `${locale} SSO 页在 ${viewport.name} 下出现横向溢出`)

                    const titleBox = await title.boundingBox()
                    const switcherBox = await switcher.boundingBox()
                    expect(titleBox, `${locale} SSO 标题缺少边界框`).not.toBeNull()
                    expect(switcherBox, `${locale} 语言切换器缺少边界框`).not.toBeNull()
                    /* 面积对齐验收口径；垂直关系锁设计意图。块级盒口径只在标题横向铺满容器的 ≤768 适用，桌面需改文字墨迹矩形 */
                    expect(intersectionArea(titleBox!, switcherBox!), `${locale} SSO 标题与语言切换器重叠`).toBe(0)
                    expect(titleBox!.y, `${locale} SSO 标题未让出顶部安全区`).toBeGreaterThanOrEqual(switcherBox!.y + switcherBox!.height)
                })
            }
        })
    }
})

test.describe('2FA 一次性验证码行窄屏不溢出', () => {
    test.use({ viewport: { width: 360, height: 640 }, colorScheme: 'light' })

    for (const locale of LOCALES) {
        test(`${locale} 自建 code-row 同样由全局收缩契约覆盖`, async ({ page }) => {
            await applyTheme(page, 'light')
            await page.goto(localizedPath(locale, '/login?twoFactor=1&channel=magic-link'), { waitUntil: 'domcontentloaded' })
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await dialog.getByRole('tab').nth(1).click()
            await waitForVisualStable(page)

            await expectNoHorizontalOverflow(page, `${locale} 2FA 弹窗在 360 下出现横向溢出`)

            const row = dialog.locator('.code-row').first()
            const input = row.locator('.caomei-input').first()
            const button = row.locator('.caomei-button').first()
            await expect(row).toBeVisible()
            await expect(button).toBeVisible()

            /* two-factor-dialog 自建 code-row，不经 BaseInputV2，只能由全局 .code-row 契约兜住 */
            const inputStyle = await input.evaluate((element) => {
                const style = getComputedStyle(element)
                return { basis: style.flexBasis, minWidth: style.minWidth }
            })
            expect(Number.parseFloat(inputStyle.basis), `${locale} 2FA 输入 flex-basis 不为 0`).toBe(0)
            expect(inputStyle.minWidth, `${locale} 2FA 输入未解除 min-width: auto`).toBe('0px')

            const boxes = await Promise.all([input.boundingBox(), button.boundingBox()])
            expect(boxes[0], `${locale} 2FA 输入缺少边界框`).not.toBeNull()
            expect(boxes[1], `${locale} 2FA 按钮缺少边界框`).not.toBeNull()
            expect(Math.abs(boxes[0]!.y - boxes[1]!.y), `${locale} 2FA 验证码行发生非预期换行`).toBeLessThanOrEqual(1)
            await expectInside(row, input, `${locale} 2FA 输入越出验证码行`)
            await expectInside(row, button, `${locale} 2FA 按钮越出验证码行`)
            await expectInside(dialog, row, `${locale} 2FA 验证码行越出弹窗`)
        })
    }
})

test.describe('登录方式 Tab 窄屏完整可见', () => {
    for (const viewport of VIEWPORTS) {
        test.describe(`视口 ${viewport.name}`, () => {
            test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'light' })

            for (const locale of LOCALES) {
                test(`${locale} 三个 Tab 均完整可见且无横向溢出`, async ({ page }) => {
                    await applyTheme(page, 'light')
                    await page.goto(localizedPath(locale, '/login'), { waitUntil: 'domcontentloaded' })
                    await expect(page.locator('.auth-card')).toBeVisible()
                    await expect(page.locator('html')).toHaveAttribute('lang', locale)
                    await waitForVisualStable(page)

                    await expectNoHorizontalOverflow(page, `${locale} 登录页在 ${viewport.name} 下出现横向溢出`)

                    const group = page.locator('.login-btn .caomei-button-group').first()
                    await expect(group).toBeVisible()
                    /* 修复目标不是「组内可滚动」：锁住组自身也不得横向裁切 */
                    const groupOverflow = await group.evaluate((element) => element.scrollWidth - element.clientWidth)
                    expect(groupOverflow, `${locale} Tab 组在 ${viewport.name} 下仍可横向滚动`).toBeLessThanOrEqual(1)

                    const buttons = group.locator('.caomei-button')
                    /* 用户名 / 邮箱 / 手机号：手机号 Tab 不得被隐藏或需要滑动才能发现 */
                    await expect(buttons).toHaveCount(3)

                    for (let index = 0; index < 3; index += 1) {
                        const button = buttons.nth(index)
                        await expect(button).toBeInViewport()
                        await expectInside(group, button, `${locale} 第 ${index + 1} 个 Tab 越出 Tab 组`)
                        await expectContentNotClipped(button, `${locale} 第 ${index + 1} 个 Tab`)
                    }

                    await expectInside(page.locator('.auth-card'), group, `${locale} Tab 组越出登录卡片`)
                })
            }
        })
    }
})

test.describe('个人中心操作行窄屏不溢出', () => {
    for (const viewport of VIEWPORTS) {
        test.describe(`视口 ${viewport.name}`, () => {
            test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'light' })

            for (const locale of LOCALES) {
                test(`${locale} 操作按钮换行且不越出卡片`, async ({ page }) => {
                    await ensureVisualUserSession(page)
                    await applyTheme(page, 'light')
                    await page.goto(localizedPath(locale, '/profile'), { waitUntil: 'domcontentloaded' })
                    const card = page.locator('.profile-card').first()
                    await expect(card).toBeVisible()
                    await expect(page.locator('html')).toHaveAttribute('lang', locale)
                    await waitForVisualStable(page)

                    await expectNoHorizontalOverflow(page, `${locale} 个人中心在 ${viewport.name} 下出现横向溢出`)

                    const actions = card.locator('.profile-actions').first()
                    await expect(actions).toBeVisible()
                    const buttons = actions.locator('.caomei-button')
                    const total = await buttons.count()
                    expect(total, `${locale} 个人中心操作按钮缺失`).toBeGreaterThanOrEqual(2)
                    for (let index = 0; index < total; index += 1) {
                        await expectInside(actions, buttons.nth(index), `${locale} 第 ${index + 1} 个操作按钮越出操作行`)
                        await expectInside(card, buttons.nth(index), `${locale} 第 ${index + 1} 个操作按钮越出卡片`)
                    }
                    await expectInside(card, actions, `${locale} 操作行越出卡片`)
                })
            }
        })
    }
})

test.describe('Admin 移动端侧栏默认收起', () => {
    const ADMIN_VIEWPORTS = [...VIEWPORTS, { name: '1440', width: 1440, height: 900 }] as const

    for (const viewport of ADMIN_VIEWPORTS) {
        test(`视口 ${viewport.name}`, async ({ page }) => {
            await useAdminSession(page)
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
            await applyTheme(page, 'light')
            await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
            const sidebar = page.locator('.admin-sidebar').first()
            await expect(sidebar).toBeVisible()
            await waitForVisualStable(page)

            if (viewport.width <= 768) {
                await expect(sidebar).toHaveClass(/collapsed/u)
            } else {
                await expect(sidebar).not.toHaveClass(/collapsed/u)
            }
        })
    }
})

test.describe('Admin 移动端输入字号与表格滚动', () => {
    const ADMIN_VIEWPORTS = [...VIEWPORTS, { name: '1440', width: 1440, height: 900 }] as const

    for (const viewport of ADMIN_VIEWPORTS) {
        test(`视口 ${viewport.name}`, async ({ page }) => {
            await useAdminSession(page)
            await page.setViewportSize({ width: viewport.width, height: viewport.height })
            await applyTheme(page, 'light')
            await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
            await expect(page.locator('.caomei-data-table')).toBeVisible()
            await waitForVisualStable(page)

            const searchInput = page.locator('.users-filters .caomei-input__control').first()
            await expect(searchInput).toBeVisible()
            const fontSize = await searchInput.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
            if (viewport.width <= 768) {
                expect(fontSize, `${viewport.name} 下搜索输入字号小于 16px`).toBeGreaterThanOrEqual(16)
            } else {
                expect(fontSize, `${viewport.name} 桌面输入字号应为 14px`).toBeCloseTo(14, 1)
            }

            /* 筛选 Select 走 --caomei-field-font-size token，需单独断言 */
            const filterSelect = page.locator('.users-filters .caomei-select').first()
            await expect(filterSelect).toBeVisible()
            const selectFontSize = await filterSelect.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
            if (viewport.width <= 768) {
                expect(selectFontSize, `${viewport.name} 下筛选控件字号小于 16px`).toBeGreaterThanOrEqual(16)
            } else {
                expect(selectFontSize, `${viewport.name} 桌面筛选字号应为 14px`).toBeCloseTo(14, 1)
            }

            /* 移动端表格保持容器内横向滚动，且不撑出页面 */
            const table = await page.locator('.caomei-data-table').first().evaluate((element) => ({
                overflowX: getComputedStyle(element).overflowX,
                scrollable: element.scrollWidth - element.clientWidth,
            }))
            expect(table.overflowX, `${viewport.name} 表格容器未启用横向滚动`).toBe('auto')
            if (viewport.width <= 768) {
                expect(table.scrollable, `${viewport.name} 表格未出现横向滚动区`).toBeGreaterThan(0)
            }
            await expectNoHorizontalOverflow(page, `${viewport.name} Admin 用户页出现页面级横向溢出`)
        })
    }
})

test.describe('OAuth 入口语言', () => {
    test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })

    for (const locale of LOCALES) {
        test(`${locale} 入口按 cookie 补语言前缀并保留 query`, async ({ page }) => {
            const query = 'client_id=visual-client&redirect_uri=http%3A%2F%2F127.0.0.1%3A3100%2Fcallback&response_type=code&state=visual'
            for (const entry of ['login', 'consent'] as const) {
                const response = await page.request.get(`/api/oauth-entry/${entry}?${query}`, {
                    headers: { cookie: `i18n_locale=${locale}` },
                    maxRedirects: 0,
                })
                expect(response.status(), `${locale} ${entry} 未返回重定向`).toBe(302)
                const location = response.headers().location
                expect(location, `${locale} ${entry} 缺少 Location`).toBeTruthy()
                const target = entry === 'login' ? '/login' : '/oauth/consent'
                const expectedPath = locale === 'zh-CN' ? target : `/${locale}${target}`
                /* 只看站内路径名，防止前缀同源硬编码；同时排除指回入口自身的重定向循环 */
                expect(new URL(location!, 'http://localhost').pathname, `${locale} ${entry} 路径错误：${location}`).toBe(expectedPath)
                expect(location, `${locale} ${entry} 指回入口自身`).not.toContain('/api/oauth-entry/')
                expect(location).toContain('client_id=visual-client')
                expect(location).toContain('state=visual')
                expect(location).toContain('redirect_uri=')
            }
        })
    }
})
