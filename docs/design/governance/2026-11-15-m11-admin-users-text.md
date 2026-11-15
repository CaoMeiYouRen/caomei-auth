# 2026-11-15 阶段 5 M11：Admin 用户域文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M11；[M10 记录](./2026-11-15-m10-cross-links.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4.2。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/admin/users.vue` | 标题 / 说明、搜索与筛选、列表标题与排序说明、列头（用户 / 角色 / 状态 / 注册时间 / 操作）、行操作与空态；`usePageMeta` |
| 对话框 | `create-user-dialog` / `ban-user-dialog` / `user-detail-dialog` / `user-sessions-dialog` | 表单标签与占位符、角色 / 时长选项、详情分组、状态标签、管理员角色操作、会话表格与确认 |
| 组合式函数 | `composables/admin/use-user-management.ts` | 单个 / 批量禁用、解禁、删除、同步角色的确认与 Toast |
| 组合式函数 | `composables/admin/use-user-table.ts` | 排序字段标签、角色 / 状态选项、角色标签，日期改 `formatDateTimeLocale`（短格式、无秒）跟随 locale |
| 共享组件 | `components/base/status-badge.vue` | `enabled` / `disabled` / `banned` / `session` / `yes-no` / `role` 六组预设改 `t()`（Admin 全域共用） |
| 语言包 | `i18n/locales/{zh-CN,en-US}/admin-users.json` | **190 键**：page 31 / create 18 / ban 17 / detail 64 / sessions 22 / flow 38 |
| 语言包 | `common.json` | 新增 `status.*` 共 10 键（含角色名）；`common` 1 → 11 |

全量 **1046 键**。

## 2. 实现要点

- 页面 `columns` 与对话框选项改为 `t()` 生成；`banDurationOptions` 改 `computed` 以跟随语言切换；`roleOptions` / `statusOptions` / `getSortFieldLabel` 同样 `computed`。
- 用户列表的注册时间改 `formatDateTimeLocale(value, $i18n.locale)`（`dateStyle: short` + `timeStyle: short`，无秒、补零随 locale），zh `2026/6/15 12:15`、en `6/15/26, 12:15 PM`，宽度可容于 160 px 列；详情 / 会话对话框仍用 `formatDateTime` 的 ISO 秒级格式（信息更完整，两种格式并存已在 §4 登记）。
- 确认句（禁用 / 删除 / 批量 / 管理员角色 / 撤销会话）统一 `{name}` / `{count}` 插值；`ban` 的确认句用 `<i18n-t>` + `#name` 保留 `<strong>`。
- `BaseStatusBadge` 的预设标签移入 `common.status.*`，避免 M12–M14 重复建键。
- 单测：`status-badge` / `use-user-table` / `use-user-management` 三处补 `useI18n` / `useI18nText` 替身，断言仍指向真实中文。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1046 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 823 → **599 行 / 62 文件** |
| `pnpm test` | **1002 passed / 131 files**（新增日期短格式与 `banned` / `session` / `yes-no` 徽章断言） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（26 条既有 warning，含 `artifacts/` 历史探针文件） |
| `pnpm build` / 预算 | 通过；入口 JS 338,314 B、总 JS 2,259,626 B |
| `pnpm test:visual` | Admin 用户页 9 个状态（默认 4 + 创建 / 禁用 / 详情 / 会话 / 选择 5）以 `--update-snapshots=all` 重采，7 张变化；verify **104 passed** |
| 浏览器（生产构建，管理员会话） | `/admin/users`：`用户管理`、说明、`创建用户`、`用户列表 (13) 按注册时间降序排列`、列头 `用户 / 角色 / 状态 / 注册时间 / 操作`、搜索占位符；`/en-US/admin/users`：`User management`、`Create user`、`Users (13) Sorted by registration date, descending`、`User / Role / Status / Registered / Actions` |

## 4. 已知边界

- 用户数据（昵称 / 邮箱 / 角色值）来自服务端，不翻译；角色与状态标签由 `common.status.*` 统一。
- `use-user-table` 的日期改为跟随 locale 后，`en-US` 下的日期形态与 `zh-CN` 不同，属预期。
- 日期列宽度：1440 px 下 zh `2026/6/15 12:15`（160 px 列）与 en `6/15/26, 12:15 PM` 均单行；1024 px 下表格整体变窄（日期列 98 / 128 px）时两语言都会折成两行，属表格自身宽度约束，已并入 backlog「视觉矩阵补中间宽度」。
- 同一域内日期存在两种形态：列表用短格式（本地化、无秒），详情 / 会话用 ISO 秒级；属有意取舍。
- 批量禁用写入的 `banReason` 取当前界面语言（zh「批量禁用操作」/ en「Bulk ban」），会随操作者语言写入数据库；如后续需要稳定值，应改为机器码 + 展示层本地化。
- Admin 的 `en-US` 视觉基线在 M17 统一补。
