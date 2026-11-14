# 产品 backlog（待办池）

> **状态**：阶段 5「i18n 全量落地与体验收口」已于 2026-11-14 授权启动（见 [阶段 5 范围登记](../design/governance/2026-11-14-phase5-registration.md)）；阶段 4 已于 2026-11-14 收口（见 [阶段 4 收口记录](../design/governance/2026-11-14-phase4-closure.md)）。本表只保留**尚未进入阶段**的候选；已上收条目（i18n 全量、§2.10 导航互联、i18n 扫描盲区、Admin 校验键直显、密码重置邮件链接）已移出本表。
> 准入、流转与归档规则见 [规划规范](../standards/planning.md)；阶段方向见 [roadmap.md](./roadmap.md)。

## 0. 候选阶段组合（建议，未授权）

> 仅用于范围评估，不构成启动授权，不分配阶段编号。每条候选的详情只在后文一处定义，本节只做组合索引。
> 原「组合 A：安全与质量收口」已作为阶段 2 完成并归档（2026-11-06），见 [已完成工作归档](../archive/completed-work.md)；本表不再保留。
> **组合 B 已全部上收**：i18n 非组件面在阶段 3 完成，页面文案 / 邮件 / `User.locale` / SEO 已作为阶段 5 启动，不再作为候选。caomei-ui P4/P5 已在阶段 4 完成（2026-11-14）。

### 组合 D：体验与性能

- 个人中心与授权应用 / 安全设置的互联跳转 → 已作为阶段 5 M10 启动，不再保留候选
- 时区设置 → [§2.2](#22-时区设置)
- 注册控制 → [§2.3](#23-注册控制)
- Admin 日志高级筛选 → [§2.4](#24-admin-日志高级筛选)
- 性能审计与优化 → [§2.5](#25-性能审计与优化)
- Demo 数据生成增强 → [§2.6](#26-demo-数据生成增强)

---

## 1. 专项子规划

暂无独立子规划候选。

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
- **迁入来源**：既有 backlog「安全审计常态化」「上游未修复依赖告警跟进」与原 `todo.md`「低优先级 · 安全审计工具集成」。

### 3.2 质量与测试

- **stylelint 18 升级与 `stylelint-config-cmyr` 解 pin**：阶段 4 为恢复样式门禁把 `stylelint-config-cmyr` 固定 1.0.0（1.1.0 要求 stylelint 18，当前 16 会报 unknown rule）。升级 stylelint 18 后恢复 `^1.0.0` 与共享配置默认规则。

- **测试覆盖率长期达标**：核心逻辑 Lines 覆盖率长期目标 ≥ 60%，2026-11-05 基线（75.95%）已达到；2026-11-06 阶段 2 复测 Statements 78.26% / Lines 78.49%，后续关注 `pages`（34.92%）与 `plugins`（25.00%）等未覆盖区域，不再以全局数字作为阶段门槛。
    - 阶段 2 按范围设下限并全部达标：`server/api` ≥95%（95.94%）、`composables` ≥80%（84.35%）、`components/base` ≥75%（90.11%），全局不跌破 75.74%。
    - 详见 [测试规范](../standards/testing.md)。
- **jscpd 重复代码检测**：引入代码重复率检测，目标全项目重复率降至 5% 以下。
- **Admin composable 泛型化**：`useDataTable<any>` 与 `selectedUsers: any[]` 收紧为 `AdminUser` / 表格行泛型，去掉 `pages/admin/users.vue` 的 `users.value as AdminUser[]` 断言（`use-application-management` 与 OAuth 页面已在 M5 完成泛型化，可作参照）。
- **caomei-ui DataTable 分页 / 排序能力补齐**：1.2.0 的 `CaomeiDataTable` 未透出 `CaomeiPaginator` 的 `showEdges`（迁移后首 / 末页按钮消失），且 `lazy` 只映射 `manualPagination`、未关闭客户端排序（未透出 `manualSorting`，当前页数据会被二次排序）。影响 `/admin/users`（M2）、`/admin/oauth/applications`（M4）与 `/admin/sso/providers`（M6）；`CaomeiDataTable` 的受控排序也不支持清除（空排序事件被忽略）。处理方向：向上游提能力需求，或在 P4 收口（M12）时确认接受并写入口径；不在页面内做临时绕过。
- **视觉层固定时钟导致对话框内 Select 的鼠标交互失败（测试环境限制，非产品缺陷）**：视觉用例调用 `page.clock.setFixedTime` 冻结 `Date.now()`，而 Vue 3.5 的事件 invoker 守卫是 `if (!e._vts) e._vts = Date.now(); else if (e._vts <= invoker.attached) return`。固定时钟下 `_vts` 与 `attached` 恒等，凡是传播路径上先有别的 Vue `pointerdown` 监听（`CaomeiDialog` 的 dismiss 层即是），后续 Select 触发器的监听就会被丢弃：对话框内用鼠标点 CaomeiSelect 无反应，键盘 Enter / Space 正常，页面级 Select（无前置监听）正常。真实时钟下已复测通过（/admin/users 禁用时长下拉可开、可选中「7 天」），因此不是产品缺陷，M3 / M5 对话框无需回改。处理方向：视觉交互态需要操作对话框内 Select 时用键盘打开（`focus()` + `press('Enter')`），或把交互用例切到 `clock.install()` / 真实时间（会牺牲日期确定性，`install()` 能否解除该守卫尚待验证）；`tests/visual/helpers` 的注释已写明该约束。
- **`pnpm lint:md` 的 glob 覆盖不到 `docs/design/governance/`**：`package.json` 的 `lint:md` 使用 `docs/**/*.md`，在未开 `globstar` 的 shell 中等价于 `docs/*/*.md`，`docs/design/governance/` 等三级以上目录没有 markdown 门禁，`--fix` 也修不到；2026-11-14 的 M8 修正记录因此曾漏过一处 `space-around-number`。处理方向：改为显式多层 glob（`docs/*.md docs/*/*.md docs/*/*/*.md`）或用 `bash -O globstar`。
- **视觉预算分级与允许清单**：P4 收口后评估 Admin 数据页（DataTable 密度 / 选择列 / 空态）的 `reader` / `admin` 分档与「区域 + 像素 + 归因 + owner」允许清单；P4-0 暂用统一阈值，避免在迁移期引入双重标准。
- **Admin 对话框视觉矩阵未覆盖内部滚动区**：视觉层只截整页首屏，SSO 创建对话框（900px 宽、内部滚动）的 OIDC / SAML / 属性映射配置段落在首屏之外，M7 迁移后自基线无像素变化，只能靠定向 Playwright 验收。处理方向：在矩阵中为长表单补充「滚动到指定分段后再截图」的交互态，或在 M12 收口时明确接受并写入口径。
- **caomei-ui FormItem 的必填语义与 label 可点击聚焦**：`CaomeiFormItem` 的 `required` 只渲染 `aria-hidden` 的 `*`，不向控件注入 `required` / `aria-required`；label 是 `<span aria-labelledby>`，点击标签不再聚焦输入框。M2 / M5 / M7 均沿用该约定，属于库级能力缺口。处理方向：向上游提能力需求（或由 FormItem 透传 `required` 语义），M12 收口时统一评估。
- **2FA / captcha / Toast 视觉覆盖**：为 2FA 弹窗、验证码启用态、提交中 / 提交成功 Toast 补充参考态与自基线；需已启用 2FA 的测试账号与 captcha provider。阶段 3 已登记为环境限制，M6-1 收口时迁入本候选（不再保留阶段编号）。
- **max-lines 基线清理**：消除历史遗留的 lint warning，逐步收紧 `eslint-plugin-max-lines` 基线。
    - 2026-11-11（P4-2）：`components/admin/users/user-detail-dialog.vue` 由 556 行增至 624 行，新增 1 条 `max-lines`（全仓 3 → 4 条）；详情视图与编辑表单待拆分。
- **错误信息取值 helper 去重**：`getErrorMessage(error, fallback)`（`error instanceof Error ? error.message : fallback`）目前在 `composables/admin/use-user-management.ts`、`use-application-management.ts` 与 4 个 Admin 用户对话框各有一份；P4 后续批次（M6–M8）会继续复制，迁移收口时提取到 `utils/shared/`。
- **Admin 用户对话框定向单测**：P4-2 后封禁时长换算（`0 → undefined` 永久）、详情弹窗动作可见性（自操作保护）、会话撤销仅由视觉层覆盖；建议在 M4 前补最小单测，锁定动作可见性条件。
- **API 参考文档同步**：M2-3 已覆盖 Zod 相关 API 文档；本条目只保留 `/api/admin/sso/providers` 系列补录（i18n 相关文档随阶段 5 M19 同步）。
- **迁入来源**：原 `todo.md`「低优先级 · 文档同步」与既有 backlog 质量类条目。

### 3.3 基础设施

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
