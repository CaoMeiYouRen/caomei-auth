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
