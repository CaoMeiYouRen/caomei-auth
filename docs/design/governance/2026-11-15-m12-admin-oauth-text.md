# 2026-11-15 阶段 5 M12：Admin OAuth 域文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M12；[M11 记录](./2026-11-15-m11-admin-users-text.md)。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/admin/oauth/applications.vue` | 标题 / 说明 / 合规提示、API 文档与创建按钮、搜索、列表标题、列头、行操作、空态；`usePageMeta` |
| 对话框 | `create-application-dialog.vue` | 应用名称 / 描述 / 重定向 URL / 主页 / Logo / 授权范围 / 联系邮箱 / 认证方式 / 授权类型 / 条款链接，含必填错误与提交 Toast |
| 对话框 | `application-secret-dialog.vue` | 创建成功提示、复制 Client ID / Secret、凭据保存警告与复制结果 Toast |
| 对话框 | `api-docs-dialog.vue` | Discovery 端点、主要端点列表（4 个）、配置示例、5 条注意事项、复制反馈 |
| 组合式函数 | `composables/admin/use-application-management.ts` | 启用 / 禁用、删除的确认与 Toast |
| 语言包 | `i18n/locales/{zh-CN,en-US}/admin-oauth.json` | **113 键**：page 22 / create 44 / secret 10 / docs 25 / flow 12 |

全量 **1159 键**。

## 2. 实现要点

- 三个对话框的选项数组（认证方式 / 授权类型 / 端点列表）改 `computed`，随语言切换更新；页面列头同样由 `t()` 生成。
- 删除确认句 `确定要删除应用 "{name}" 吗？此操作无法撤销。` 走 `{name}` 插值；`secret.created` 同样插值。
- `api-docs-dialog` 的「复制{label}」按钮用 `{label}` 插值，端点名本身也是键。
- 组合式函数走 `useI18nText()`；单测补语言包替身。
- 语言包根键为 `admin.oauth.*`（`admin-oauth` 模块的 key group），避免与 `oauth` 模块的 `oauth.*` 冲突——`i18n:check` 的跨模块重复键检查曾在首版命中，已修正。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1159 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 599 → **489 行 / 57 文件** |
| `pnpm test` | **1002 passed / 131 files** |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（26 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 JS 338,326 B、总 JS 2,270,613 B |
| `pnpm test:visual` | Admin OAuth 应用页 6 个状态以 `--update-snapshots=all` 强制重采后与旧基线**字节一致**（zh 文案与排版未变）；verify **104 passed** |
| 浏览器（管理员会话） | `/admin/oauth/applications`：`应用管理`、`管理您的 OAuth 2.0 应用…`、`API 文档 / 创建应用`、列头 `应用名称 / Client ID / 授权范围 / 状态 / 创建时间 / 操作`、搜索占位符；`/en-US/admin/oauth/applications`：`Application management`、`API docs / Create application`、`Application / Client ID / Scopes / Status / Created / Actions`；en 合规提示行为 `Note: The current OIDC implementation is based on Better Auth…`（标签与正文间有空格） |

## 4. 已知边界

- 应用名称 / 描述 / Client ID / 授权范围来自数据，不翻译。
- 合规提示中「Better Auth / OpenID Connect」等专有名词保留英文。
- `application-secret-dialog` 无视觉基线（`admin-matrix` 只覆盖默认 / 创建 / API 文档三态），其 `{name}` 插值与复制反馈只有浏览器手检；M17 补 en 基线时一并覆盖。
- `/en-US` 的应用列表「创建时间」仍是 `formatDateLocale` 默认 `zh-CN` 输出；统一改为按 locale 已登记 backlog「Admin 日期本地化口径统一」。
- Admin 的 `en-US` 视觉基线在 M17 统一补。
