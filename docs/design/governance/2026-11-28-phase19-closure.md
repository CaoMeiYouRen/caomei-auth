# 2026-11-28 阶段 19 收口记录：OAuth 客户端 PKCE 可配置化

> 范围与决策见 [阶段 19 范围登记](./2026-11-28-phase19-registration.md)；阶段正文见 [todo-archive-phases-19](../../plan/archive/todo-archive-phases-19.md)，里程碑见 [roadmap-phases-19](../../plan/archive/roadmap-phases-19.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 契约与端点 | `oauthApplicationSchema` 接受 `require_pkce`；创建端点 `require_pkce ?? true`（原为硬编码 false）；`PUT` 与 `applyOAuthClientInput` 只改显式传值；`toAdminOAuthClientView` 返回 `requirePkce`；`types/admin.ts` 同步；建 / 改端点各补默认值与透传断言 | `ae6c136` |
| M2 管理端表单 | 对话框新增「要求 PKCE 校验」复选框与说明（默认勾选、按存量回显、随提交体发送）；2 键 × 5 语言；创建对话框基线重采（仅 1 张变化） | `172d366`、`5a9929e` |
| M3 文档与口径 | `docs/api/oauth.md` 授权参数改为「客户端开启 requirePKCE 时必需」并补支持情况小节；安全规范补「PKCE 默认开启」条目（D69 / D70） | `4a66a10` |
| M4 阶段收口 | 归档分片、索引、roadmap 指针、收口记录 | 收口提交 |

## 2. 终态指标

- 测试：**1636** 用例通过（224 文件；较阶段 18 的 1633 增加 3：建 / 改端点 PKCE 断言）。
- 覆盖率：Statements 79.03%（+0.01）/ Branch 66.29%（+0.15）/ Functions 72.78%（0.00）/ Lines 79.23%（0.00）；`coverage:check` 通过。
- 视觉：**389** 用例通过；`admin-applications-light-desktop-create-dialog.png` 重采，其余 388 张零差异。
- 重复代码 3.69%；`quality:file-size` 0 错误；`build` / `docs:build` / `docs:anchors`（169 文件）通过。
- i18n：新增 2 键 × 5 语言，`i18n:check` 通过。
- 提交：5 个条目提交 + 1 个收口提交。

## 3. Review Gate 轮次

- M1.1 / M1.2 / M1.3 / M1.4 R1 Pass：Schema → 端点 → 视图三段同名字段（`require_pkce` 入参 / `requirePkce` 视图）口径一致；创建默认值与显式 false 都有断言；PUT 断言「不传保持存量 false」。
- M2.1 / M2.2 / M2.3 R1 Pass：i18n 键 5 语言齐全；对话框在创建 / 编辑两种模式下都回显正确；基线只变 1 张并与新增行位置一致。
- M3.1 / M3.2 R1 Pass：API 文档不再与实现矛盾；安全规范条目引用具体文件与字段，`docs:anchors` 通过。
- M4.1 R1 Pass：归档块 6 项字段齐全，进度表与审计列一致。

## 4. 偏差

- 计划 6–8 commits / 10–16 files；实际 6 个提交 / 12 个文件（含 5 语言语言包与 1 张基线）。
- M1 的 4 个小条目合并为 1 次提交：Schema / 端点 / 视图是同一契约链，拆开会出现「字段能传但落不了库」的中间态。
- M2.1 与 M2.2 合并提交（i18n 键无独立可验收行为）；M2.3 单独提交基线。
- `index.get.spec.ts` 的快照式断言因新增字段失败，按实际响应补 `requirePkce: false`，未放宽断言。

## 5. 已知残留

- 未做真实 OAuth 客户端端到端联调：PKCE 校验由 better-auth 完成，本阶段只断言端点契约与默认值；真实 `code_challenge` 往返需接入方配合。
- 存量客户端的 `requirePKCE = false` 保持不变（D70），未逐个评估是否可以安全开启；如需推进，应在管理端列表补充 PKCE 状态列后逐个确认。
- 管理端只暴露创建 / 编辑对话框，列表页不展示 PKCE 状态（D71）。
- localePath 收敛（18 文件 / 44 处）与 `braces` 升级（等上游发版）仍在 [backlog](../../plan/backlog.md)。
