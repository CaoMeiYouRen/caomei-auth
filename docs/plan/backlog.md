# 产品 backlog（待办池）

> **状态**：**阶段 2「安全收口与迁移预备」进行中**（2026-11-05 授权）。本表只保留**尚未进入当前阶段**的候选；阶段 2 已登记的条目见 [todo.md](./todo.md)，不再在本表重复。
> 准入、流转与归档规则见 [规划规范](../standards/planning.md)；阶段方向见 [roadmap.md](./roadmap.md)。

## 0. 候选阶段组合（建议，未授权）

> 仅用于范围评估，不构成启动授权，不分配阶段编号。每条候选的详情只在后文一处定义，本节只做组合索引。
> 原「组合 A：安全与质量收口」已于 2026-11-05 登记为阶段 2，见 [todo.md](./todo.md)；本表不再保留。

### 组合 B：i18n 全量落地

- i18n 全量落地（M2+ 正式翻译）→ [§1.2](#12-i18n-全量落地)

### 组合 C：组件库迁移到 caomei-ui

- 组件库迁移到 caomei-ui（P2+ 正式迁移）→ [§2.1](#21-组件库迁移到-caomei-ui)

### 组合 D：体验与性能

- 时区设置 → [§2.2](#22-时区设置)
- 注册控制 → [§2.3](#23-注册控制)
- Admin 日志高级筛选 → [§2.4](#24-admin-日志高级筛选)
- 性能审计与优化 → [§2.5](#25-性能审计与优化)
- Demo 数据生成增强 → [§2.6](#26-demo-数据生成增强)

---

## 1. 专项子规划

这些条目已有独立详细规划文档，在此作概要索引与候选状态登记。

### 1.1 Zod 后端迁移

_详情见 [zod-migration.md](./zod-migration.md)。_

**当前状态**：剩余 8 个 handlers 已登记到 **阶段 2 M2**，见 [todo.md](./todo.md)；本表不再保留候选条目。

### 1.2 i18n 全量落地

_详情见 [国际化实施方案](../standards/i18n.md) 与 [i18n 评估与实施方案](../design/governance/2026-11-05-i18n-evaluation.md)。_

- **状态**：评估完成，未落地。**M1 技术验证已登记阶段 2 M5**（见 [todo.md](./todo.md)）；M2+ 正式翻译仍为候选。`nuxt.config.ts` 未引入 Vue / Nuxt 侧 i18n 模块（如 `@nuxtjs/i18n`），无业务语言包；网页 UI、Meta、MJML 邮件与 API 错误消息仍以简体中文硬编码为主。现有 `better-auth-localization` 仅覆盖认证插件边界，`utils/shared/locale.ts` / `server/utils/locale.ts` 提供 locale 检测。
- **目标**：建立 `zh-CN` / `en-US` 全量翻译能力，覆盖 Web UI、邮件模板、API 响应、验证错误与通知；服务端与前端共享 Locale Registry。
- **里程碑**：M1 基础设施 → M2 核心链路 → M3 个人 / 安全 / OAuth / SSO → M4 Admin / 邮件 / API → M5 治理与 SEO。执行口径与验收见 [i18n.md](../standards/i18n.md) §8 / §10。
- **关键修订**：`@nuxtjs/i18n` v10（`lazy` 已移除）；模块化 `files[]` + Locale Registry + runtime loader；Zod v4 per-parse error map；服务端 `useTranslation(event)`；新增 `User.locale` 支持异步邮件；与组件库迁移建议先组件后 i18n。
- **风险**：`better-auth-localization` 的 `zh-Hans` / `zh-Hant` 标识需在认证层映射；SSR / SEO / Demo 模式兼容；PrimeVue / caomei-ui locale 需同步。
- **迁入来源**：原 `todo.md`「高优先级 · 多语言适配」；同时修正 [已完成工作归档](../archive/completed-work.md) 中“i18n 已完成”的错误表述。

---

## 2. 功能性需求（Feature Backlog）

### 2.1 组件库迁移到 caomei-ui

_评估与方案见 [caomei-ui 迁移评估](../design/governance/2026-11-05-caomei-ui-migration-evaluation.md)。_

- **状态**：评估完成，正式迁移未授权。**P0/P1 预备已登记阶段 2 M4**（见 [todo.md](./todo.md)）；P2+ 页面替换仍为候选。可行，建议分阶段；无整体性阻塞，但有两个决策项（DatePicker range、Toast 逐语气样式）。
- **目标**：用 `caomei-ui`（Vue 3 + Reka UI，当前 1.0.0）替换 PrimeVue 4 生态，统一设计 token、主题、暗色模式与组件行为。
- **现状**：项目依赖 `primevue` 4.x + `@primevue/*` + `@primeuix/*`；Dependabot 已锁定 v4 并阻止 v5 独立升级；31 个组件族 / 304 个开标签 / 52 个 `.vue`；无 `primeicons`；`--p-*` 仅 56 处（Toast）；已有 7 个 `components/base/*` 封装收敛改动。
- **分阶段建议**：P0 基线与护栏 → P1 接入基座 → P2 主题 / 封装 / 试点 → P3 表单 / 资料 / 安全 / 浮层 → P4 Admin 数据页与剩余页面 → P5 收尾卸载。不要从 admin 数据表开始。
- **验收要点**：无 PrimeVue 运行时依赖；受影响页面视觉与交互回归通过；主题 / 暗色模式一致；构建、类型检查与测试通过。
- **依赖与顺序**：建议组件迁移先行（至少完成基座与核心页），再做 i18n 页面文案；i18n 基础设施可并行，不要同时改同一批页面。
- **风险**：caomei-ui 1.0.0 的组件覆盖与 API 可能不完全等价；`DatePicker` 范围选择缺失；Toast 逐语气 token 缺失；DataTable 受控状态需回写；迁移面大，必须分批并保留回退路径。
- **上游反馈**：[caomei-ui#28](https://github.com/CaoMeiYouRen/caomei-ui/issues/28)（DatePicker range / Toast 主题 token / Paginator 报表 / DataTable 密度与选择列宽度）。

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

> **已登记阶段 2**：SSO 历史配置排查（M1-2）与 CodeQL #20 复核（M1-1）见 [todo.md](./todo.md)；本表不再保留为候选。

- **安全审计常态化**：将 `pnpm audit` 与 Dependabot / Code Scanning 告警巡检纳入固定流程，自动化依赖漏洞扫描与报告。
- **上游未修复依赖告警跟进**：`braces`（GHSA-vfj7-8cjw-p6xm，需 ≥3.0.4）与 `node-forge`（GHSA-86w9-cpqp-85rv，需 ≥1.4.1）当前均无已发布补丁版本，仅存在于构建 / 开发工具链。待上游发版后升级，并复查 `pnpm audit`。
- **迁入来源**：既有 backlog「安全审计常态化」「上游未修复依赖告警跟进」与原 `todo.md`「低优先级 · 安全审计工具集成」。

### 3.2 质量与测试

> **已登记阶段 2**：测试覆盖率第一阶段（M3）见 [todo.md](./todo.md)；本节保留 ≥60% 的长期目标，当前阶段先做到 ≥30% 或 +10pp。

- **测试覆盖率长期达标**：核心逻辑 Lines 覆盖率长期目标 ≥ 60%；阶段 2 先完成第一阶段（复测基线 + ≥30% 或 +10pp）。
    - 主要缺口：`server/api` (~1%)、`composables` (~5%)、`components` (~26%)
    - 详见 [测试规范](../standards/testing.md)。
- **jscpd 重复代码检测**：引入代码重复率检测，目标全项目重复率降至 5% 以下。
- **max-lines 基线清理**：消除历史遗留的 lint warning，逐步收紧 `eslint-plugin-max-lines` 基线。
- **API 参考文档同步**：M2-3 已覆盖 Zod 相关 API 文档；本节保留 i18n 迁移与 `/api/admin/sso/providers` 系列补录。
- **迁入来源**：原 `todo.md`「低优先级 · 文档同步」与既有 backlog 质量类条目。

### 3.3 基础设施

- **Dependency Cruiser 依赖图**：配置 `depcruise` 验证 `utils/shared` / `server/utils` / `utils/web` 分层约束。
- **SonarQube / Codecov 集成**：接入外部质量平台，持续追踪覆盖率与代码异味趋势。
- **Nx / Turborepo 调研**：评估分模块构建的可行性，提升超大项目构建速度。

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
