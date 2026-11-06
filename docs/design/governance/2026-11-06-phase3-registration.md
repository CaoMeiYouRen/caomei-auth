# 2026-11-06 阶段 3 范围登记：caomei-ui P2–P3 迁移与 i18n 非组件面

> **状态**：已授权启动（2026-11-06 用户选择方向 A「组件库 P2–P3」，并补充「可以先处理组件之外的国际化」）。
> **单一事实源**：阶段范围与原子条目见 [todo.md](../../plan/todo.md)；交付摘要收口后归档至 [已完成工作归档](../../archive/completed-work.md)；候选详情见 [backlog.md](../../plan/backlog.md)；阶段方向见 [roadmap.md](../../plan/roadmap.md)。
> **准入规则**：[规划规范](../../standards/planning.md)。迁移批次依据 [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8；i18n 依据 [国际化实施方案](../../standards/i18n.md) §8。

## 1. 阶段目标

1. **启动 caomei-ui 正式替换（P2–P3）**：以登录页为试点完成整页切换，再按业务域迁移认证入口、个人、安全、OAuth 与 SSO 页面，每个路由整页切换、独立提交、独立回滚。
2. **并行推进 i18n 非组件面**：只处理与页面组件无文件交集的国际化前置与能力（Zod 错误本地化、校验错误键、治理脚本、服务端错误消息），不改 `.vue` 页面文案，避免与组件迁移在同一批文件上二次改写。

**排序依据**：迁移评估 §8.2 明确建议组件迁移先行；本阶段把 i18n 中不触碰页面的部分并行推进，既不违反该结论，也不阻塞后续 i18n M2。

## 2. 阶段构成（6 条主线 / 16 条原子条目）

| 主线 | 原子条目 | 交付面 |
| :--- | :--- | :--- |
| **M1 迁移准备与决策** | M1-1 用量快照复测、白名单与包体基线复核 | `pnpm migration:usage` 快照、`CAOMEI_UI_ROUTE_PREFIXES`、`keyCss` / 入口 JS 基线 |
| | M1-2 P2 视觉基线采集与差异清单（`/login`） | 浅色 / 暗色 × 桌面 / 移动 × 默认 / 校验错误 / 2FA / 验证码状态；差异清单 |
| | M1-3 DatePicker range 与 Toast 语气样式决策裁定 | 回写迁移评估 §6.3 / §7.3；更新 §12 上收条件 |
| **M2 P2 登录页试点** | M2-1 登录页整页迁移 + login 专用 V2 薄封装 | `pages/login.vue`、按需 V2 封装、白名单 `/login` |
| | M2-2 试点回归与白名单登记 | 测试 mock 改写、视觉差异归因、SSR / hydration、定向测试 |
| **M3 P3 认证入口页** | M3-1 注册页迁移 | `pages/register.vue` 及消费者封装 |
| | M3-2 忘记密码 / 重置密码 / 修改密码迁移 | `forgot-password.vue`、`change-password.vue` 及相关组件 |
| | M3-3 快速登录迁移与认证页 Toast / Confirm 切换 | `quick-login.vue`、认证相关 `useToast` / `useConfirm` 显式 import |
| **M4 P3 个人、安全、OAuth、SSO** | M4-1 个人资料页迁移 | `pages/profile.vue` 及消费者封装 |
| | M4-2 安全设置页迁移（2FA / 会话 / 账号绑定） | `pages/security.vue`；超阈值时按 2FA、会话、绑定拆条 |
| | M4-3 OAuth 同意页迁移 | `pages/oauth/consent.vue`（`oauth/clients` 仍在 P4） |
| | M4-4 SSO 登录页迁移 | `pages/sso-login.vue` |
| **M5 i18n 非组件面** | M5-1 Zod 错误本地化前置 | 移除 74 处（评估口径）schema 级中文 `message`；补齐 `validation.*` 全量键（`zh-CN` / `en-US` 同构） |
| | M5-2 i18n 治理脚本与门禁 | `scripts/i18n/audit-*.mjs`、`i18n:audit:*`、`i18n:check-*`、CI 与 `lint-staged` 接入 |
| | M5-3 服务端错误消息接入（认证类试点） | `errors.*` 键、`useTranslation(event)`、`Content-Language` / `Vary`；不可用时回退并登记 |
| **M6 阶段收口** | M6-1 批次收口与质量门 | 白名单、包体复测、迁移记录、文档同步、回退验证 |

## 3. 已裁定决策项

| 决策项 | 结论 | 理由与后续 |
| :--- | :--- | :--- |
| `DatePicker` 范围选择 | 采用**两个单日期选择器**（开始 / 结束），不保留 PrimeVue 例外 | 避免 P5 遗留双库例外；UX 微调纳入 P4 视觉差异登记；caomei-ui [#28](https://github.com/CaoMeiYouRen/caomei-ui/issues/28) 补齐 range 后可评估回并 |
| Toast 逐语气样式 | **接受 caomei-ui 默认语气样式**，登记为有意差异 | 成本最低且符合库设计路径；若业务坚持保留旧观感，再建薄封装并写明移除条件；上游补齐 token 后删除本地覆盖 |

## 4. 验收标准

- **M1**：用量快照可复现；白名单与包体基线与阶段 2 记录一致或有归因；P2 视觉基线覆盖矩阵，差异清单可逐项对照。
- **M2**：`/login` 无 PrimeVue 在册组件族残留；浅色 / 暗色视觉差异全部归因，「待修」清零；定向测试、SSR / hydration 通过；白名单只登记已迁移路由。
- **M3 / M4**：每个迁移路由内无两套组件混用；表单校验、提交、2FA、Toast / Confirm、OAuth 同意、SSO 登录行为与迁移前一致；a11y 与暗色通过；每批独立提交并可单独回滚。
- **M5**：0 处 schema 级中文 `message`；`validation.*` 键 parity 100%；审计脚本可运行并接入 CI / `lint-staged`；认证类 API 在 `en-US` 下返回英文错误并带 `Content-Language`，不可用时显式登记回退。
- **全阶段**：`pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` 通过；无未关闭 blocker 进入提交。

## 5. 依赖与风险

| 项 | 说明 |
| :--- | :--- |
| caomei-ui 版本 | 继续精确锁定 `1.0.0`，Dependabot `ignore` 生效；升级须人工批次并重跑回归 |
| 视觉基线 | 沿用 [P2 视觉基线方案](./2026-11-05-caomei-ui-p2-visual-baseline-plan.md)，不建截图回归工程；差异只登记结论 |
| DatePicker / Toast | 决策已裁定；上游 #28 仍 open，补齐后按登记条件评估回并或删除本地差异 |
| Toast / Confirm 双 Provider | 所有调用点显式 import 来源，`migration:check-imports` 守卫；禁止依赖自动导入 |
| 安全设置页体量 | 596 行，含 2FA / 会话 / 绑定；若超出原子条目阈值（10 文件 / 800 行新增）必须拆条 |
| i18n 服务端 | `useTranslation(event)` 属 experimental；若 Nuxt 4.6.3 下不稳定，保留中文兜底并登记，不阻塞组件迁移 |
| 混语言窗口 | 本阶段不翻译页面文案；`en-US` 下认证类 API 错误（试点；`useTranslation` 不可用时中文兜底并登记）与表单校验错误为英文，页面静态文案仍为中文。`en-US` 保持 `ui-ready`，不进入 sitemap / SEO 放量 |
| 并行冲突 | i18n 主线只改 `utils/shared`、`i18n/`、`scripts/`、`server/api`、`server/utils`，以及新增脚本所需的 `package.json`、`lint-staged` 与 `.github/workflows`；不改 `.vue` 页面文案 |

## 6. 明确不做

- P4 Admin 数据页与剩余页面迁移、P5 卸载 PrimeVue。
- 页面 / 组件文案翻译（i18n M2）、邮件模板与 `User.locale`（i18n M4）、SEO / sitemap 放量（i18n M5）。
- 时区设置、注册控制、Admin 日志高级筛选、性能审计、Demo 数据增强。
- UI 改版、交互重设计、PrimeVue 5.x 升级。
