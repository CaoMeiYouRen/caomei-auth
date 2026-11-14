import { expect, test } from '@playwright/test'
import { applyTheme } from '../helpers/visual'

/**
 * 主题切换按钮的 hover / active 状态不进入截图矩阵（fixed 定位 + 单像素级变化），
 * 这里用计算样式锁定「图标与背景不能同色」的最低对比度门禁。
 */

function parseRgb(value: string): [number, number, number] {
    const rgb = value.match(/rgba?\(([^)]+)\)/u)
    if (rgb) {
        const [r, g, b] = rgb[1]!.split(',').map((item) => Number.parseFloat(item.trim()))
        return [r ?? 0, g ?? 0, b ?? 0]
    }

    /* color-mix 在 Chrome 的计算值可能是 `color(srgb r g b)`（0–1 浮点）或百分比形式 */
    const srgb = value.match(/color\(srgb\s+([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(%?)/u)
    if (srgb) {
        const channel = (raw: string, percent: string) => {
            const parsed = Number.parseFloat(raw)
            return percent ? parsed * 2.55 : parsed * 255
        }
        return [channel(srgb[1]!, srgb[2]!), channel(srgb[3]!, srgb[4]!), channel(srgb[5]!, srgb[6]!)]
    }

    throw new Error(`无法解析颜色：${value}`)
}

function luminance([r, g, b]: [number, number, number]): number {
    const channel = (value: number) => {
        const normalized = value / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(foreground: string, background: string): number {
    const lighter = Math.max(luminance(parseRgb(foreground)), luminance(parseRgb(background)))
    const darker = Math.min(luminance(parseRgb(foreground)), luminance(parseRgb(background)))
    return (lighter + 0.05) / (darker + 0.05)
}

async function readContrast(button: import('@playwright/test').Locator): Promise<number> {
    const { backgroundColor, color } = await button.evaluate((el) => {
        const style = getComputedStyle(el)
        return { backgroundColor: style.backgroundColor, color: style.color }
    })
    return contrastRatio(color, backgroundColor)
}

for (const theme of ['light', 'dark'] as const) {
    test(`主题切换按钮 hover / active 对比度（${theme}）`, async ({ page }) => {
        await applyTheme(page, theme)
        await page.goto('/login', { waitUntil: 'domcontentloaded' })

        const button = page.locator('.theme-toggle')
        await expect(button).toBeVisible()
        if (theme === 'dark') {
            await expect(page.locator('html')).toHaveClass(/dark/u)
        } else {
            await expect(page.locator('html')).not.toHaveClass(/dark/u)
        }

        /* 关闭过渡，避免读到 color-mix 的中间值 */
        await page.addStyleTag({ content: '.theme-toggle, .theme-toggle * { transition: none !important; }' })
        await button.hover()
        await expect.poll(() => readContrast(button), {
            message: `${theme} 主题下 hover 时图标与背景对比度不足`,
            timeout: 5000,
        }).toBeGreaterThanOrEqual(3)

        const box = await button.boundingBox()
        if (!box) {
            throw new Error('主题切换按钮没有可点击区域')
        }
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        try {
            await expect.poll(() => readContrast(button), {
                message: `${theme} 主题下 active 时图标与背景对比度不足`,
                timeout: 5000,
            }).toBeGreaterThanOrEqual(3)
        } finally {
            await page.mouse.up()
        }
    })
}
