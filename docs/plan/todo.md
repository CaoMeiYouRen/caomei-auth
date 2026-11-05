# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)。

## 当前状态

**当前进行中阶段：阶段 2「安全收口与迁移预备」**（2026-11-05 用户选择「A 安全与质量收口」，并补充「开始 i18n 和组件库迁移预备」）。

- 范围与验收口径的单一事实源：[阶段 2 登记记录](../design/governance/2026-11-05-phase2-registration.md)
- 构成：**5 条主线 / 11 条原子条目**（安全 2 / Zod 3 / 覆盖率 2 / caomei-ui 预备 2 / i18n 预备 2）
- 边界：**只做预备**，不替换页面级 PrimeVue 组件、不全量翻译页面 / 邮件 / API、不建截图视觉回归工程。

## 阶段 2 原子条目

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M1-1 | CodeQL #20 复核与豁免处置（2026-11-30 前） | `.github/security-alert-exemptions.json`、告警结论、复核记录 | 已完成（误报 dismiss，2026-11-05） |
| M1-2 | SSO 历史配置排查与安全台账复核 | `GET /api/admin/sso/audit` 结果、清理记录、豁免台账 | 阻塞（需管理员权限的已部署环境；2026-11-05 本地库无 SSO 数据，未伪造结果） |
| M2-1 | P1 4 个路径参数 handlers + 测试 | `oauth/client/[id].get`、`admin/oauth/applications/[id].delete`、`admin/sso/providers/[id].get`、`admin/sso/providers/[id].delete` | 已完成（4 个 handler 已用 `idParamSchema`，含 400 用例） |
| M2-2 | P2/P3 4 个查询参数 handlers + 测试 | 分页 / 筛选 / 日志 / 社交提供商查询 | 已完成（4 个 handler 已用 Zod；新增 Schema 层单测 15 例） |
| M2-3 | `zod-migration.md` 收口与 API 文档同步 | 迁移状态、验证矩阵、`docs/api/` 示例 | 已完成（14/14 handlers，文档与 API 示例同步） |
| M3-1 | 覆盖率基线复测与目标校准 | 当前基线、阶段目标（全局 ≥75.74%；`server/api` ≥95% / `composables` ≥80% / `components/base` ≥75%） | 已完成（基线 75.74%，目标已按范围校准） |
| M3-2 | 定向补测 | `server/api`（含 Zod / SSO audit）、`composables`、`components/base` | 已完成（Statements 78.26%；四个范围下限全部达标） |
| M4-1 | 用量盘点脚本 / 快照 + 路由白名单初值 + 版本锁定 + 回退方案 | 可复现的 PrimeVue 用量快照、`CAOMEI_UI_ROUTE_PREFIXES` 初值、`caomei-ui@1.0.0` 精确锁定 + Dependabot `ignore`、回退方案 | 已完成（30 族 / 301 标签 / 50 文件；白名单空集；回退方案见 P0 基线记录） |
| M4-2 | 接入基座（P0/P1）+ P2 前置方案 | `caomei-ui/nuxt` + `theme.css` + `data-preset="caomei"`、双库并存、构建 / 包体复测；`keyCss` / 入口 JS 允许增幅；P2 视觉基线方案（不建截图工程）；不做页面替换 | 待执行 |
| M5-1 | `@nuxtjs/i18n@10` 技术验证 | `files[]`、`localeDetector`、`prefix_except_default`、`useLocaleHead`、语言切换原型 | 待执行 |
| M5-2 | Zod per-parse error map 验证 | 1 个表单 + 1 个 API；输出 i18n M2 准入结论 | 待执行 |

## 未完成项汇总

> 本节仅为状态指针，不构成条目登记或启动授权；候选详情见 [backlog.md](./backlog.md)。

- 当前阶段 11 条原子条目全部待执行；无跨阶段未完成指针。
- 正式组件库迁移（P2+）与 i18n 全量翻译（M2+）仍为 backlog 候选，待本阶段预备结论后再评估。

## 说明

- 阶段 2 的验收、依赖与风险以 [阶段 2 登记记录](../design/governance/2026-11-05-phase2-registration.md) 为准；本表只登记状态，不重复条款。
- 完成态不得早于 Review Gate 结论；阶段收口时按 [规划规范](../standards/planning.md) 归档。
