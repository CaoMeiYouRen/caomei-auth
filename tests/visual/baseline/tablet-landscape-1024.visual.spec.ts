import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { useAdminSession } from '../helpers/admin-session'
import { visualBaseURL, visualFixedNow, visualSessionHeaders } from '../helpers/config'
import { VISUAL_USER_ACCOUNT } from '../helpers/session'
import { applyTheme, dynamicMask, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'

/**
 * 阶段 16 M2：1024×768 横向平板基线（只采浅色 4 张）。
 *
 * 为什么单独一层：既有平板基线是 768×1024 竖屏，1024 横屏落在登录 Tab 与右侧廊道的
 * ≤1024 断点边界内，却没有像素保护。按 D53 只覆盖 login / register / security / admin-users，
 * 不采双主题、不扩到全站，控制视觉 CI 时长。
 */

const VIEWPORT = { width: 1024, height: 768 } as const

/** 会话类页面按用例建独立账号，避免共享账号的会话行数累积导致像素漂移 */
async function signUpIsolatedAccount(page: Page): Promise<void> {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 20)
    const account = {
        email: `visual-1024-${suffix}@example.com`,
        password: VISUAL_USER_ACCOUNT.password,
        name: `Visual 1024 ${suffix.slice(0, 8)}`,
        username: `vt${suffix}`,
    }
    const created = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, {
        data: account,
        headers: visualSessionHeaders,
    })
    expect(created.ok(), `1024 基线隔离账号注册失败（${created.status()}）`).toBeTruthy()
}

test.describe('1024 横向平板基线', () => {
    test.use({ viewport: VIEWPORT, colorScheme: 'light' })

    test('login 默认态', async ({ page }) => {
        await applyTheme(page, 'light')
        await page.goto('/login', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('#username')).toBeVisible()
        /* 社交按钮来自异步 providers 接口；负载下 networkidle 可能先于渲染完成，先等齐再截图 */
        await expect(page.locator('.auth-card .social-btn')).toHaveCount(3)
        await waitForVisualStable(page)

        await expectNoHorizontalOverflow(page, '1024 登录页出现横向溢出')
        await expect(page).toHaveScreenshot('tablet-1024-login-light.png', { mask: dynamicMask(page) })
    })

    test('register 默认态', async ({ page }) => {
        await applyTheme(page, 'light')
        await page.goto('/register', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('#email')).toBeVisible()
        await waitForVisualStable(page)

        await expectNoHorizontalOverflow(page, '1024 注册页出现横向溢出')
        await expect(page).toHaveScreenshot('tablet-1024-register-light.png', { mask: dynamicMask(page) })
    })

    test('security 默认态（表格分支）', async ({ page }) => {
        await signUpIsolatedAccount(page)
        await applyTheme(page, 'light')
        await page.goto('/security', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.security-device-list .device-list-row').first()).toBeVisible()
        await waitForVisualStable(page)

        /* 1024 位于卡片 / 表格断点之上，基线必须锁住表格分支 */
        await expect(page.locator('.security-device-list .device-list-header')).toBeVisible()
        await expectNoHorizontalOverflow(page, '1024 安全页出现横向溢出')
        await expect(page).toHaveScreenshot('tablet-1024-security-light.png', { mask: dynamicMask(page) })
    })

    test('admin-users 默认态', async ({ page }) => {
        await useAdminSession(page)
        await applyTheme(page, 'light')
        /* 与 admin 矩阵同源固定时钟：日期 / 相对时间 / 趋势图不随真实时间漂移 */
        await page.clock.setFixedTime(new Date(visualFixedNow))
        /* 本用例在整套视觉用例中靠后执行，库里已有其它用例创建的随机账号（时间戳为真实时间）。
         * 用既有深链 `?userId=` 固定到夹具账号（王强），让表格收敛到确定性行。 */
        await page.goto('/admin/users?userId=visual-user-03', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.admin-users')).toBeVisible()
        await waitForVisualStable(page)
        const rows = page.locator('.caomei-data-table tbody tr')
        await expect(rows).toHaveCount(1, { timeout: 15000 })
        await expect(rows.first()).toContainText('wang.qiang@example.com')
        await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 15000 })

        await expectNoHorizontalOverflow(page, '1024 Admin 用户页出现横向溢出')
        await expect(page).toHaveScreenshot('tablet-1024-admin-users-light.png', { mask: dynamicMask(page) })
    })
})
