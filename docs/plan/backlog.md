# 产品 backlog（待办池）

> **状态**：阶段 6「质量门禁补齐、Admin 错误面与体验性能」已于 2026-11-16 授权启动（见 [阶段 6 范围登记](../design/governance/2026-11-16-phase6-registration.md)）；阶段 5 已于 2026-11-16 收口。本表只保留**尚未进入阶段**的候选与未完成项汇总；已上收条目（时区设置、注册控制、Admin 日志高级筛选、性能审计、Demo 数据、Admin 错误面与质量门禁相关项）已移出本表。
> 准入、流转与归档规则见 [规划规范](../standards/planning.md)；阶段方向见 [roadmap.md](./roadmap.md)。

---

## 1. 专项子规划

暂无独立子规划候选。

---

## 2. 功能性需求（Feature Backlog）

> 小节编号沿用历史：2.1 已随阶段 4（caomei-ui 迁移）交付、2.10 已随阶段 5 M10 交付，2.2 / 2.3 / 2.5 / 2.6 已上收阶段 6，编号不连续属预期。

### 2.4 Admin 日志登录事件与热力图

- **登录事件日志**：新增登录事件数据源（事件类型、结果、IP、UA），支撑按事件类型筛选与合规审计；需评估写入成本、保留期与索引。当前仅有 Session 实体，无事件表。
- **热力图**：按时间 × 事件类型的分布可视化（趋势图已交付，不再保留）。
- 独立 IP 精确筛选与统计联动已作为阶段 6 M16 上收；事件类型维度因无数据源未纳入本阶段。
- **迁入来源**：既有 backlog「Admin 日志可视化」与阶段 6 范围裁定（2026-11-16 用户确认收窄 M16）。

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

### 2.11 邮件链接重置（可选通道）

- **现状**：密码重置统一走验证码（邮箱 6 位码 300 秒 / 3 次尝试，短信同规格，均带 captcha 与 3 次/分限流）；`emailAndPassword.sendResetPassword` 已移除，`POST /api/auth/request-password-reset` 返回 `400 RESET_PASSWORD_DISABLED`，`/reset-password` 的白名单、限流与语言模块规则一并通过（2026-11-15，阶段 5 M5）。
- **重启条件**：出现「换设备 / 邮件客户端内一键完成」的明确需求，或外部集成方要求链接式重置；验证码通道仍保留，作为并列选项而非替代。
- **实现要点**：
    1. 恢复 `sendResetPassword` 回调与 `sendPasswordResetEmail` 模板（M15 后需按用户语言渲染两套邮件）。
    2. 新增 `/reset-password/[token]` 页面：路由 params 取 token，表单复用 `resetPasswordFormSchema`，提交 `authClient.resetPassword({ newPassword, token })`；过期 / 无效 token 给出独立提示。
    3. 客户端白名单 `middleware/auth.global.ts` 目前是 `pathname === path`，需改为前缀匹配（或新增 `publicPathPrefixes`），否则带 token 的路径会被拦到登录页；服务端中间件已是 `startsWith`。
    4. token 不随 GET 消费（`GET /api/auth/reset-password/:token` 只重定向），页面必须用 POST 消费，避免企业邮件网关预取把 token 用掉。
    5. 安全加固：`emailOTP.storeOTP` 切 `hashed`、`rateLimit.storage` 接 Redis（多实例下内存存储按实例计数）、重置成功后强制下线该用户全部会话。
    6. 补 i18n 键（`auth.resetPassword.*`）、视觉基线与单测（无效 token / 过期 / 弱密码 / 成功跳转）。
- **迁入来源**：阶段 5 M5 决策记录（2026-11-15 用户确认「验证码已足够，先下线邮件链接」）。

---

## 3. 技术债务（Tech Debt）

### 3.1 安全与合规

- **`docker-publish` 重建路径纳入安全告警门禁**：`mode=build` 会重新构建并推送生产镜像，但目前未执行 `scripts/security/check-alerts.mjs`；`retag` 复用已构建镜像，可按现状处理。待评估后决定是否在 `mode=build` 前增加 gate。
- **上游未修复依赖告警跟进**：`braces`（GHSA-vfj7-8cjw-p6xm，需 ≥3.0.4，lock 仍为 3.0.3）暂无已发布补丁版本，仅存在于构建 / 开发工具链；待上游发版后升级并复查 `pnpm audit`。`node-forge` 已升至 1.4.3（满足 GHSA-86w9-cpqp-85rv 的 ≥1.4.1），从本条移除。
- **迁入来源**：既有 backlog「上游未修复依赖告警跟进」与原 `todo.md`「低优先级 · 安全审计工具集成」（安全审计已由 `.github/workflows/security-auto-fix.yml` 每日巡检 + Dependabot 落地，不再作为候选）。

### 3.2 质量与测试

- **stylelint 18 升级与 `stylelint-config-cmyr` 解 pin**：阶段 4 为恢复样式门禁把 `stylelint-config-cmyr` 固定 1.0.0（1.1.0 要求 stylelint 18，当前 16 会报 unknown rule）。升级 stylelint 18 后恢复 `^1.0.0` 与共享配置默认规则。

- **测试覆盖率长期达标**：核心逻辑 Lines 覆盖率长期目标 ≥ 60%，2026-11-05 基线（75.95%）已达到；2026-11-06 阶段 2 复测 Statements 78.26% / Lines 78.49%，后续关注 `pages`（34.92%）与 `plugins`（25.00%）等未覆盖区域，不再以全局数字作为阶段门槛。
    - 阶段 2 按范围设下限并全部达标：`server/api` ≥95%（95.94%）、`composables` ≥80%（84.35%）、`components/base` ≥75%（90.11%），全局不跌破 75.74%。
    - 详见 [测试规范](../standards/testing.md)。
- **jscpd 重复代码检测**：引入代码重复率检测，目标全项目重复率降至 5% 以下。
- **Admin composable 泛型化**：`useDataTable<any>` 与 `selectedUsers: any[]` 收紧为 `AdminUser` / 表格行泛型，去掉 `pages/admin/users.vue` 的 `users.value as AdminUser[]` 断言（`use-application-management` 与 OAuth 页面已在 M5 完成泛型化，可作参照）。
- **caomei-ui DataTable 分页 / 排序能力补齐**：1.2.0 的 `CaomeiDataTable` 未透出 `CaomeiPaginator` 的 `showEdges`（迁移后首 / 末页按钮消失），且 `lazy` 只映射 `manualPagination`、未关闭客户端排序（未透出 `manualSorting`，当前页数据会被二次排序）。影响 `/admin/users`（M2）、`/admin/oauth/applications`（M4）与 `/admin/sso/providers`（M6）；`CaomeiDataTable` 的受控排序也不支持清除（空排序事件被忽略）。处理方向：向上游提能力需求，或明确接受并写入口径；不在页面内做临时绕过。
- **视觉层固定时钟导致对话框内 Select 的鼠标交互失败（测试环境限制，非产品缺陷）**：视觉用例调用 `page.clock.setFixedTime` 冻结 `Date.now()`，而 Vue 3.5 的事件 invoker 守卫是 `if (!e._vts) e._vts = Date.now(); else if (e._vts <= invoker.attached) return`。固定时钟下 `_vts` 与 `attached` 恒等，凡是传播路径上先有别的 Vue `pointerdown` 监听（`CaomeiDialog` 的 dismiss 层即是），后续 Select 触发器的监听就会被丢弃：对话框内用鼠标点 CaomeiSelect 无反应，键盘 Enter / Space 正常，页面级 Select（无前置监听）正常。真实时钟下已复测通过（/admin/users 禁用时长下拉可开、可选中「7 天」），因此不是产品缺陷，M3 / M5 对话框无需回改。处理方向：视觉交互态需要操作对话框内 Select 时用键盘打开（`focus()` + `press('Enter')`），或把交互用例切到 `clock.install()` / 真实时间（会牺牲日期确定性，`install()` 能否解除该守卫尚待验证）；`tests/visual/helpers` 的注释已写明该约束。
- **移动端安全页会话表逐字折行**：`session-table` 的 6 列 `flex: 1` + `word-break: break-all` + 100 px 固定操作列，在 390 px 视口下每列只剩约 12 px（掩码盒 12×116 即证据），日期换 locale 只把折行从 19 行降到 18 行。处理方向：移动端改为卡片式会话项，随本条移动端布局改造落地。
- **视觉矩阵补中间宽度（768 / 1024）**：当前只覆盖 1440 桌面与 390 移动，`flex-wrap` 类改造在平板宽度无回归保护（M10 的 `/profile` 头部即属此类）。
- **视觉基线对「低于阈值的纯色漂移」无感**：`visualExpect` 的 `threshold: 0.2` 允许单像素 YIQ delta ≤ 1,408.6，`#18181b` → `#1e1e1e` 的 delta 只有 16.6，逐像素判等，`maxDiffPixels: 200` 永不触发。P5-1（f91e6e4）换语言切换器 token 后，暗色基线直到 M4-2 因文案位移被迫重采才暴露。处理方向：为关键 token / 组件计算样式补断言（如 `--admin-surface`、`.language-switcher__trigger` 背景色），或在 token / 主题变更时按「全量暗色基线重采」写入门禁清单；`test:visual:update` 改为 `--update-snapshots=all` 并在报告中打印构建产物 SHA / 提交号，避免增量重采留下混合代基线。
- **视觉预算分级与允许清单**：评估 Admin 数据页（DataTable 密度 / 选择列 / 空态）的 `reader` / `admin` 分档与「区域 + 像素 + 归因 + owner」允许清单；P4-0 暂用统一阈值，避免在迁移期引入双重标准。
- **Admin 对话框视觉矩阵未覆盖内部滚动区**：视觉层只截整页首屏，SSO 创建对话框（900px 宽、内部滚动）的 OIDC / SAML / 属性映射配置段落在首屏之外，M7 迁移后自基线无像素变化，只能靠定向 Playwright 验收。处理方向：在矩阵中为长表单补充「滚动到指定分段后再截图」的交互态，或明确接受并写入口径。
- **caomei-ui FormItem 的必填语义与 label 可点击聚焦**：`CaomeiFormItem` 的 `required` 只渲染 `aria-hidden` 的 `*`，不向控件注入 `required` / `aria-required`；label 是 `<span aria-labelledby>`，点击标签不再聚焦输入框。M2 / M5 / M7 均沿用该约定，属于库级能力缺口。处理方向：向上游提能力需求（或由 FormItem 透传 `required` 语义），在上游补齐后统一评估。
- **2FA / captcha / Toast 视觉覆盖**：为 2FA 弹窗、验证码启用态、提交中 / 提交成功 Toast 补充参考态与自基线；需已启用 2FA 的测试账号与 captcha provider。阶段 3 已登记为环境限制，M6-1 收口时迁入本候选（不再保留阶段编号）。
- **max-lines 基线清理**：消除历史遗留的 lint warning，逐步收紧 `eslint-plugin-max-lines` 基线。
    - 2026-11-11（P4-2）：`components/admin/users/user-detail-dialog.vue` 由 556 行增至 624 行，新增 1 条 `max-lines`（全仓 3 → 4 条）；详情视图与编辑表单待拆分。
- **API 参考文档同步**：M2-3 已覆盖 Zod 相关 API 文档；本条目只保留 `/api/admin/sso/providers` 系列补录（i18n 相关文档已在阶段 5 M19 同步）。
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
