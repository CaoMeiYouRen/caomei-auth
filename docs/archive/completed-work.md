# 已完成工作归档 (Completed Work Archive)

本文档记录了项目已实现的关键技术升级、功能点及测试覆盖情况，作为项目发展的历史记录。

> **勘误（2026-11-05，2026-11-06 补充，2026-11-09 更新，2026-11-14 更新）**：本归档此前把 i18n 误记为已完成；截至 2026-11-06 仅完成 M1 基础设施与语言切换原型（阶段 2 M5）。其中 M2 前置（schema / 校验键 / 治理脚本）与认证类服务端错误试点已在阶段 3 完成（2026-11-09 收口，见 §9）；页面文案、邮件 / `User.locale` 与 SEO 已作为 [阶段 5](../design/governance/2026-11-14-phase5-registration.md) 启动（2026-11-14），未完成项不在本归档登记。

---

## 1. 基础设施与工具链 ✅

-   [x] **Vitest 测试体系**: 搭建完成，包含 `vitest.config.ts`、全局 Mock 环境及数据库测试夹具。
-   [x] **Zod 校验体系**: 引入 Zod 替代原生正则/命令式校验，`utils/shared/` 下的 Schema 前后端共用。
-   [x] **Composables 模式**: 核心表单逻辑已从页面文件迁移至 `useForm` 及业务 Composables。
-   [x] **CI/CD**: 配置 GitHub Actions 自动运行测试、代码检查及自动化发布。
-   [x] **ESLint max-lines 规则**: 600 行上限守卫，CI 阻断新增超标文件。

---

## 2. 核心功能点 ✅

-   [x] **SSO 单点登录**: 基于 Better-Auth 实现。
-   [x] **OAuth2.0 完整支持**: 包含客户端管理、授权确认流程。
-   [x] **多渠道登录**: 邮箱、手机号、验证码、第三方社交登录（GitHub, Google, Apple, Microsoft, Facebook, Twitter, Weibo, WeChat, Douyin, QQ, Discord 等）。
-   [x] **Admin 管理后台**: 用户管理、应用管理、日志统计、提供商管理功能完备。
-   [x] **演示模式 (Demo Mode)**: 实现数据库读写拦截与内存仿真数据生成。

---

## 3. 架构重构（G1 / G2 / G3）✅

### G1 · 副作用解耦

-   [x] **邮件模块 DI**: `server/utils/email.ts` 引入 `injectEmailDeps` / `resetEmailDeps`，复用 `utils/factory/mailer.ts`，可在测试中注入假实现。
-   [x] **短信模块解耦**: `server/utils/phone.ts` Provider 抽象完成，支持 Spug / Twilio 切换，限流逻辑下沉至纯函数。
-   [x] **登录流程 composable**: `pages/login.vue`（1076 → ~300 行）抽取 `useLoginFlow`，`pages/register.vue`（743 → ~300 行）抽取 `useRegisterFlow`。
-   [x] **安全设置 composable**: `pages/security.vue`（1109 → ~350 行）抽取 `useSecuritySettings`。
-   [x] **验证码逻辑拆分**: `utils/code.ts` 拆分为 `useOtpDispatcher`（UI）+ `createOtpService`（纯函数），支持依赖注入。

### G2 · 文件瘦身

-   [x] `pages/admin/oauth/applications.vue`（2121 → 拆分完成）
-   [x] `pages/admin/users.vue`（1868 → 拆分完成）
-   [x] `pages/admin/sso/providers.vue`（1753 → 拆分完成）
-   [x] `pages/profile.vue`（1199 → 拆分完成）
-   [x] `pages/admin/logs.vue`（1184 → 拆分完成）
-   [x] `server/utils/email-template.ts`（922 → 278 行）

### G3 · 复用率提升

-   [x] **基础组件库** (`components/base`): `StatusBadge`（CaomeiTag）、`BaseTooltip`、`LanguageSwitcher`、V2 表单 / 对话框封装（`BaseDialogV2` / `BaseInputV2` / `BasePasswordV2` / `BasePhoneInputV2`）；PrimeVue 版 V1 封装已在阶段 4 P5 删除。
-   [x] **通用 Composables** (`composables/core` + `composables/utils`): `useDataTable`、`useForm`、`usePageMeta`、`useStorage`；零消费者的 `useApi` / `useClipboard` / `useConfirmAction` / `useLogout` 已在阶段 4 P5 删除。
-   [x] **Zod 校验同构**: 前后端共用 `utils/shared/validators.ts` 中的 Schema，表单层与 API 层校验规则一致。
-   [x] **utils 分层**: `utils/shared/`、`utils/web/`、`server/utils/` 分层策略建立，单向依赖约束。
-   [x] **确认框收敛**: 移除冗余 `logout-confirm-dialog`、`delete-*-dialog` 等确认类组件，统一使用 `useConfirm()`（阶段 4 P5 后为 caomei-ui 实现）。

---

## 4. Zod 迁移 ✅

-   [x] **前端全量迁移**: 所有页面表单校验（登录/注册/忘记密码/快速登录/Admin 创建用户/OAuth 应用/SSO 提供商）已接入 Zod Schema。
-   [x] **后端全量迁移**: 14/14 参数校验 handlers 已接入 Zod（阶段 2 M2，2026-11-05 收口），覆盖请求体、路径参数与查询参数，参数错误统一返回 400。
-   [x] **迁移文档**: [zod-migration.md](./zod-migration.md) 已收口，无剩余迁移项。

---

## 5. 测试覆盖情况（进行中）

### 5.1 高覆盖率模块

-   **Composables**: `use-login-flow` (80%+)、`use-register-flow` (80%+)、`use-profile-flow` (100%)、`use-sso-login-flow` (100%)、`use-forgot-password-flow`、`use-security-settings`、`admin/use-user-management`。
-   **Server Utils**: `logger.ts`（全部日志分类）、`email/service.ts`（全部邮件发送方法）、`admin-role-sync.ts`、`phone.ts`（部分）。
-   **Middleware**: `3-demo-guard.ts`（完整覆盖）。

### 5.2 当前覆盖率（2026-11-06 阶段 2 复测）

-   Statements 78.26%（3637 / 4647）、Lines 78.49%（3529 / 4496）。
-   `server/api` 95.94%、`composables` 84.35%、`components/base` 90.11%，阶段 2 按范围设下限后全部达标。
-   主要缺口：`pages`（34.92%）、`plugins`（25.00%）。后续按价值补测，不再以全局数字作为阶段门槛，口径见 [覆盖率基线记录](../design/governance/2026-11-05-coverage-baseline.md)。

---

## 6. 文档体系 ✅

-   [x] `docs/plan/`: Roadmap + Todo + Backlog + Refactor（归档）规划体系；准入与归档规则见 [规划规范](../standards/planning.md)。
-   [x] `docs/standards/`: 开发规范、API 规范、测试规范、i18n 规范、Git 规范、安全规范、AI 协作规范等。
-   [x] `docs/design/`: 架构设计、数据库设计、UI/UX 设计、Demo 模式设计、AI 基建优化。
-   [x] `docs/usage/`: 入门指南、用户管理、App 集成、Demo 模式、FAQ、对比分析等。
-   [x] `docs/deployment/`: Docker、Vercel、Cloudflare、Node.js、数据库集成、监控集成（Google Analytics、Microsoft Clarity、Sentry）等。
-   [x] `docs/login-config/social/`: 14 个社交登录配置文档（GitHub, Google, Apple, Microsoft, Facebook, Twitter, Weibo, WeChat, Douyin, QQ, Discord 等）。

---

## 7. 安全加固与近期交付（2026-11 归档）

以下条目原登记在 `todo.md` 的「最近完成」段，2026-11-05 规划重整时迁入本归档。

-   [x] **OAuth 动态客户端注册加固**: 关闭 `/api/auth/oauth2/register`（`allowDynamicClientRegistration: false`），应用统一走管理端创建；中间件与 Demo 守卫改用 `normalizeAuthPath` 归一化路径，修复点段绕过与白名单前缀穿越（GHSA-2r7m-492j-p8xm）。
-   [x] **SSO 安全加固**: 关闭上游 `/sso/register` 等自助管理端点（`disabledPaths` + `providersLimit: 0` + 管理员校验兜底），修复 `trustEmailVerified` 账户接管风险（GHSA-785j-54p4-vxw9）。
-   [x] **Zod 后端迁移（第一阶段）**: 已完成 6 个 handlers；剩余 8 个见 [zod-migration.md](./zod-migration.md)。
-   [x] **Zod 前端迁移**: 全部页面表单校验接入 Zod Schema。
-   [x] **Composables 测试覆盖率提升**: `use-forgot-password-flow`、`use-security-settings`、`admin/use-user-management`。
-   [x] **Server Utils 测试**: `logger.ts`、`email/service.ts`、`admin-role-sync.ts`。
-   [x] **Middleware 测试**: `3-demo-guard.ts`。

---

## 8. 阶段 2 · 安全收口与迁移预备（2026-11-06 完成）

_2026-11-05 授权，2026-11-06 全部原子条目完成并归档；共 5 条主线 / 11 条原子条目，范围与验收见 [阶段 2 登记记录](../design/governance/2026-11-05-phase2-registration.md)。本阶段只做安全 / 质量收口与两条迁移的预备，未替换页面组件、未全量翻译。_

-   [x] **M1-1 CodeQL #20 复核与豁免处置**: 判定为误报并 dismiss；豁免登记为 `false-positive`，复核截止 2027-05-31，见 [复核记录](../design/governance/2026-11-05-codeql-20-review.md)。
-   [x] **M1-2 SSO 历史配置排查与安全台账复核**: 部署实例 SSO provider 0 条，`suspiciousProviders` / `suspiciousAccounts` 为空，无需清理与豁免，见 [排查记录](../design/governance/2026-11-06-sso-audit.md)。
-   [x] **M2-1 / M2-2 / M2-3 Zod 后端迁移收尾**: 14/14 参数校验 handlers 使用 Zod；补充 400 用例与 Schema 层单测；[zod-migration.md](./zod-migration.md) 与 API 文档同步。
-   [x] **M3-1 覆盖率基线复测与目标校准**: 基线 Statements 75.74% / Lines 75.95%；目标按范围设下限（全局不退化、`server/api` ≥95%、`composables` ≥80%、`components/base` ≥75%），见 [覆盖率基线记录](../design/governance/2026-11-05-coverage-baseline.md)。
-   [x] **M3-2 定向补测**: Statements 78.26% / Lines 78.49%；`server/api` 95.94%、`composables` 84.35%、`components/base` 90.11%，四个范围下限全部达标。
-   [x] **M4-1 caomei-ui 用量盘点与迁移预案**: 可复现的用量快照脚本（30 族 / 301 标签 / 50 文件）、路由白名单初值、`caomei-ui@1.0.0` 精确锁定 + Dependabot `ignore`、回退方案。
-   [x] **M4-2 caomei-ui 基座接入（P0/P1）**: `caomei-ui/nuxt` + `theme.css` + `data-preset="caomei"`，双库并存，零页面替换；`keyCss` +4.76%、入口 JS 0%，并新增导入守卫脚本。
-   [x] **M5-1 i18n M1 技术验证**: `@nuxtjs/i18n@10.6.0` + Locale Registry + detector + `prefix_except_default` + `useLocaleHead` + 语言切换原型，见 [i18n 技术验证](../design/governance/2026-11-05-i18n-verification.md)。
-   [x] **M5-2 Zod per-parse error map 验证**: 1 个表单 + 1 个 API 验证通过；i18n M2 准入结论为「有条件通过」，须先清理 schema 级中文 message。
-   [x] **阶段内附带修复**: Demo 数据填充中文用户名校验、登录社交按钮 SSR hydration、语言切换位置与暗色主题对比度、better-auth 1.7 PostgreSQL 数据迁移脚本（`database/postgres/2026-11-06-better-auth-1-7-oauth.sql`）。

---

## 9. 阶段 3 · caomei-ui P2–P3 迁移与 i18n 非组件面（2026-11-09 收口）

_2026-11-06 授权，2026-11-09 M6-1 收口；共 6 条主线 / 16 条原子条目 + M0 插队 4 条。交付、包体 / 用量复测、回退证据见 [阶段 3 收口记录](../design/governance/2026-11-09-phase3-closure.md)。**M0-3 `release.yml` 定时发版验证已移至 [backlog §3.3](../plan/backlog.md#33-基础设施)**。_

-   [x] **M0 发布链路（插队）**: `docker-build.yml` 复用工作流、`docker.yml` / `release.yml` / `docker-publish.yml` 接入；M0-1 / M0-2 / M0-4 已验证，M0-3 待定时发版验证。
-   [x] **M1 迁移准备与决策**: `caomei-ui@1.2.0` 基线（30 族 / 301 标签 / 50 文件，入口 JS 431,270 B、`keyCss` 399,733 B）；DatePicker range 与 Toast token 决策回写；视觉参考态基座与 50 张矩阵。
-   [x] **M2 登录页试点**: `/login` 整页切换 + 5 个 V2 薄封装；白名单登记；三 Tab / 校验 / 密码显隐 / 明暗 / 移动回归。
-   [x] **M3 认证入口**: `/register`、`/forgot-password`、`/change-password`、`/quick-login` 迁移；认证相关 6 个 composable 切 caomei Toast。
-   [x] **M4 个人 / 安全 / OAuth / SSO**: `/profile`（6 个展示组件 + 3 个对话框）、`/security`（2FA / 会话 / 绑定）、`/oauth/consent`、`/sso-login` 迁移；P3 认证面 PrimeVue 节点归零。
-   [x] **M5 i18n 非组件面**: 76 个 `validation.*` 键 + 17 个 `errors.*` 键 zh/en 同构；Zod 错误键与边界回退；5 个治理脚本 + CI / `lint-staged`；认证类 API `useTranslation` + `Content-Language` / `Vary`。
-   [x] **M6 阶段收口**: 白名单 9 条与页面 / 共享组件零 PrimeVue 校验；用量 24 族 / 195 标签 / 31 文件；入口 CSS +2.87%（预算 +10% 通过）并接入 `migration:check-budget`；视觉 50/50；回退 dry-run 与文档同步。
-   [x] **收口附带修复**: `useRegisterFlow` / `useForgotPasswordFlow` 绕过 `useValidationMessage` 导致页面显示原始校验键，已修复并复跑视觉 50/50。

---

## 10. 阶段 4 · caomei-ui P4 Admin 与 P5 单库收尾（2026-11-14 收口）

_2026-11-10 授权，2026-11-14 M1–M15 全部完成；共 15 条原子条目。收口记录见 [阶段 4 收口记录](../design/governance/2026-11-14-phase4-closure.md)，P4 交付摘要见 [P4 交付摘要](../design/governance/2026-11-14-p4-closure.md)。_

-   [x] **P4-0 基座**：`CaomeiDataTable` / `BaseDialogV2` / `CaomeiSelect` / `CaomeiDatePicker(range)` 决策与适配；`--admin-*` token；PrimeVue `darkModeSelector` 修复；Admin 视觉参考态与自基线 38 张；管理员会话与确定性夹具。
-   [x] **P4 页面迁移**：`/admin/users`、`/admin/oauth/applications`、`/admin/sso/providers`、`/admin/logs`、`/oauth/clients`、首页、错误页；对应 12 个对话框 / 表单 + 4 个统计组件 + 页头 / 表格；6 个路由白名单登记后已随 P5 删除。
-   [x] **P4 收口**：参考态 88 张差异按「P4-0 全局基座 / 逐批迁移 / 共享壳组件 / 夹具 / 认证桥接」归因；自基线 100 张 + 2 条 hover 对比度断言；包体与回退说明落盘。
-   [x] **P5 依赖清理**：移除 `primevue`、`@primevue/*`、`@primeuix/*`、`primelocale` 共 9 个依赖；删除 Provider / 主题预设 / 构建配置 / 测试 mock；入口 JS P4 起点 485,133 / P4 收口 417,394 → **343,374 B**，总 JS P4 起点 3,688,378 / P4 收口 3,977,764 → **2,162,010 B**。
-   [x] **P5 样式清理**：`--p-*` / `.p-*` / `:deep(.p-*)` 归零；删除 `admin-page-dark-theme` / SSO 死样式 / PrimeVue Toast 主题段；`keyCss` P0 基线 399,733 → **399,427 B**（低于 P0 基线）。
-   [x] **护栏终态**：`migration:check-imports`（toast / confirm 显式 import caomei-ui）与 `migration:check-budget` 保留；路由白名单模块删除；自基线 `test:visual` 102 passed 为唯一阻断视觉门禁。
-   [x] **附带修复**：共享分页 `update:rows` 旧事件导致越界请求（M9 Review Gate）、主题切换暗色分叉与 hover 对比度（M11 Review Gate）、显式浅色 + 系统深色的 token 覆盖（M13）。
-   [x] **遗留**：i18n 页面 / 邮件 / `User.locale` 交下一阶段（未授权）；`CaomeiDataTable` 能力、视觉固定时钟、i18n 扫描盲区、stylelint 18 升级保留 backlog。
