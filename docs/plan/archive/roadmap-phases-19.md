# 阶段 19 里程碑：OAuth 客户端 PKCE 可配置化（2026-11-28 收口）

> 索引与阶段正文见 [todo-archive-phases-19.md](./todo-archive-phases-19.md)；范围登记见 [2026-11-28-phase19-registration.md](../../design/governance/2026-11-28-phase19-registration.md)，收口记录见 [2026-11-28-phase19-closure.md](../../design/governance/2026-11-28-phase19-closure.md)。

- **目标**：把管理端硬编码的 `requirePKCE = false` 改为可配置，新建机密客户端默认开启，并让视图、契约与文档与 better-auth 1.7 的实际行为一致。
- **交付**：
    - 契约：`oauthApplicationSchema` 接受 `require_pkce`；创建端点改为 `require_pkce ?? true`；`PUT` 与 `applyOAuthClientInput` 只改显式传值（存量不回填）；`toAdminOAuthClientView` 返回 `requirePkce`，`types/admin.ts` 同步。
    - 管理端：创建 / 编辑对话框新增「要求 PKCE 校验」复选框与说明（默认勾选、按存量值回显、提交体带字段）；2 个键 × 5 语言；创建对话框基线重采（仅 1 张变化，其余 388 张零差异）。
    - 文档：`docs/api/oauth.md` 更正「不支持 PKCE」并补支持情况小节；安全规范补「PKCE 默认开启」条目。
- **关键决策**：D69 新建默认 true；D70 存量不回填；D71 只暴露在对话框；D72 不做边界。
- **质量门**：单测 1636（+3），覆盖率 79.03 / 66.29 / 72.78 / 79.23，重复 3.69%，构建与文档站通过，视觉 389 用例通过。
- **未覆盖边界**：未做真实 OAuth 客户端端到端联调；存量 `false` 未逐个评估迁移；列表不展示 PKCE 状态。
