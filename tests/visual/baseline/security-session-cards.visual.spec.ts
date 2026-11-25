import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { applyTheme, dynamicMask, expectNoHorizontalOverflow, waitForVisualStable, type VisualTheme } from '../helpers/visual'
import { visualBaseURL, visualSessionHeaders } from '../helpers/config'
import { VISUAL_USER_ACCOUNT } from '../helpers/session'

/**
 * 安全页会话表移动端卡片基线。
 *
 * 默认态基线是 390×844 视口截图，会话表在首屏之外，无法证明卡片布局；
 * 这里用隔离账号保证有 1 条会话，并截取 `.security-device-list` 元素（浅 / 暗各 1 张）。
 * token / IP / 时间由 `data-visual-mask` 掩码，避免随运行时间漂移。
 * 768 / 769 只做无截图断言，守住卡片与表格的分支边界。
 */
const THEMES: readonly VisualTheme[] = ['light', 'dark']

const COLUMN_LABELS = ['会话令牌', '浏览器', '操作系统', 'IP 地址', '创建时间', '过期时间']

async function signUpIsolatedAccount(page: Page): Promise<void> {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 20)
    const account = {
        email: `visual-security-${suffix}@example.com`,
        password: VISUAL_USER_ACCOUNT.password,
        name: `Visual Security ${suffix.slice(0, 8)}`,
        username: `vs${suffix}`,
    }
    const created = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, {
        data: account,
        headers: visualSessionHeaders,
    })
    expect(created.ok(), `视觉隔离账号注册失败（${created.status()}）`).toBeTruthy()
}

async function openSecurity(page: Page, theme: VisualTheme): Promise<void> {
    await signUpIsolatedAccount(page)
    await applyTheme(page, theme)
    await page.goto('/security', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.security-device-list .device-list-row').first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await waitForVisualStable(page)
    if (theme === 'dark') {
        await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15000 })
    }
}

for (const theme of THEMES) {
    test(`会话表移动端卡片（${theme}）`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await openSecurity(page, theme)

        const list = page.locator('.security-device-list')
        const row = list.locator('.device-list-row').first()
        await expect(list.locator('.device-list-header')).toHaveCSS('display', 'none')
        await expect(row).toHaveCSS('display', 'grid')

        /* 掩码会遮住 label 像素，这里直接断言生成内容，确保 6 个字段名都渲染 */
        const labels = await row.locator('span[data-label]').evaluateAll((spans) => spans.map((span) => getComputedStyle(span, '::before').content.replaceAll('"', '')))
        expect(labels).toEqual(COLUMN_LABELS)
        await expect(row.getByRole('button', { name: /撤销会话/u })).toBeVisible()

        await expectNoHorizontalOverflow(page, '390 移动端安全页出现横向溢出')

        await expect(list).toHaveScreenshot(`security-session-cards-${theme}-mobile.png`, { mask: dynamicMask(page) })
    })
}

test('会话表 768 仍为卡片且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await openSecurity(page, 'light')

    const list = page.locator('.security-device-list')
    await expect(list.locator('.device-list-header')).toHaveCSS('display', 'none')
    await expect(list.locator('.device-list-row').first()).toHaveCSS('display', 'grid')
    await expectNoHorizontalOverflow(page, '768 下安全页出现横向溢出')
})

test('会话表 769 回到表格且无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 769, height: 1024 })
    await openSecurity(page, 'light')

    const list = page.locator('.security-device-list')
    await expect(list.locator('.device-list-header')).toBeVisible()
    await expect(list.locator('.device-list-row').first()).not.toHaveCSS('display', 'grid')
    await expectNoHorizontalOverflow(page, '769 下安全页出现横向溢出')
})
