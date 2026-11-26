import { expect, test, type Locator } from '@playwright/test'
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
