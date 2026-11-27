# 2026-11-28 阶段 19 范围登记：OAuth 客户端 PKCE 可配置化

> **状态**：2026-11-28 登记并开工。依据：[backlog §3.1](../../plan/backlog.md#31-安全与合规)「OAuth 客户端 PKCE 策略可配置化」（重要 3 / 紧急 2，当前剩余最高分之一）。同分的另有 `braces`（上游无补丁，无法自动完成）与 localePath 收敛（18 文件 / 44 处批量重构）；按「先安全、后重构」的既有取舍，本阶段只做 PKCE，localePath 维持延后。
> **阶段编号**：取已用最大编号（18）+ 1 = **19**。
> **规划模型**：4 大条目 / 10 小条目（[规划规范](../../standards/planning.md) §4）。

## 1. 目标

- 管理端创建 / 编辑 OAuth 应用时可以显式设置 `requirePKCE`，不再被硬编码为 `false`。
- 新建机密客户端默认开启 PKCE（与 better-auth 1.7 的安全默认一致），管理员可显式关闭以保持既有接入方可用。
- 视图 / 契约 / API 文档与实现一致：`docs/api/oauth.md` 现写「当前版本不支持 PKCE」，与 1.7 行为矛盾。

## 2. 决策记录（2026-11-28）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D69 | 新建默认值 | 未显式传 `require_pkce` 时按 `true` 落库（原来硬编码 `false`） | 上游 1.7 的默认是 `requirePKCE ?? true`；公开客户端与申请 `offline_access` 的请求本来就由上游强制 PKCE，此项只影响机密客户端 |
| D70 | 存量兼容 | 不回填、不迁移存量客户端，`PUT` 只在显式传值时才改字段 | 避免上线即让既有接入方 authorization code 流程失败 |
| D71 | 管理端范围 | 只在创建 / 编辑对话框加一个复选框与说明，不新增列表列、批量操作或独立设置页 | 控制视觉矩阵与 i18n 面；列表已有 scope / 状态等列，PKCE 属于低频配置 |
| D72 | 本阶段不做 | 不改 OAuth / OIDC 流程本身（PKCE 校验仍由 better-auth 负责）、不做 localePath 收敛、不升级 `braces`、不接 Redis 限流 | 保持阶段聚焦「暴露既有能力 + 默认值对齐」 |

## 3. 现状取证（2026-11-28）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 创建端点 | `server/api/admin/oauth/applications/index.post.ts` 无条件写 `application.requirePKCE = false` | 注释写「保持客户端可用性不因升级而突变」 |
| Schema | `utils/shared/schemas.ts` 的 `oauthApplicationBaseSchema` 无 `require_pkce` 字段 | 创建 / 更新都无法传入 |
| 视图 | `server/utils/oauth-client-view.ts` 的 `toAdminOAuthClientView` 未返回 PKCE 状态 | 管理端看不到、也改不了 |
| 实体 | `server/entities/oauth-client.ts` 已有 `requirePKCE` 列 | 只差暴露 |
| 文档 | `docs/api/oauth.md` 写「当前版本不支持 PKCE」 | 与 1.7 默认「必需」矛盾 |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 契约与端点 | 4 | Schema 字段、创建默认 true、更新透传、视图与契约测试 |
| M2 | 管理端表单 | 3 | i18n 键、对话框复选框、视觉基线重采 |
| M3 | 文档与口径 | 2 | API 文档更正、安全规范口径 |
| M4 | 阶段收口 | 1 | 阶段归档 |

## 5. 容量基线

- **commits 6–8 / files 10–16 / 行 250–450**。
- 小条目 10 条，每条 ≤10 文件 / 800 行。

## 6. 执行顺序

M1 → M2 → M3 → M4。M2 依赖 M1 的字段名与默认值；M3 依赖 M1 / M2 的最终口径。

## 7. 不做什么

- 不改 PKCE 校验逻辑（仍由 better-auth 完成），不实现自定义 PKCE 中间件。
- 不做存量客户端回填、不改变已有客户端的认证行为。
- 不新增列表列 / 批量开关 / 独立设置页；不做 localePath 收敛与依赖升级。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| 新建默认 true 让部分接入方上线后首次授权失败 | 仅影响新建客户端；创建对话框有复选框与说明，文档写明「关闭会降低安全性」；发布说明标注默认值变化 |
| 对话框新增一行导致视觉基线漂移 | 只影响 `admin-applications` 创建 / 编辑对话框基线，重采该 spec 并在收口记录逐张归因 |
| i18n 5 语言键遗漏 | 键加在 `admin-oauth.json`，`i18n:check` 同批复跑；默认语言文案先定稿再翻译 |
