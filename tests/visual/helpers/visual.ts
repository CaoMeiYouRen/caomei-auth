import { type Locator, type Page, expect } from '@playwright/test'

/**
 * 视觉基线（参考态）公共辅助。
 *
 * 依据 docs/design/governance/2026-11-08-visual-baseline-harness.md：
 * - 主题以 `localStorage` 显式注入，不依赖系统 `prefers-color-scheme`，避免 CI 与本地默认色偏好差异；
 * - 截图前等待网络空闲与字体就绪，动画由配置层 `animations: 'disabled'` 关闭；
 * - 动态区域统一以 `[data-visual-mask]` 显式遮蔽，不依赖像素容差兜底。
 */

export type VisualTheme = 'light' | 'dark'

/** 应用主题由 `useAppTheme` 的 `useColorMode` 驱动，storageKey 为 VueUse 默认值。 */
export const THEME_STORAGE_KEY = 'vueuse-color-scheme'

/** 以确定性方式设置主题；必须在 `page.goto` 之前调用。 */
export async function applyTheme(page: Page, theme: VisualTheme): Promise<void> {
    await page.addInitScript(([key, value]) => {
        window.localStorage.setItem(key, value)
    }, [THEME_STORAGE_KEY, theme] as const)
}

/** 等待页面渲染稳定：网络空闲 + 字体就绪。 */
export async function waitForVisualStable(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
        // 认证页可能加载第三方脚本（统计 / 错误监控），networkidle 不保证达成；
        // 字体与显式可见性断言仍能保证渲染稳定，故此处不硬失败。
    })
    await page.evaluate(async () => {
        await document.fonts?.ready
    })
}

/** 动态区域掩码：所有标记了 `data-visual-mask` 的元素。 */
export function dynamicMask(page: Page): Locator[] {
    return [page.locator('[data-visual-mask]')]
}

/** 对整页（viewport）截图并比对，自动应用动态区域掩码。 */
export async function expectPageScreenshot(page: Page, name: string): Promise<void> {
    const snapshot = name.endsWith('.png') || name.endsWith('.webp') ? name : `${name}.png`
    await expect(page).toHaveScreenshot(snapshot, { mask: dynamicMask(page) })
}
