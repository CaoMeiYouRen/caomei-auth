# 2026-11-10 阶段 4 范围登记：caomei-ui P4 Admin 与 P5 单库收尾

> **状态**：已授权启动（2026-11-10 用户选择 A+B；按依赖拆为阶段 4「P4 Admin + P5 单库」与阶段 5「i18n 全量」）。
> **单一事实源**：阶段范围、原子条目与验收见本文；P4-0 技术方案见 [P4-0 Admin 迁移基座方案](./2026-11-10-p4-admin-migration-plan.md)；候选详情见 [backlog.md](../../plan/backlog.md)；方向见 [roadmap.md](../../plan/roadmap.md)。
> **前置阶段**：[阶段 3 收口记录](./2026-11-09-phase3-closure.md)（仅 M0-3 定时发版验证移至 backlog）；[迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8 / §12。
> **准入规则**：[规划规范](../../standards/planning.md)。

## 1. 阶段目标

1. **完成 caomei-ui P4**：迁移 Admin 用户 / OAuth 应用 / SSO 提供商 / 登录统计、`oauth/clients`、首页与错误页，以及剩余 `components/base/*` V1 封装。
2. **完成 P5 单库收尾**：移除 PrimeVue 运行时、依赖、Provider、`--p-*` / `.p-*` 与测试 mock，构建产物不再包含 PrimeVue 相关 chunk。
3. **建立 Admin 视觉基线**：Admin 页面首次进入视觉矩阵，覆盖浅色 / 暗色、桌面 / 移动与主要弹窗 / 筛选态；参考态从 P4 开工前提交新建分支采集后合并。
4. **保持质量门**：沿用阶段 3 的 `migration:check-budget`、视觉自基线、i18n 检查与单批回退策略。

## 2. 范围与非目标

### 2.1 本阶段范围

- P4 页面与组件：`pages/admin/{users,oauth/applications,sso/providers,logs}.vue`、`pages/oauth/clients.vue`、`pages/index.vue`、`error.vue`，以及对应 `components/admin/**` 与 `components/base/*`。
- P4 决策遗留：DataTable / Dialog / DatePicker / Toast / Confirm 的 caomei 适配；Admin 暗色主题（内容区背景、卡片、表格）。
- P5 依赖清理：`primevue`、`@primevue/*`、`@primeuix/*`、`primelocale`、`@primevue/forms`；`transpile` / `noExternal` / `nitro externals` 中的 PrimeVue 段；`--p-*` / `.p-*`；PrimeVue `<Toast />` / `<ConfirmDialog />`。
- 迁移护栏：路由白名单、导入守卫、视觉矩阵、包体预算、回退记录与文档同步。

### 2.2 非目标

- i18n 页面文案、邮件模板、`User.locale`、SEO / sitemap 放量（阶段 5）。
- UI 改版、交互重设计、DatePicker 时间选择扩展、PrimeVue 5.x 升级。
- 新功能（时区、注册控制、安全告警、多租户等）。
- 更改认证 / 数据库 schema 或 API 契约。

## 3. 阶段构成（2 条主线 / 15 条原子条目）

| 编号 | 条目 | 交付面 | 依赖 |
| :--- | :--- | :--- | :--- |
| M1 | P4-0 Admin 迁移基座与视觉矩阵 | DataTable / Dialog / Select 适配决策；Admin 浅色 / 暗色 token；Admin 视觉参考态与自基线；Admin 视觉夹具方案；白名单与守卫扩展 | 阶段 3 |
| M2 | P4-1 Admin 用户页 | `pages/admin/users.vue`，DataTable / 筛选 / 分页 / 选择 / 批量操作 | M1 |
| M3 | P4-2 Admin 用户对话框 | `components/admin/users/*`：创建、封禁、详情、会话 4 个对话框 | M2 |
| M4 | P4-3 Admin OAuth 应用页 | `pages/admin/oauth/applications.vue`，DataTable / 筛选 / 分页 | M1 |
| M5 | P4-4 Admin OAuth 对话框 | `components/admin/oauth/*`：创建、密钥、API 文档 3 个对话框 | M4 |
| M6 | P4-5 Admin SSO 提供商页 | `pages/admin/sso/providers.vue`，DataTable / 筛选 / 分页 | M1 |
| M7 | P4-6 Admin SSO 表单 | `components/admin/sso/*`：OIDC / SAML / 属性映射表单 | M6 |
| M8 | P4-7 Admin SSO 对话框 | `components/admin/sso/*`：创建 / 详情对话框 | M6 |
| M9 | P4-8 Admin 日志页与表格 | `pages/admin/logs.vue`、`components/admin/logs/logs-table.vue`、筛选与 DatePicker range | M1 |
| M10 | P4-9 Admin 日志统计组件 | `components/admin/logs/{stats-overview,period-stats,provider-stats,trend-chart}.vue` | M9 |
| M11 | P4-10 剩余页面与共享封装 | `pages/oauth/clients.vue`、`pages/index.vue`、`error.vue`、`components/base/*` V1 收口 | M1 |
| M12 | P4-11 P4 收口 | 白名单、包体、视觉、回退、文档；P4 交付摘要 | M2–M11 |
| M13 | P5-1 移除 PrimeVue 运行时与依赖 | 依赖、Provider、PrimeVue 导入、构建配置、测试 mock 来源切换 | M12 |
| M14 | P5-2 清理样式 / token / 白名单 | `--p-*` / `.p-*`、V1 封装删除、白名单文件删除、迁移守卫简化 | M13 |
| M15 | P5-3 阶段 4 收口与归档 | 最终包体、视觉、文档、Review Gate、归档 | M1–M14 |

> 单条超过 10 文件 / 800 行新增时，按页面内的对话框或统计组件拆条，并在提交说明与阶段登记中补记拆条依据。

> **进度**：M1（P4-0）已于 2026-11-10 完成，结论与证据见 [P4-0 决策记录](./2026-11-10-p4-0-decisions.md)；M2（P4-1）已于 2026-11-10 完成（页面迁移 + 自基线重采），下一批 P4-2（M3）。

> **M2 自基线口径修正**：P4-0 §8 第 5 条原定「M2 中间提交不更新自基线」，与 `pnpm test:visual` 阻塞门禁冲突（页面组件替换必然改变像素）。实际按阶段 3 惯例执行：页面迁移同批重采 `admin-users` 9 张自基线并归因（caomei DataTable / 按钮 / 输入控件替换 + Admin token 接管），M3 随对话框再重采一次；路由白名单仍只在整路由（页面 + 对话框）完成后登记。同时记录两处有意差异：分页器新增每页条数选择器；「会话管理」按钮由 PrimeVue `severity="info"`（蓝）改为 caomei `tone="primary"`（主色）。

## 4. 验收标准

- **P4**：所有登记页面不再出现 PrimeVue 模板标签或显式导入；Admin DataTable 的分页 / 排序 / 选择 / 空态 / 加载态 / 行操作与迁移前一致；Admin 暗色主题无硬编码浅色背景；Admin 视觉矩阵（浅色 / 暗色 × 桌面 / 移动 + 主要弹窗 / 筛选态）通过；路由白名单只登记已迁移路由。
- **P5**：`pnpm why primevue` 为空；无 `@primevue/*` / `@primeuix/*` / `primelocale` / `@primevue/forms`；构建产物无 PrimeVue / primeicons chunk；无 `--p-*` / `.p-*` 残留；测试 mock 不再依赖 PrimeVue。
- **全阶段**：`pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm migration:check-budget` / `pnpm test:visual` / `pnpm i18n:check` 通过；无未关闭 blocker 进入提交。
- **阶段 3 遗留**：M0-3 `release.yml` 定时发版验证在 2026-11-14 或手动 dispatch 后完成；不阻塞阶段 4 开发，但阻塞任何生产发布。

## 5. 依赖与风险

| 项 | 说明 |
| :--- | :--- |
| DataTable 差异 | PrimeVue `Column` 子节点 + `#body` 插槽与 caomei `columns` 数组 + `#cell-*` 插槽结构不同；分页 `first` ↔ `page`、排序 `1/-1` ↔ `asc/desc` 需统一封装与回归 |
| Admin 视觉夹具 | 现有视觉空库只预置 OAuth 客户端；Admin 页面需要管理员会话、用户 / 应用 / SSO / 日志数据，P4-0 必须确定确定性种子与管理员登录方案 |
| Admin 暗色主题 | `layouts/admin.vue` 与 Admin 页面存在硬编码浅色背景，需在 P4-0 定义 token 契约并逐页修正 |
| 包体预算 | P4 可能推高 `keyCss`；沿用 `keyCss ≤ +10%`，P5 后重新评估入口 JS / 总 CSS 预算 |
| P5 依赖面 | PrimeVue 仍在 `transpile` / `noExternal` / `internals.inline` 与测试 mock 中；M13–M14 必须同批清理，避免构建 / 运行时 ERR_MODULE_NOT_FOUND |
| 时间 | P4 4 个 Admin 页面 + 8k 行组件；若 P4 超出阶段容量，P5 可顺延为阶段 5，i18n 再顺延 |
| i18n 顺序 | Admin 文案必须等 P4/P5 完成后由阶段 5 接手，避免在同一批 Admin 文件上二次改写 |

## 6. 回退与视觉策略

- 每个 P4 批次独立提交、独立回退；路由回退采用「恢复页面 / 私有组件 + 移除白名单 + 定向测试」，不机械 revert 跨共享文件的旧提交。
- P5 依赖清理独立提交；回退时恢复 `package.json` / `pnpm-lock.yaml` 与构建配置中的 PrimeVue 段。
- 视觉参考态从 P4 开工前提交新建分支采集（参考态与迁移差异只来自 P4 本身），合并后入库；自基线按批次更新。
- 迁移不涉及数据库 schema、API 契约或存储格式，回退无需数据恢复。

## 7. 后续阶段

- **阶段 5：i18n 全量落地**（未登记）——非 Admin 页面文案、Admin 文案（P4/P5 后）、邮件模板 + `User.locale`、SEO / hreflang / sitemap、`en-US` 升 `seo-ready`。
- P5 若因 P4 体量顺延，阶段 5 编号与范围在阶段 4 收口时重新确认。
