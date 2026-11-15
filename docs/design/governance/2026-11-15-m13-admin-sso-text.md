# 2026-11-15 阶段 5 M13：Admin SSO 域文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M13；[M12 记录](./2026-11-15-m12-admin-oauth-text.md)。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/admin/sso/providers.vue` | 标题 / 说明 / 合规提示、创建按钮、搜索、类型与状态筛选、列表标题、列头、行操作、空态、删除确认、相对时间、SEO 关键词 |
| 对话框 | `create-provider-dialog.vue` | 基本信息全字段、协议选择、加载失败与提交 Toast |
| 表单段 | `oidc-config-form.vue` / `saml-config-form.vue` / `attribute-mapping-form.vue` | 三段配置的标签、提示、占位符、PKCE 勾选 |
| 对话框 | `provider-detail-dialog.vue` | 基本信息、回调 URL / SP 元数据、时间信息、复制反馈；日期跟随 locale |
| 组合式函数 | `use-sso-providers.ts` | 刷新、状态切换、删除的 Toast 与确认 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/admin-sso.json` | **140 键**：page 32 / create 37 / oidc 20 / saml 8 / mapping 8 / detail 23 / flow 10 / providers 2 |

全量 **1297 键**。

## 2. 实现要点

- `providers.title` / `providers.description` 沿用本里程碑预置键（页面标题与 meta），不另建 `page.title`，避免同一语义双键。
- 状态筛选项、表头、相对时间改 `computed` / `t()`，随语言切换更新；相对时间用 `{count}` 插值。
- `useHead` 的 keywords 改为函数式 `useHead(() => ...)`，与 `usePageMeta` 一致，切语言即时生效。
- OIDC 七个字段标签（`Client ID` / `Client Secret` / `Discovery Endpoint` / `Authorization Endpoint` / `Token Endpoint` / `UserInfo Endpoint` / `JWKS Endpoint`）保留原文英文术语，zh 与迁移前逐字一致；仅占位符与提示进入语言包。
- en 相对时间用 `{count} min ago` / `{count} hr ago` / `{count} d ago`，避开 `1 minutes ago` 的复数问题（项目禁止 `|` 复数分隔符）。
- 详情对话框的状态徽章改用 `detail.enabled` / `detail.disabled`（`启用` / `禁用`），保持与迁移前文案逐字一致，不套用 `common.status.enabled`（`已启用`）。
- 详情对话框的创建 / 更新时间改 `formatDateLocale(value, locale)`，与安全页口径一致；列表页的「创建时间」仍为默认 `zh-CN`，统一口径留在 backlog。
- `use-sso-providers.ts` 走 `useI18nText()`；单测补语言包替身。
- 验证消息仍由 `ssoProviderFormSchema` + `useValidationMessage()` 翻译，本次不改。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1297 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 489 → **356 行 / 50 文件** |
| `pnpm test` | **1002 passed / 131 files** |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（26 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 JS 338,326 B、总 JS 2,283,704 B |
| `pnpm test:visual` | **104 passed**；Admin SSO 页 3 个状态（默认 / OIDC 创建 / SAML 创建）zh 文案未变，基线字节一致 |
| 浏览器（管理员会话） | `/admin/sso/providers`：`SSO 提供商管理`、`管理单点登录（SSO）提供商…`、`创建提供商`、`提供商信息 / 协议类型 / 状态 / 创建时间 / 操作`、`SSO 提供商列表 (2)`；`/en-US/admin/sso/providers`：`SSO Providers`、`Create provider`、`Provider / Protocol / Status / Created / Actions`、`SSO providers (2)`；两种语言的合规提示标签与正文间有空格 |
| 浏览器（对话框） | zh / en 的详情对话框标签、回调 URL 段、时间信息；创建对话框 3 个分段与按钮；390 px 无横向溢出 |
| 浏览器（应用内切换） | 在 `/admin/sso/providers` 点语言切换器切到 English：URL 变 `/en-US/admin/sso/providers`，列头变 `Provider / Protocol / Status / Created / Actions`，列表标题变 `SSO providers (2)`，meta keywords 变英文，详情对话框标签同步为英文 |

## 4. 已知边界

- 提供商名称 / 域名 / 发行者 / Provider ID 来自数据，不翻译。
- 同域内 `flow.statusFailed` 兼作状态切换的抛错兜底与 Toast 标题；不再保留同文的 `toggleFailed`，`operationFailed` 只在 `create` 段保留。
- 「Better Auth / OIDC / SAML / PKCE」等专有名词保留英文。
- 列表「创建时间」未跟随 locale（`zh-CN` 默认），见 backlog「Admin 日期本地化口径统一」。
- Admin 的 `en-US` 视觉基线在 M17 统一补。
