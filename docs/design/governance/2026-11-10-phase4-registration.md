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

> **进度**：M1（P4-0）已于 2026-11-10 完成，结论与证据见 [P4-0 决策记录](./2026-11-10-p4-0-decisions.md)；M2（P4-1）已于 2026-11-10 完成（页面迁移 + 自基线重采）；M3（P4-2）已于 2026-11-11 完成（4 个用户对话框迁移 + 路由内 toast/confirm 切换 + `/admin/users` 白名单登记 + 自基线重采）；M4（P4-3）已于 2026-11-12 完成（OAuth 应用页迁移 + 自基线重采，对话框与白名单待 M5）；M5（P4-4）已于 2026-11-12 完成（3 个 OAuth 对话框迁移 + composable toast/confirm 切换 + `/admin/oauth/applications` 白名单登记 + 自基线重采）；M6（P4-5）已于 2026-11-12 完成（SSO 提供商页迁移 + 自基线重采，5 个 SSO 组件与白名单待 M7 / M8）；M7（P4-6）已于 2026-11-13 完成（3 个 SSO 表单迁移，对话框与白名单待 M8），下一批 P4-7（M8）。

> **M7 记录（P4-6 Admin SSO 表单，2026-11-13）**：
> 1. 迁移范围：`oidc-config-form`（`InputText` → `BaseInputV2`、`Password` → `BasePasswordV2`、`Checkbox` → `CaomeiCheckbox`）；`saml-config-form`（`InputText` → `BaseInputV2`、`Textarea` → `CaomeiFormItem` + `CaomeiTextarea`、`InputNumber` → `CaomeiFormItem` + `CaomeiInputNumber`）；`attribute-mapping-form`（6 个 `InputText` → `BaseInputV2`）。字段 id / placeholder / 条件渲染（SAML 专属 `firstName` / `lastName`）保持不变。
> 2. label / hint 由 `BaseInputV2` 与 `CaomeiFormItem` 统一承载（`aria-labelledby` / `aria-describedby` 自动关联），删除手写 `label` + `<small class="text-muted">`、`.form-group` 与硬编码色 `#e2e8f0` / `#4a5568` / `#718096`；分段容器改 `.config-section` + `--admin-*` token，标题色由 `--primary-color` 改用语义 token `--color-primary`（清掉 P4-0 §10 登记的 3 处残留）。
> 3. 有意差异：`required` 只做视觉必填标记（`CaomeiFormItem` 不向控件注入 `required`），与迁移前「标签后加 `*`」等价；`CaomeiInputNumber` 默认最大宽度 12rem 且带 +/- 步进按钮（原 `w-full`、PrimeVue `InputNumber` 默认无按钮）；密码显隐按钮由 `CaomeiPassword` 自带，语义等价于原 `toggle-mask` + `:feedback="false"`；分段节奏由 2rem 间距 / 2rem 内边距改为 1.5rem / 1.5rem、字段间距 1.5rem → 1.25rem（父容器 `.create-dialog .form-section` 的规则不再命中子组件根元素，改由各表单 `.config-section` 提供），随 M8 迁移对话框时统一两套节奏。
> 4. 取值口径：`CaomeiInputNumber` 的 `update:modelValue` 为 `number | null`，清空态回填 `0`，保持 `attributeConsumingServiceIndex` 恒为数字；作用域输入改为 `:model-value` + 单入口 `updateScopesInput`，保留原有「空格分隔 + 去空项」解析，避免 `v-model` 与显式监听重复触发。
> 5. 本批**未**迁移（M8 补齐）：`create-provider-dialog`（`BaseDialog` / `BaseFormGroup` / `Dropdown` / `BaseInput` / `Button` / PrimeVue toast）与 `provider-detail-dialog` 仍为 PrimeVue；`/admin/sso/providers` 未登记白名单。因此本批提交后该路由仍是「页面 + 3 个表单已迁移、对话框未迁移」的中间态，符合 P4-0 §7「白名单只在整路由完成后登记」。
> 6. i18n 硬编码基线：3 个文件均保持原值（`oidc-config-form` 13、`saml-config-form` 8、`attribute-mapping-form` 8 行），label / hint 移入组件属性后仍落在模板段，扫描口径不变。
> 7. 视觉：自基线 88 passed，`admin-sso` 7 个用例（4 默认态 + 3 对话框）无像素变化——OIDC / SAML 配置段位于对话框首屏之外，需在对话框内部滚动才能看到，首屏截图覆盖不到本批改动，故不触发重采。改用容器内临时 Playwright 验收（不提交）：OIDC 字段与 PKCE 勾选、SAML 切换后 `entryPoint` / `certificate`（`rows=8`）/ `signingKey` 渲染、SAML 专属映射字段显隐、索引字段「填 5 保留 / 清空回落 0」、分段标题色 `rgb(230, 57, 70)`、暗色下 label 对比度 > 3:1，并附浅色 OIDC / SAML 与暗色 OIDC 三张截图人工核对。该视觉矩阵盲区（对话框内部滚动区）已登记 backlog。
> 8. 未拆条说明：本批 3 个源文件 / +162 −194 行，未超「10 文件 / 800 行」阈值；3 个表单互不依赖，但同属 P4-6 原子条目，合批提交便于整体回退。
> 9. 门禁：`pnpm lint` 0 error / 25 warning、`lint:css` / `ai:check` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget`（keyCss 413,239 B，+3.38%，与 M6 持平）/ `test` 984 passed / `test:coverage` Statements 77.91% / `lint:duplicate`（310 clones）/ `test:visual` 88 passed 全部通过。
> 10. **Review Gate（Pass，standard）遗留**：
>     - RG-W1（已落账）：分段节奏变化已补入本记录 §3，两套节奏在 M8 迁移对话框时统一。
>     - RG-W2（转 M8 承接）：「空格分隔去空项」与「索引清空回落 0」当前仅有一次性容器内验收，无自动化断言；M8 迁移该对话框时补端到端用例锁定，本批不扩写测试文件。
>     - RG-S1（记录口径）：`samlConfig.attributeConsumingServiceIndex` 在 `ssoProviderFormSchema` 中仍为 `z.number().optional()`，表单入口清空即回填 `0`，`0` 与 `undefined` 在唯一消费方（JSON 存储）等价。
>     - RG-S2 / RG-S5（登记 backlog）：caomei-ui `FormItem` 的必填语义与 label 点击聚焦、`styles/_dark-mode.scss` 中 `.sso-provider-config` / `.provider-form` 死样式（与 `.config-section` 同名存在误命中风险），随 M8 触达该对话框或 M12 收口处理。
>     - RG-S3 / RG-S4（已处理）：步进按钮差异补入 §3；`boolean / number` 注释与本记录「首屏之外」措辞已更正。
>     - RG-S6（不改）：`CaomeiPassword` 默认 `autocomplete="current-password"` 与迁移前浏览器启发式行为一致，非回归。

> **M3 有意差异与口径**（详见 P4-0 决策记录 §7 与本节记录）：
> 1. 弹窗尺寸改用 caomei 档位：创建 `md`（480，原 500）、禁用 `sm`（360，原 400）、详情 `lg`（640，原 600）、会话 `lg` + `breakpoints` 放宽到 860（原 700，会话表 5 列需要）。
> 2. Toast / Confirm 由 PrimeVue `toast.add({ severity })` / `confirm.require({ accept })` 改为 caomei `toast.success|warning|danger({ title, description })` / `await confirm.open({ title, tone })`；`use-user-management` 作为路由内 composable 同批切换，`/admin/users` 才满足「整路由切齐」。
> 3. 禁用时长选项的「永久」由 `value: null` 改为 `value: 0`（`CaomeiSelect` 的选项值只接受字符串 / 数字），回传时仍按 `|| undefined` 省略 `banExpiresIn`，语义不变。
> 4. 确认框按钮文案沿用 caomei 默认「确定 / 取消」，未新增确认框文案；会话弹窗新增 1 条空态文案（「该用户当前没有活跃会话」），且 5 个列头文案由 `<Column header>` 移入 `<script setup>` 的 `columns` 数组（`hardcoded-scan` 只扫模板段，脚本段不计入）→ 硬编码基线 `components/admin/users/user-sessions-dialog.vue` 9 → 5 行的构成是「移出扫描面 5 行 + 新增空态 1 行」。该扫描盲区（`columns` / config 数组里的中文字面量）在阶段 5 i18n 全量前需一并处理。
> 5. `BaseStatusBadge`（PrimeVue `Tag`）仍在列表 / 详情内使用，是**页面自身组件树内**唯一残留的 PrimeVue 组件；布局级残留（`layouts/admin.vue` 的 `ThemeToggle` → PrimeVue `Button`）同样留在 M11「共享封装 V1 收口」一并处理。
> 6. **未拆条说明**：本批 13 个源文件 / 约 900 行改动，超过「单条 ≤10 文件 / 800 行」的默认粒度。不拆条的原因是该批次是 P4-0 §7 定义的「整路由切齐」判定点——页面（M2）之外的对话框、路由内 composable 的 toast/confirm 与白名单登记必须同批成立，拆开后任一提交都会留下「白名单已登记但仍有 PrimeVue 依赖」或「对话框已迁移但路由未登记」的中间态。
> 7. 封禁弹窗「禁用时长」由 `null` + 占位符改为 `value: 0` + 默认选中「永久」，首屏可见态变化（传参语义不变：`0 → undefined` 仍表示永久）；`CaomeiSelect` 的选项值只接受字符串 / 数字，无法保留 `null` 选项。
> 8. 修复（Review Gate RG-W1）：`pages/admin/users.vue` 此前未订阅 `UserDetailDialog` 的 `@view-sessions` / `@ban`，也未传 `current-user-id`，导致详情弹窗的「查看会话」「禁用用户」点击无效、自操作保护分支永不生效（缺失早于本批）。本批补上事件接线与 `currentUserId`（`useUserManagement` 新增同名 computed 导出）。

> **M3 视觉差异记录**（`pnpm test:visual` 88 passed；`pnpm test:visual:parity` 17 passed / 71 diff，参考态为 P4 开工前 `a6c8d3b` 原貌）：
> | 场景 | 差异 | 归因 |
> | :--- | :--- | :--- |
> | `admin-users` 创建用户对话框 | 弹窗宽度 500 → 480、标题栏 / 关闭按钮换 caomei、输入控件与按钮换 caomei、底部按钮行 token 化 | M3 对话框迁移，自基线已重采 |
> | `admin-users` 禁用用户对话框 | 宽度 400 → 360、文本域 / 下拉换 caomei、默认选中「永久」、按钮 tone=danger | 同上（含 §3 第 7 条的口径差异） |
> | `admin-users` 用户详情对话框 | 宽度 600 → 640、分节标题与动作按钮换 caomei、按钮换行方式变化（5 个动作单行排布） | 同上；`BaseStatusBadge`（PrimeVue Tag）整条色块为既有 V1 观感，M11 处理 |
> | `admin-users` 用户会话对话框 | 宽度 700 → 860（`breakpoints`）、表格换 `CaomeiDataTable`、列宽 / 表头 token 化、设备信息单行 | 同上 |
> | 其余 71 个用例 | 整页或弹窗大范围差异 | 参考态早于 P4-0 暗色 token、`darkModeSelector` 修复与 M2 页面迁移，属已登记迁移差异；参考态层需在 M12（P4 收口）整体重新采集基准后再逐项归因，非本批引入 |

> **M6 记录（P4-5 Admin SSO 提供商页，2026-11-12）**：
> 1. 页面结构迁移：`BaseTable` + `Column` → `CaomeiDataTable`（`columns` 数组 + `#cell-*`；`page + 1` 受控分页、`asc/desc` ↔ `1/-1`）；`Button` → `CaomeiButton`；`IconField` / `InputText` → `CaomeiInput`（`#prefix`）；两个 `Dropdown` → `CaomeiSelect`（`show-clear`，固定 9rem 宽）；`Badge` → `CaomeiTag`（`soft`，SAML `warning` / OIDC `primary`）；删除确认由 PrimeVue `confirm.require` 改为 `await confirm.open({ tone: 'danger' })`；表格工具条按 P4-0 §3.2 移到表格上方。
> 2. 布局统一：原「头部 / 筛选 / 列表」三张卡片 + 渐变底色 → 单卡片 + `--admin-*` token（与 `/admin/users`、`/admin/oauth/applications` 一致），标题 2rem → 1.5rem，删除 `@include dark-mode` 覆盖与 `:deep(.p-datatable*)` 样式。
> 3. 筛选值类型：`CaomeiSelect` 的选项值只接受字符串 / 数字，状态筛选由 `boolean` 改为 `'true'` / `'false'`（服务端 `ssoProvidersQuerySchema` 同名解析），空筛选不再发送 `type` / `enabled` 空参数；composable 同步泛型化 `useDataTable<AdminSsoProviderRow>`、`$fetch` 响应类型化并新增共享类型 `AdminSsoProviderRow`。composable 的 toast 仍在 PrimeVue（随 M8 切换）。
> 4. 本批**未**迁移（M7 / M8 补齐）：`components/admin/sso/*` 5 个组件（创建 / 编辑、OIDC / SAML / 属性映射表单、详情）仍为 PrimeVue；状态列继续使用 `BaseStatusBadge`（内部为 PrimeVue `Tag`，M3 / M4 同口径，M11 处理）；`/admin/sso/providers` 未登记白名单。
> 5. 有意差异：操作按钮 `v-tooltip` → `label`（`aria-label`）+ 原生 `title`（顺带修正迁移前 `:v-tooltip` 误绑定的禁用 / 启用提示）；受控排序不支持第三次点击清除（空排序事件被忽略，保持当前排序；迁移前会在清除时回落为 `desc`，口径更接近「不下发非法排序」）；协议类型 `Badge`（`info` / `warning`）→ `CaomeiTag`（`primary` / `warning`，soft）；空态由 `empty-message` 改 `empty-text`（迁移前即纯文本、无动作按钮）；分页器缺「x 到 y 共 n 条」报告与首 / 末页按钮（`CaomeiDataTable` 能力边界，与 M2 / M4 同口径，已登记 backlog）。
> 6. i18n 硬编码基线：页面 19 → 23 行（列头移入 `columns` 属扫描盲区、操作按钮 `label` / `title`、筛选 `aria-label`），composable 14 → 12 行（错误提示改 `errorMessage` helper、去掉重复文案）。
> 7. 单测：`use-sso-providers.spec.ts` 新增「按字符串筛选值查询类型与状态」「清空筛选后不带空参数」两条用例（共 6 passed），并把 provider 夹具补全为 `AdminSsoProviderRow`；同时消除 `handleRefreshProviders` 在筛选非空时的重复请求（筛选清空由 `watch` 承担，无筛选时才显式刷新）。
> 8. 视觉：自基线重采 7 张（4 个默认态 + 3 个对话框背景）；`pnpm test:visual` 88 passed；`pnpm test:visual:parity` 10 passed / 78 diff（较 M5 的 13 / 75 多 3 条，`admin-sso` 默认态由容差内变为超阈值；7 个 `admin-sso` 用例均属本批有意差异）。
> 9. 交互验证（容器内临时 Playwright，不提交）：状态筛选 → `enabled=false` 且只剩 1 行；清除筛选 → 请求不再携带 `enabled` 且恢复 2 行；每页条数 10 → 25 → `limit=25&page=0`；点击「创建时间」表头 → `sortField=createdAt&sortOrder=asc`；删除先取消 → 无 `DELETE`，再确认 → `DELETE` + 列表刷新、行数减 1。
> 10. 未拆条说明：本批 9 个非生成文件（页面、composable、类型、2 个测试、i18n 基线、3 份文档）+ 7 张自基线生成物，未超「10 文件 / 800 行」阈值；页面与 composable 不可拆分（筛选值类型、空参数口径与页面绑定同批成立）。
> 11. 门禁：`pnpm lint` 0 error / 25 warning、`lint:css` / `ai:check` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget`（keyCss 413,239 B，+3.38%）/ `test` 984 passed / `test:coverage` 约 77.9%（同状态多次运行有 ±0.1pp 抖动）/ `lint:duplicate`（310 clones）全部通过。

> **M5 记录（P4-4 Admin OAuth 对话框，2026-11-12）**：
> 1. 迁移范围（整路由切齐判定点）：`create-application-dialog`（`BaseDialog` → `BaseDialogV2` `size="lg"`、`BaseInput` / `InputText` → `BaseInputV2`、`BaseFormGroup` + `Textarea` / `Select` / `MultiSelect` → `CaomeiFormItem` + `CaomeiTextarea` / `CaomeiSelect` / `CaomeiMultiSelect`、`Button` → `CaomeiButton`）；`application-secret-dialog`（复制按钮 `CaomeiButton`、警告改 `CaomeiAlert` `warning`）；`api-docs-dialog`（`Accordion` → `CaomeiAccordion type="multiple"` + `CaomeiAccordionItem` `#trigger`、注意事项改 `CaomeiAlert` `danger`、4 个重复的端点块收敛为 `endpoints` 数据驱动）。
> 2. `use-application-management` 同批切换：`useToast` / `useConfirm` 改为显式 `caomei-ui` 来源；删除确认改 `await confirm.open({ title, description, confirmLabel: '删除', tone: 'danger' })`，toast 改 `success` / `danger({ title, description })`；同时按 M4 审计建议泛型化 `useDataTable<AdminOAuthApplicationRow>` 与 `$fetch` 响应类型，移除 `applications.value as ...` 断言。
> 3. 路由白名单登记 `/admin/oauth/applications`（`utils/shared/caomei-ui-migration.ts`），守卫测试同步：页面 + `components/admin/oauth` 3 个对话框进入「无 PrimeVue 标签 / 显式导入」断言，`/admin/oauth/applications` 从「P4 路由不在白名单内」用例移出并加入白名单断言。
> 4. 有意差异：创建对话框 600 → 640（`lg`）、API 文档 800 → 640（`lg`，长 JSON 横向滚动）；表单辅助说明改走 `CaomeiFormItem` 的 `hint`（`aria-describedby` 关联），不再手写 `small.helper-text`；注意事项 / 凭据警告改 `CaomeiAlert`（`danger` / `warning`）；`BaseInputV2` 新增可选 `hint` 透传（复用既有 FormItem 能力，未新增组件）；删除确认框改用 caomei 内建 `danger` 图标与默认按钮样式（原 `mdi mdi-alert-circle` + `rejectClass` / `acceptClass` 不再使用）。
> 5. i18n 硬编码基线（同批收紧）：`api-docs-dialog` 18 → 17、`create-application-dialog` 34 → 26、`application-secret-dialog` 4 → 6（新增两个复制按钮可访问名与警告分行）、`use-application-management` 12 → 11（确认框 `message` + `header` 合并为 `title` + `description`）。
> 6. 视觉：自基线重采 2 张（创建应用 / API 文档对话框）；`pnpm test:visual` 88 passed；`pnpm test:visual:parity` 13 passed / 75 diff（与 M4 同口径，2 个对话框用例仍属迁移差异）。
> 7. 定向验收（容器内临时 Playwright，不提交）：暗色下创建应用 → 密钥对话框显示 `client_id` / `client_secret`（32 位）、两个复制按钮可访问名正确、关闭后列表刷新出现新应用。单测覆盖：`toggleApplicationStatus` / `deleteApplication` 的 toast，以及确认框的「取消不删除」「确认后删除 + 刷新」两条分支（`confirm.open` 分别 `mockResolvedValueOnce(false / true)`，并断言取消时不发请求、确认后末次调用为列表刷新）。
> 8. 修正（Review Gate RG-B1）：本批一度给「联系邮箱」加了 `type="email"`，与「多个邮箱用逗号分隔」冲突——原生表单校验会在 `submit` 事件前拦下多邮箱，创建流程不可用。已删除该 `type`，恢复到迁移前的纯文本 + Zod 校验（`oauthApplicationFormSchema` 逐项校验邮箱格式）。同时补「取消不删除 / 确认删除」两条单测。
> 9. 未拆条说明：本批 16 个文件（8 个源文件 + 3 文档 + 2 测试 + i18n 清单 + 2 张自基线），超过「单条 ≤10 文件 / 800 行」默认粒度。不拆的理由与 M3 相同：这是 P4-0 §7 定义的「整路由切齐」判定点——页面已在 M4 迁移，对话框、路由内 composable 的 toast/confirm 与白名单登记必须同批成立，拆开任一段都会留下「白名单已登记但路由内仍有 PrimeVue 依赖」或「对话框已迁移但路由未登记」的中间态。
> 10. 门禁：`pnpm lint` 0 error / 25 warning、`lint:css` / `ai:check` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget`（keyCss 413,239 B，+3.38%）/ `test` 982 passed（含新增 2 条确认框用例）/ `test:coverage` 约 77.8%（同状态多次运行在 77.7–77.8% 间抖动） / `lint:duplicate`（306 clones）全部通过。

> **M4 记录（P4-3 Admin OAuth 应用页，2026-11-12）**：
> 1. 页面结构迁移：`BaseTable` + `Column` → `CaomeiDataTable`（`columns` 数组 + `#cell-*` 插槽；`page + 1` 受控分页、`asc/desc` ↔ `1/-1` 排序换算、`row-key="id"`）；`Button` → `CaomeiButton`；`IconField` / `InputText` → `CaomeiInput`（`#prefix` 放大镜）；`Avatar` → `CaomeiAvatar`（`square` / `lg`，失败回退应用名首字符）；`Tag` → `CaomeiTag`（`soft`）；表格工具条按 P4-0 §3.2「无 `#header` 插槽」移到表格上方。
> 2. 有意差异：分页器保留每页条数选择器，但**没有**「x 到 y 共 n 条」报告（总数保留在表格标题），且**缺失首 / 末页按钮**（`CaomeiDataTable` 1.2.0 未透出 `CaomeiPaginator` 的 `showEdges`，与 P4-0 §3.2「需要时显式开启」冲突，已登记 backlog 待上游透出或 M12 收口复核）；操作列的 PrimeVue `v-tooltip` 改为 `label`（`aria-label`）+ 原生 `title`；应用 Logo 由 `img` / PrimeVue `Avatar` 统一为 `CaomeiAvatar`。
> 3. 本批**未**迁移（M5 已补齐）：3 个对话框、`use-application-management` 的 toast / confirm 当时仍来自 PrimeVue（`ConfirmDialog` / `Toast` 仍由 `app.vue` 提供）；状态列继续使用 `BaseStatusBadge`（内部为 PrimeVue `Tag`，与 M3 同口径，M11 处理）；`/admin/oauth/applications` 未登记白名单，仍受「P4 路由不在白名单内」守卫约束。
> 4. 新增共享类型 `AdminOAuthApplicationRow`（`types/admin.ts`），字段对齐 `toAdminOAuthClientView`，供 M5 对话框复用；未改后端、API 契约或数据库。
> 5. i18n 硬编码基线 18 → 19 行：模板侧移除 5 行列头（移入 `<script setup>` 的 `columns`，`hardcoded-scan` 只扫模板段，属已登记扫描盲区）与 3 行 `v-tooltip`，新增搜索 `label` 1 行、刷新 `label` / `title` 2 行、3 个操作按钮各 `label` / `title` 6 行（-5，净 +1）。盲区清理仍由阶段 5 i18n 全量接手。
> 6. 视觉：自基线重采 5 张（`dark-mobile-default` 像素未变）；`pnpm test:visual` 88 passed；`pnpm test:visual:parity` 13 passed / 75 diff（较 M3 的 17 / 71 多 4 条，来自本页 4 个默认态由容差内变为超阈值），6 个 `admin-applications` 用例均为本批有意差异。
> 7. 交互验证（容器内临时 Playwright 用例，不提交）：初始 `sortField=createdAt&sortOrder=desc`；点击「应用名称」表头 → `name/asc`，再次点击 → `name/desc`；每页条数 10 → 25 触发 `limit=25&page=0`；搜索防抖后带 `search` 参数；「刷新」清空搜索并去掉 `search`。分页翻页未覆盖（夹具只有 3 个应用，不足以产生第二页），由 M12 收口时补测。
> 8. 已知差异（登记 backlog，M12 复核）：`CaomeiDataTable` 的 `lazy` 只映射 `manualPagination`，未关闭客户端排序（未透出 `manualSorting`），因此当前页 10 条仍会按 `sortField` 在客户端二次排序；`createdAt`（本地化日期串）实测与降序一致，`name` 自然序与 SQLite BINARY 排序存在边界差异。`/admin/users`（M2）同样受影响，非 M4 新引入。
> 9. 门禁：`pnpm lint` 0 error / 25 warning、`lint:css` / `ai:check` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget`（keyCss 413,239 B，+3.38%）/ `test` 980 passed / `test:coverage` 77.73% / `lint:duplicate`（306 clones）全部通过。

> **M2 自基线口径修正**：P4-0 §8 第 5 条原定「M2 中间提交不更新自基线」，与 `pnpm test:visual` 阻塞门禁冲突（页面组件替换必然改变像素）。实际按阶段 3 惯例执行：页面迁移同批重采 `admin-users` 9 张自基线并归因（caomei DataTable / 按钮 / 输入控件替换 + Admin token 接管），M3 随对话框再重采一次；路由白名单仍只在整路由（页面 + 对话框）完成后登记。同时记录三处有意差异：分页器保留每页条数选择器，但缺失「x 到 y 共 n 条」报告与首 / 末页按钮（`CaomeiDataTable` 未透出 `showEdges`，见 M4 记录 §2）；「会话管理」按钮由 PrimeVue `severity="info"`（蓝）改为 caomei `tone="primary"`（主色）。

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
