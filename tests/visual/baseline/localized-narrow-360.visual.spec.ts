import { expect, test, type Page } from '@playwright/test'
import { applyTheme, expectNoHorizontalOverflow, waitForVisualStable } from '../helpers/visual'

/**
 * 长语言窄容器用例（阶段 14 M3.2）。
 *
 * ja / ko 在 360×640 下检查 register 与 sso-login：页面无横向溢出，提交按钮不越出卡片。
 * 若断言失败再评估是否恢复 `white-space: normal`；当前结论写入阶段 14 收口记录。
 */
const LOCALES = ['ja-JP', 'ko-KR'] as const

async function expectButtonInsideCard(page: Page, cardSelector: string, buttonSelector: string) {
    const card = page.locator(cardSelector).first()
    const submit = card.locator(buttonSelector).first()
    await expect(submit).toBeVisible()

    const cardBox = await card.boundingBox()
    const buttonBox = await submit.boundingBox()
    expect(cardBox, `${cardSelector} 缺少边界框`).not.toBeNull()
    expect(buttonBox, `${cardSelector} 提交按钮缺少边界框`).not.toBeNull()
    expect(buttonBox!.x).toBeGreaterThanOrEqual(cardBox!.x - 1)
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1)
}

test.describe('长语言窄容器', () => {
    test.use({ viewport: { width: 360, height: 640 }, colorScheme: 'light' })

    test('register 360 下无横向溢出', async ({ page }) => {
        for (const locale of LOCALES) {
            await applyTheme(page, 'light')
            await page.goto(`/${locale}/register`, { waitUntil: 'domcontentloaded' })
            await expect(page.locator('#email')).toBeVisible()
            await expect(page.locator('html')).toHaveAttribute('lang', locale)
            await waitForVisualStable(page)

            await expectNoHorizontalOverflow(page, `${locale} register 在 360 下出现横向溢出`)
            await expectButtonInsideCard(page, '.auth-card', 'button.btn-primary')
        }
    })

    test('sso-login 360 下无横向溢出', async ({ page }) => {
        for (const locale of LOCALES) {
            await applyTheme(page, 'light')
            await page.goto(`/${locale}/sso-login`, { waitUntil: 'domcontentloaded' })
            await expect(page.locator('.sso-login')).toBeVisible()
            await expect(page.locator('html')).toHaveAttribute('lang', locale)
            await waitForVisualStable(page)

            await expectNoHorizontalOverflow(page, `${locale} sso-login 在 360 下出现横向溢出`)
            await expectButtonInsideCard(page, '.sso-method', 'button[type="submit"]')
        }
    })
})
