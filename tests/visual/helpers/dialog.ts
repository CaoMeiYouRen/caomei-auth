import { type Page, expect } from '@playwright/test'

/**
 * 视觉层对话框内的 Select 交互统一走键盘。
 *
 * 视觉层用 `page.clock.setFixedTime` 冻结 `Date.now()`（只替换 Date，不暂停定时器）。
 * Vue 3.5 的 invoker 会为首个触达的事件打 `_vts` 时间戳，后续 invoker 在
 * `_vts <= invoker.attached` 时直接返回；冻结时钟下两者相等，因此同一事件上除第一个
 * Vue 监听器外，其余监听器都会被跳过，鼠标点不开对话框内 Select（真实时钟下正常，
 * 属测试环境假阳性，不是产品缺陷）。键盘 Enter 的 keydown 处理器是该事件的首个
 * invoker，可以正常执行，因此用 `focus()` + `Enter` 打开下拉再点选项。具体消耗首个
 * pointerdown 的外层监听器尚未实测定位。
 *
 * `clock.install()` 是否解除该守卫未验证；不采用的原因是它接管定时器后 Admin 表格
 * 数据不再加载，60s 内无法达到可交互状态。结论见
 * docs/design/governance/2026-11-08-visual-baseline-harness.md §4.1。
 */
export async function selectDialogOption(page: Page, triggerName: string, optionName: string): Promise<void> {
    const trigger = page.getByRole('dialog').getByRole('combobox', { name: triggerName })
    await trigger.focus()
    await trigger.press('Enter')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.getByRole('option', { name: optionName }).click()
}

/**
 * 用键盘激活对话框内按钮（同样规避固定时钟下的鼠标路径）。
 * 仅适用于原生可激活元素（`CaomeiButton` 渲染为 `<button>`）；`role="button"` 的自定义
 * 元素不会因 Enter 产生 click。
 */
export async function pressDialogButton(page: Page, buttonName: string): Promise<void> {
    const button = page.getByRole('dialog').getByRole('button', { name: buttonName })
    await button.focus()
    await button.press('Enter')
}
