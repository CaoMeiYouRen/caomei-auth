# 产品 backlog（待办池）

> **状态**：**阶段 4「caomei-ui P4 Admin 与 P5 单库收尾」进行中**（2026-11-10 授权，见 [阶段 4 登记记录](../design/governance/2026-11-10-phase4-registration.md)）。本表只保留**尚未进入阶段**的候选；阶段 3 已于 2026-11-09 收口，M0-3 定时发版验证见 §3.3。
> 准入、流转与归档规则见 [规划规范](../standards/planning.md)；阶段方向见 [roadmap.md](./roadmap.md)。

## 0. 候选阶段组合（建议，未授权）

> 仅用于范围评估，不构成启动授权，不分配阶段编号。每条候选的详情只在后文一处定义，本节只做组合索引。
> 原「组合 A：安全与质量收口」已作为阶段 2 完成并归档（2026-11-06），见 [已完成工作归档](../archive/completed-work.md)；本表不再保留。
> **组合 B 已部分上收**：i18n 非组件面（M2 前置 + 服务端试点）已在阶段 3 完成（2026-11-09）；i18n 页面文案 / 邮件 / SEO 仍为阶段 5 候选。caomei-ui P4/P5 已在阶段 4 启动，不再作为候选。

### 组合 B：i18n 全量落地

- i18n 页面文案与邮件（M2 / M4 剩余，未授权）→ [§1.1](#11-i18n-全量落地)

### 组合 D：体验与性能

- 时区设置 → [§2.2](#22-时区设置)
- 注册控制 → [§2.3](#23-注册控制)
- Admin 日志高级筛选 → [§2.4](#24-admin-日志高级筛选)
- 性能审计与优化 → [§2.5](#25-性能审计与优化)
- Demo 数据生成增强 → [§2.6](#26-demo-数据生成增强)

---

## 1. 专项子规划（未完成）

这些条目已有独立详细规划文档，在此作概要索引与候选状态登记。

### 1.1 i18n 全量落地

_详情见 [国际化实施方案](../standards/i18n.md) 与 [i18n 评估与实施方案](../design/governance/2026-11-05-i18n-evaluation.md)。_

- **状态**：M1 技术验证已完成（阶段 2 M5，2026-11-06 归档）；**M2 前置（schema message / `validation.*` / 治理脚本）与认证类服务端错误试点已于阶段 3 完成（2026-11-09 收口）；i18n M2 页面文案、i18n M4 剩余（Admin 文案、邮件模板、`User.locale`、API 其余错误面）与 i18n M5 治理 / SEO 放量仍为候选，未授权**。已引入 `@nuxtjs/i18n` 并建立 Locale Registry、语言切换与 `validation.*` / `errors.*` 键，但页面业务文案仍以中文为主。
- **目标**：建立 `zh-CN` / `en-US` 全量翻译能力，覆盖 Web UI、邮件模板、API 响应、验证错误与通知；服务端与前端共享 Locale Registry。
- **里程碑**：M1 基础设施 → M2 核心链路 → M3 个人 / 安全 / OAuth / SSO → M4 Admin / 邮件 / API → M5 治理与 SEO。执行口径与验收见 [i18n.md](../standards/i18n.md) §8 / §10。
- **关键修订**：`@nuxtjs/i18n` v10（`lazy` 已移除）；模块化 `files[]` + Locale Registry + runtime loader；Zod v4 per-parse error map；服务端 `useTranslation(event)`；新增 `User.locale` 支持异步邮件；与组件库迁移建议先组件后 i18n。
- **风险**：`better-auth-localization` 的 `zh-Hans` / `zh-Hant` 标识需在认证层映射；SSR / SEO / Demo 模式兼容；PrimeVue / caomei-ui locale 需同步。
- **M2 前置条件**（[M1 技术验证](../design/governance/2026-11-05-i18n-verification.md) §6 结论为有条件通过）：
    1. ~~清理 74 处（评估口径）Schema 级中文 `message`，改为标准 Zod 消息或错误键~~（M5-1 完成）；
    2. ~~补齐 `validation.*` 全量错误键（`zh-CN` / `en-US` 同构）~~（M5-1 完成）；
    3. ~~引入 key parity / 缺词审计脚本（`scripts/i18n/audit-*.mjs`、`i18n:audit:*`）并接入 CI / lint-staged~~（M5-2 完成；`lint:i18n` / `test:i18n` 仍待 M5）；
    4. ~~组件迁移至少完成 P2 试点页，避免在 PrimeVue `label` / `value` 上写 `t()` 后被二次改写~~（阶段 3 P2–P3 已完成）；
    5. `en-US` 保持 `ui-ready`，key parity + 邮件 + SEO 回归后再升 `seo-ready`。
- **迁入来源**：原 `todo.md`「高优先级 · 多语言适配」与「未完成项汇总」小节（该小节已于 2026-11-06 移除，见 git 历史）；同时修正 [已完成工作归档](../archive/completed-work.md) 中“i18n 已完成”的错误表述。

---

## 2. 功能性需求（Feature Backlog）

### 2.2 时区设置

- 支持在界面展示用户所在时区的日期时间，并在服务端按用户时区格式化审计日志、会话时间与邮件时间。
- 需要统一时区来源（用户设置 > 浏览器时区 > 服务端默认）、存储格式与展示格式。
- **迁入来源**：原 `todo.md`「高优先级 · 时区设置」。

### 2.3 注册控制

- 支持邮箱域名黑白名单与手机号国家 / 地区黑名单配置。
- 需覆盖注册、邀请、第三方登录首次绑定等入口，并提供管理端配置与审计记录。

### 2.4 Admin 日志高级筛选

- 增加按 IP、按事件类型、按时间范围的筛选能力。
- 与「Admin 日志可视化」合并：筛选 + 趋势图 / 热力图作为同一候选，避免重复登记。
- **迁入来源**：原 `todo.md`「中优先级 · Admin 日志高级筛选」与既有 backlog「Admin 日志可视化」。

### 2.5 性能审计与优化

- 针对高频数据库查询（如 Session 校验）进行索引优化与缓存策略升级。
- 评估进程内 `lru-cache` 与 Redis 的边界；建立热点路径的基准测量与回归阈值。
- **迁入来源**：原 `todo.md`「中优先级 · 性能审计与优化」与既有 backlog「性能优化」。

### 2.6 Demo 数据生成增强

- 完善 `demo-data-generator.ts`，支持更真实的统计分布仿真，减少人工测试数据准备成本。
- **迁入来源**：原 `todo.md`「低优先级 · Demo 数据生成」与既有 backlog「Demo 数据仿真」。

### 2.7 开发者生态（长期方向）

- **轻量化 SDK（Web）**：提供 `auth-client` npm 包，封装登录 / 注册 / OAuth 流程，开箱即用。
- **轻量化 SDK（Node.js）**：服务端专用 SDK，支持 Headless 认证与 Token 管理。
- **文档中心自动化**：Swagger / OpenAPI 在线调试，API Playground。
- **插件 / 钩子系统**：在认证关键节点（`beforeAuth`、`afterLogin`、`beforeSessionCreate`）注入自定义逻辑。
- **社交登录扩展**：飞书、企业微信、钉钉（国内办公场景）。

### 2.8 安全增强（长期方向）

- **风险管控体系**：基于地理位置、设备指纹的登录风险评分与拦截。
- **安全告警系统**：异地登录、高频失败、异常 IP 的实时告警（邮件 / 钉钉 / 飞书）。
- **高级审计日志**：企业级合规审计日志导出（CSV / JSON），满足 SOC2 / ISO27001 要求。

### 2.9 企业级特性（长期方向）

- **多租户 SaaS**：单实例支持管理多个独立组织租户，租户数据隔离。
- **组织 / 部门管理**：多级组织架构、角色委派、权限矩阵。
- **LDAP / AD 集成**：与传统企业目录服务对接，支持同步企业用户。

---

## 3. 技术债务（Tech Debt）

### 3.1 安全与合规

- **`docker-publish` 重建路径纳入安全告警门禁**：`mode=build` 会重新构建并推送生产镜像，但目前未执行 `scripts/security/check-alerts.mjs`；`retag` 复用已构建镜像，可按现状处理。待评估后决定是否在 `mode=build` 前增加 gate。
- **安全审计常态化**：将 `pnpm audit` 与 Dependabot / Code Scanning 告警巡检纳入固定流程，自动化依赖漏洞扫描与报告。
- **上游未修复依赖告警跟进**：`braces`（GHSA-vfj7-8cjw-p6xm，需 ≥3.0.4）与 `node-forge`（GHSA-86w9-cpqp-85rv，需 ≥1.4.1）当前均无已发布补丁版本，仅存在于构建 / 开发工具链。待上游发版后升级，并复查 `pnpm audit`。
- **密码重置邮件链接缺页面**：`lib/auth.ts` 的 `sendResetPassword` 会把邮件链接指向 `/reset-password`，但仓库内没有该页面（`publicPaths` 与限流里都只有路径登记），点击后 404。当前实际可用的是忘记密码页的 OTP 重置流程；需决定补齐邮件链接页或移除该链路。
- **迁入来源**：既有 backlog「安全审计常态化」「上游未修复依赖告警跟进」与原 `todo.md`「低优先级 · 安全审计工具集成」。

### 3.2 质量与测试

- **测试覆盖率长期达标**：核心逻辑 Lines 覆盖率长期目标 ≥ 60%，2026-11-05 基线（75.95%）已达到；2026-11-06 阶段 2 复测 Statements 78.26% / Lines 78.49%，后续关注 `pages`（34.92%）与 `plugins`（25.00%）等未覆盖区域，不再以全局数字作为阶段门槛。
    - 阶段 2 按范围设下限并全部达标：`server/api` ≥95%（95.94%）、`composables` ≥80%（84.35%）、`components/base` ≥75%（90.11%），全局不跌破 75.74%。
    - 详见 [测试规范](../standards/testing.md)。
- **jscpd 重复代码检测**：引入代码重复率检测，目标全项目重复率降至 5% 以下。
- **Admin composable 泛型化**：`useDataTable<any>` 与 `selectedUsers: any[]` 收紧为 `AdminUser` / 表格行泛型，去掉 `pages/admin/users.vue` 的 `users.value as AdminUser[]` 断言（`use-application-management` 与 OAuth 页面已在 M5 完成泛型化，可作参照）。
- **caomei-ui DataTable 分页 / 排序能力补齐**：1.2.0 的 `CaomeiDataTable` 未透出 `CaomeiPaginator` 的 `showEdges`（迁移后首 / 末页按钮消失），且 `lazy` 只映射 `manualPagination`、未关闭客户端排序（未透出 `manualSorting`，当前页数据会被二次排序）。影响 `/admin/users`（M2）与 `/admin/oauth/applications`（M4）。处理方向：向上游提能力需求，或在 P4 收口（M12）时确认接受并写入口径；不在页面内做临时绕过。
- **视觉预算分级与允许清单**：P4 收口后评估 Admin 数据页（DataTable 密度 / 选择列 / 空态）的 `reader` / `admin` 分档与「区域 + 像素 + 归因 + owner」允许清单；P4-0 暂用统一阈值，避免在迁移期引入双重标准。
- **2FA / captcha / Toast 视觉覆盖**：为 2FA 弹窗、验证码启用态、提交中 / 提交成功 Toast 补充参考态与自基线；需已启用 2FA 的测试账号与 captcha provider。阶段 3 已登记为环境限制，M6-1 收口时迁入本候选（不再保留阶段编号）。
- **max-lines 基线清理**：消除历史遗留的 lint warning，逐步收紧 `eslint-plugin-max-lines` 基线。
    - 2026-11-11（P4-2）：`components/admin/users/user-detail-dialog.vue` 由 556 行增至 624 行，新增 1 条 `max-lines`（全仓 3 → 4 条）；详情视图与编辑表单待拆分。
- **错误信息取值 helper 去重**：`getErrorMessage(error, fallback)`（`error instanceof Error ? error.message : fallback`）目前在 `composables/admin/use-user-management.ts`、`use-application-management.ts` 与 4 个 Admin 用户对话框各有一份；P4 后续批次（M6–M8）会继续复制，迁移收口时提取到 `utils/shared/`。
- **Admin 用户对话框定向单测**：P4-2 后封禁时长换算（`0 → undefined` 永久）、详情弹窗动作可见性（自操作保护）、会话撤销仅由视觉层覆盖；建议在 M4 前补最小单测，锁定动作可见性条件。
- **i18n 硬编码扫描盲区：`<script setup>` 中的文案**：`scripts/i18n/lib/hardcoded-scan.mjs` 对 `.vue` 只扫描模板段，Admin 迁移把列头（`columns` 数组）、选项标签（`roleOptions` 等）移入脚本后不再计入基线。阶段 5（i18n 全量）启动前需扩展扫描面或在清单中显式说明，否则 Admin 文案清点会失真。
- **API 参考文档同步**：M2-3 已覆盖 Zod 相关 API 文档；本节保留 i18n 迁移与 `/api/admin/sso/providers` 系列补录。
- **迁入来源**：原 `todo.md`「低优先级 · 文档同步」与既有 backlog 质量类条目。

### 3.3 基础设施

- **阶段 3 遗留：`release.yml` 定时发版验证**：`release` 输出 tag → `docker` 复用工作流；保留 semver / latest / 日期 / `sha-*`。待 2026-11-14 20:00 UTC+8 定时或手动 dispatch 验证；通过后完成阶段 3 归档复核。
- **Dependency Cruiser 依赖图**：配置 `depcruise` 验证 `utils/shared` / `server/utils` / `utils/web` 分层约束。
- **SonarQube / Codecov 集成**：接入外部质量平台，持续追踪覆盖率与代码异味趋势。
- **Nx / Turborepo 调研**：评估分模块构建的可行性，提升超大项目构建速度。

### 3.4 UI 与主题

- **Demo 模式语言切换偏移验证**：`data-preset` / GitHub 角标与右上角语言切换共存时的偏移仅在 `NUXT_PUBLIC_DEMO_MODE=true` 下可见，需在 Demo 构建中补一次视觉确认。

---

## 4. 已否决 / 暂缓提案

记录曾被考虑但已否决或无限期延后的条目，避免重复讨论。

| 提案 | 结论 | 原因 |
|------|------|------|
| 使用 Valibot 替代 Zod | 暂缓 | Zod 已有成熟生态和大量迁移成本，暂不考虑替换。 |
| 引入 GraphQL | 否决 | 当前 REST API 复杂度不需要 GraphQL，增加维护负担。 |
| 微服务拆分 | 否决 | 项目规模未达到需要拆分的程度，增加运维复杂度。 |
| WebAuthn / FIDO2 支持 | 计划中 | 已在路线图中，暂无紧急需求排期。 |
| PrimeVue 5.x 升级 | 暂缓 | 先评估组件库迁移到 caomei-ui 的方向；在方向确定前维持 PrimeVue 4.x 锁定，避免跨 major 混装。 |
