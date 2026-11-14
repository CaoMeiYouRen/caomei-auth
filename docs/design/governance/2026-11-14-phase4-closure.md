# 阶段 4 收口记录：caomei-ui P4 Admin 与 P5 单库收尾

> **状态**：已完成（2026-11-14）。阶段 4 共 15 条原子条目全部完成；P4 交付摘要见 [P4 交付摘要](./2026-11-14-p4-closure.md)，范围与验收见 [阶段 4 登记](./2026-11-10-phase4-registration.md)。
> **结论**：PrimeVue 已从依赖、运行时、构建配置、样式 token 与测试 mock 中完整移除；`keyCss` 回落到 P0 基线以下；Admin 与认证面自基线全绿（102 条）；i18n 页面文案、邮件与 `User.locale` 留给下一阶段（未授权）。

## 1. 交付摘要

| 批次 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1（P4-0） | Admin 迁移基座、`--admin-*` token、暗色 `darkModeSelector` 修复、视觉矩阵与夹具 | `811a4eb` / `c71bcf2` |
| M2–M3（P4-1/2） | `/admin/users` 页面 + 4 个用户对话框 + 白名单 | `be19ad4` / `331f9fa` / `67e724c` |
| M4–M5（P4-3/4） | `/admin/oauth/applications` 页面 + 3 个 OAuth 对话框 + 白名单 | `15ec28d` / `685ab73` |
| M6–M8（P4-5/6/7） | `/admin/sso/providers` 页面 + 3 个表单 + 2 个对话框 + 白名单 | `b34e4ce` / `9831c4d` / `2dd0c02` / `0eda6db` |
| M9–M10（P4-8/9） | `/admin/logs` 页面、表格、4 个统计组件、DatePicker range、共享分页修复 + 白名单 | `77fa378` / `dc8967a` |
| M11（P4-10） | `/oauth/clients`、首页、错误页、StatusBadge、ThemeToggle 收口 + 白名单 | `47b7c8c` |
| M12（P4-11） | 白名单 / 包体 / 视觉 / 回退 / P4 交付摘要 | `9778706` |
| M13（P5-1） | 移除 PrimeVue 运行时、9 个依赖、Provider、构建配置与测试 mock | `f91e6e4` |
| M14（P5-2） | 清理 `--p-*` / `.p-*` / 死样式 / 白名单模块 | `3044251` |
| M15（P5-3） | 最终包体、视觉、文档、Review Gate 与归档 | 本记录 |

阶段前置：`73f0f55`（BaseTooltip 全站统一）、`fe34cf8`（about / privacy / terms 自基线）。

## 2. 最终包体

| 指标 | P0 基线（2026-11-05） | P4 起点（M1） | 阶段 4 收口 |
| :--- | ---: | ---: | ---: |
| 入口 CSS（`keyCss`） | 399,733 B | 411,221 B | **399,427 B（−0.08%）** |
| 入口 JS | 431,270 B | 485,133 B | **343,374 B（−20.4%）** |
| 总 JS | — | 3,688,378 B | **2,162,010 B** |
| 总 CSS | — | 1,795,225 B | **1,447,469 B** |

- 预算门禁 `migration:check-budget` 通过；P5 后入口 CSS 已低于 P0 基线。
- 构建产物 `.output/public/_nuxt/*.js` 不含 `primevue` 字符串；`pnpm why primevue` 为空。

## 3. 视觉

- **自基线（阻断门禁）**：`pnpm test:visual` **102 passed** = 100 张截图（认证 62 + Admin 38）+ 2 条主题切换 hover / active 对比度断言。
- **参考态**：`tests/visual/reference/` 88 张保留为迁移前历史证据；P5 后当前渲染与参考态的差异即「整段迁移」，不再作为门禁。CI 已移除 parity 步骤（`test.yml`），本地 `pnpm test:visual:parity` 仍可做历史审计。
- 已登记视觉盲区（backlog）：长对话框内部滚动区、视觉固定时钟下对话框内 Select 鼠标交互、图表 hover / 动画。

## 4. 迁移护栏终态

- 路由白名单模块 `utils/shared/caomei-ui-migration.ts` 已删除（M14）；运行时不再按路由分叉主题切换。
- `pnpm migration:check-imports` 保留为轻量守卫：`useToast` / `useConfirm` 必须显式 import `caomei-ui`，来源仅 `caomei-ui`。
- `pnpm migration:check-budget` 保留，作为包体预算门禁。
- 全仓（`styles` / `pages` / `components` / `layouts`）已无 `--p-*` / `.p-*` / `:deep(.p-*)`；V1 封装与零消费者组件 / composable 已删除。

## 5. 验证

本批删除零消费者 `useDemoModeGuard` 后复跑 `lint` / `typecheck` / `test` / `coverage` / `build` / `visual` / `duplicate`；`keyCss`、入口 JS 与总 JS 沿用 M14 提交 `3044251`（删除内容不进入入口包）。

| 门禁 | 结果 |
| :--- | :--- |
| `pnpm lint` / `lint:css` | 0 error / 25 warning；样式通过 |
| `pnpm typecheck` | 通过 |
| `pnpm test` | 937 passed |
| `pnpm test:coverage` | Statements 77.96%（删除测试后分母下降；`components/base` 等范围下限仍达标） |
| `pnpm build` / `migration:check-budget` | 通过（`keyCss` 399,427 B） |
| `pnpm test:visual` | 102 passed |
| `pnpm i18n:check` / `migration:check-imports` / `ai:check` | 通过 |
| `pnpm lint:duplicate` | 299 clones |

## 6. 回退

- **P4**：按路由恢复页面 / 私有组件 + 移除白名单 + 定向测试与自基线（逐批说明见 [P4 交付摘要 §6](./2026-11-14-p4-closure.md)）。
- **P5**：单独回退 `package.json` / `pnpm-lock.yaml` / `nuxt.config.ts` / `app.vue` 的 PrimeVue 段与 `styles/*` 清理；不涉及数据库 schema、API 契约或存储格式，无需数据恢复。
- 参考态快照不随回退刷新（历史证据）。

## 7. 遗留与下一阶段

| 项 | 去向 |
| :--- | :--- |
| i18n 页面文案、邮件模板、`User.locale`、SEO / sitemap | 阶段 5（未授权；见 [roadmap](../../plan/roadmap.md)） |
| `CaomeiDataTable` 未透出 `showEdges` / `manualSorting`，分页器无「x 到 y 共 n 条」 | backlog，上游透出后统一升级 |
| 视觉层固定时钟下对话框内 `CaomeiSelect` 鼠标交互失败 | backlog（视觉环境限制） |
| `columns` / `options` 数组中的中文列头不在硬编码扫描面 | 阶段 5（i18n 全量） |
| `stylelint-config-cmyr` 固定 1.0.0（1.1.0 要求 stylelint 18） | backlog，升级 stylelint 18 后解 pin |
| 历史文档中的白名单模块 / parity 命令引用 | 本记录与 [视觉参考态基座](./2026-11-08-visual-baseline-harness.md) 已标注下线；其余历史文档保留原文 |
| `AGENTS.md` §3「UI 设计：SCSS (BEM) + PrimeVue」 | 需用户确认后更新为 caomei-ui |
| 参考态 capture 脚本（`test:visual:reference*`）已不可再采集（无 PrimeVue 页面） | M15 决策：保留参考态快照与 parity 脚本作历史审计，移除 CI parity 步骤；capture 脚本不再维护，后续可删除 |

## 8. Review Gate

- M9–M14 均通过 `@code-auditor` Review Gate；M9 第一轮 Reject（共享分页双请求）与 M11 第一轮 Reject（主题切换分叉 / hover 对比度）均完成修复复审。
- 审查记录（gitignored）：`artifacts/review-gate/2026-11-14-m{9,10,11,12,13,14}.md`。
