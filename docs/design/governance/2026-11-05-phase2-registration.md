# 2026-11-05 阶段 2 范围登记：安全收口与迁移预备

> **状态**：已授权（2026-11-05 用户选择「A 安全与质量收口」，并补充「开始 i18n 和组件库迁移预备」）。
> **单一事实源**：原子条目与状态见 [todo.md](../../plan/todo.md)；候选详情见 [backlog.md](../../plan/backlog.md)；阶段方向见 [roadmap.md](../../plan/roadmap.md)。
> **准入规则**：[规划规范](../../standards/planning.md)。

## 1. 阶段目标

在进入两条大迁移（PrimeVue → caomei-ui、i18n 全量落地）之前，先清掉安全与质量的硬债，并完成两条迁移的低风险预备，确保后续阶段可以直接执行而不返工。

**本阶段只做预备**：

- 不替换页面级 PrimeVue 组件（P2 试点不在本阶段）；
- 不全量翻译页面 / 邮件 / API（i18n M2+ 不在本阶段）；
- 不做 UI 改版、功能新增或架构重构。

## 2. 阶段构成（5 条主线 / 11 条原子条目）

| 主线 | 原子条目 | 交付面 |
| :--- | :--- | :--- |
| **M1 安全与合规收口** | M1-1 CodeQL #20 复核与豁免处置（2026-11-30 前） | `.github/security-alert-exemptions.json`、告警结论、复核记录 |
| | M1-2 SSO 历史配置排查与安全台账复核 | `GET /api/admin/sso/audit` 结果、清理记录、豁免台账 |
| **M2 Zod 后端迁移收尾** | M2-1 P1 4 个路径参数 handlers + 测试 | `oauth/client/[id].get`、`admin/oauth/applications/[id].delete`、`admin/sso/providers/[id].get`、`admin/sso/providers/[id].delete` |
| | M2-2 P2/P3 4 个查询参数 handlers + 测试 | 分页 / 筛选 / 日志 / 社交提供商查询 |
| | M2-3 `zod-migration.md` 收口与 API 文档同步 | 迁移状态、验证矩阵、`docs/api/` 示例 |
| **M3 测试覆盖率第一阶段** | M3-1 覆盖率基线复测与目标校准 | 当前基线、阶段目标（max(30%, 复测基线 + 10pp)，以复测为准） |
| | M3-2 定向补测 | `server/api`（含 Zod / SSO audit）、`composables`、`components/base` |
| **M4 caomei-ui 迁移预备** | M4-1 用量盘点脚本 / 快照 + 路由白名单初值 + 版本锁定 + 回退方案 | 可复现的 PrimeVue 用量快照、`CAOMEI_UI_ROUTE_PREFIXES` 初值、`caomei-ui@1.0.0` 精确锁定 + Dependabot `ignore`、回退方案 |
| | M4-2 接入基座（P0/P1）+ P2 前置方案 | `caomei-ui/nuxt` + `theme.css` + `data-preset="caomei"`、双库并存、构建 / 包体复测；`keyCss` / 入口 JS 基线与允许增幅（`keyCss` ≤ +10%、入口 JS ≤ +5%）；P2 视觉基线方案（只出方案，不建截图工程）；不做页面替换 |
| **M5 i18n 迁移预备** | M5-1 `@nuxtjs/i18n@10` 技术验证 | `files[]`、`localeDetector`、`prefix_except_default`、`useLocaleHead`、语言切换原型 |
| | M5-2 Zod per-parse error map 验证 | 1 个表单 + 1 个 API；输出 i18n M2 准入结论 |

## 3. 验收标准

- **M1**：CodeQL #20 在 2026-11-30 前有明确结论（修复 / 误报 dismiss / 续期豁免），豁免台账字段与 `tracking` 有效；SSO audit 有结果与清理记录，无法访问部署环境时显式标记阻塞而不是伪造通过。
- **M2**：14/14 handlers 使用 Zod；定向测试与 typecheck 通过；`zod-migration.md` 与 API 文档同步。
- **M3**：覆盖率基线已复测；阶段目标达成（max(30%, 复测基线 + 10pp)）；新增测试覆盖 M2 与 M1 的关键路径。
- **M4**：用量快照可复现；路由白名单初值与回退方案已登记；`caomei-ui@1.0.0` 精确锁定且 Dependabot `ignore` 生效；双库构建通过；`keyCss` / 入口 JS 有前后对比且未越允许增幅；P2 视觉基线方案已输出；**无页面替换**。
- **M5**：技术验证分支 / PR 可运行；语言切换与 `useLocaleHead` 生效；Zod map 在 1 表单 + 1 API 验证通过；输出 i18n M2 准入结论；**不全量翻译**。
- 全阶段：`pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` 通过；无未关闭 blocker 进入提交。

## 4. 依赖与风险

| 项 | 说明 |
| :--- | :--- |
| SSO audit | 需要管理员 / 已部署环境；不可用时标记 blocked，不伪造结果 |
| CodeQL #20 | 若上游仍无可配置哈希，按 `hard-fix` 续期并写明复核日期；不得静默过期 |
| 覆盖率 | 17.65% 为历史值；M3-1 必须先复测，再定阶段目标；不为数字补低价值测试 |
| caomei-ui 接入 | 1.0.0 的 DatePicker range / Toast token 缺口仍在 caomei-ui #28；本阶段只做基座，不触发这些缺口 |
| i18n 接入 | v10 + Nuxt 4.6.3 需技术验证；本阶段不替换页面文案，避免与组件迁移二次改写 |
| 双预备并行 | M4 先于 M5（组件迁移优先）；两线都不做页面级改动，冲突面小 |

## 5. 明确不做

- 不替换登录 / 注册 / 资料 / admin 页面组件（P2+）。
- 不建立截图视觉回归工程（P2 开工前单独补；本阶段只输出方案）。
- 不全量翻译页面、邮件、API 错误（M2+）。
- 不处理 DatePicker range / Toast 逐语气样式（等待 caomei-ui #28 结论）。
- 不做时区设置、注册控制、Admin 日志筛选、性能审计等体验项。
- 不升级 PrimeVue 5.x。

## 6. 关联文档

- [待办事项](../../plan/todo.md)｜[Backlog](../../plan/backlog.md)｜[路线图](../../plan/roadmap.md)
- [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[i18n 评估](./2026-11-05-i18n-evaluation.md)
- [规划规范](../../standards/planning.md)｜[安全规范](../../standards/security.md)｜[测试规范](../../standards/testing.md)
