# 2026-11-15 阶段 5 M14：Admin 日志域文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M14；[M13 记录](./2026-11-15-m13-admin-sso-text.md)。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/admin/logs.vue` | 去掉 `definePageMeta.title` 硬编码，改 `usePageMeta('admin.logs.page.title', …)` |
| 组件 | `logs-header.vue` | 标题 / 说明 / 刷新按钮 |
| 组件 | `stats-overview.vue` | 4 张概览卡标签 |
| 组件 | `period-stats.vue` | 时间段统计标题与 4 个周期标签 |
| 组件 | `provider-stats.vue` | 标题、空态、三列表头（改 `computed`） |
| 组件 | `trend-chart.vue` | 标题、图例、tooltip、坐标轴标题、Demo 日期格式；`watch(locale)` 重绘 |
| 组件 | `logs-table.vue` | 标题 / 搜索 / 状态 / 日期范围 / 清除 / 刷新 / 空态 / 撤销会话 / 五列表头；状态选项与列头改 `computed` |
| 组合式函数 | `use-logs-management.ts` | 撤销成功 / 失败与统计加载失败的 Toast |
| 语言包 | `i18n/locales/{zh-CN,en-US}/admin-logs.json` | **51 键**：page 3 / overview 4 / period 5 / providers 5 / trend 6 / table 22 / flow 6 |

全量 **1348 键**。

## 2. 实现要点

- 图表文案全部走 `t()`：图例 `登录次数`、tooltip `日期: {date}` / `登录次数: {count}`、坐标轴标题；Demo 日期改用 `Intl.DateTimeFormat(locale)`，避免 dayjs 全局 locale 固定为 zh-cn 时 `MMM D` 渲染成「11月 15」。
- `watch(locale)` 触发 `nextTick(renderChart)`，与既有 `watch(isDark)` 同构，切语言后图例与坐标轴即时更新；同时清空 `demoSeries` 缓存，Demo 标签按新语言重算。
- `formatDevice` 的兜底从中文改为空串，由表格用 `admin.logs.table.unknownDevice` 本地化（工具层不再输出中文）。
- 页面 `definePageMeta` 只保留 `layout`，标题 / 描述由 `usePageMeta` 生成，`document.title` 为 `登录统计 - 草梅 Auth` / `Login statistics - Caomei Auth`。
- `logs-table` 的 `statusOptions` 与 `columns`、`provider-stats` 的 `columns` 改 `computed`，随语言切换更新。
- `use-logs-management.ts` 走 `useI18nText()`；单测补语言包替身；`trend-chart.spec` 补 `useI18n` 替身。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1348 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 356 → **301 行 / 42 文件** |
| `pnpm test` | **1006 passed / 132 files**（新增 `device.spec` 与图表演示标签断言） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（26 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 JS 338,182 B、总 JS 2,288,159 B |
| `pnpm test:visual` | **104 passed**；Admin 日志页 zh 文案未变，基线字节一致 |
| 浏览器（管理员会话） | `/admin/logs`：`登录统计`、`刷新数据`、`总用户数 / 总登录次数 / 活跃会话 / 活跃用户（7天）`、`时间段统计 / 登录方式统计 / 登录趋势（最近30天） / 登录日志`、`今日登录…`、列头、`登录日志 (58)`；`/en-US/admin/logs`：`Login statistics`、`Total users…`、`Sign-ins by period / method`、`Login logs (58)`、`Method / Sign-ins / Share / User / Sign-in time / IP address / Device / Status / Actions` |
| 浏览器（应用内切换） | 语言切换器切换后标题、卡片、分段标题、表头与列表标题同步为当前语言 |

## 4. 已知边界

- 用户名 / 邮箱 / IP 与设备型号来自数据或 `formatDevice`，不翻译；设备完全未知时显示 `未知设备` / `Unknown device`。
- 服务端 `/api/admin/logs/sessions` 仍返回中文 `message`，经 `errorMessage` 会原样进 en Toast；属 M16 错误面，留待统一。
- 单条目跨 15 个文件（页面 + 6 组件 + composable + 双语包 + 3 处测试），因同一域的键完整性不可拆，按单原子条目提交。
- 图表在切换语言后重绘，动画会重播一次（与主题切换行为一致）。
- Demo 模式的 zh 日期标签由 `01月05日` 变为 Intl 自然格式 `1月5日`（仅在 Demo 且无真实趋势数据时出现），属可接受观感变化。
- Admin 的 `en-US` 视觉基线在 M17 统一补。
