# P4-0 技术方案：Admin 数据页迁移基座

> **状态**：已执行（2026-11-10）；结论与证据见 [P4-0 决策记录](./2026-11-10-p4-0-decisions.md)。P4-0 只做技术验证、视觉基座与决策记录，不迁移生产页面。
> **关联**：[阶段 4 登记](./2026-11-10-phase4-registration.md)｜[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8.1 / §12｜[视觉参考态基座](./2026-11-08-visual-baseline-harness.md)｜[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)
> **执行前置**：阶段 3 已收口；`caomei-ui` 仍锁定 `1.2.0`；P4 开工前重新取一次 PrimeVue 用量与包体基线。

## 1. 目标与退出条件

P4-0 的目标是**在改第一个 Admin 页面前，把高风险差异验证清楚**：

1. 确认 `CaomeiDataTable` 能否承接现有 4 个 Admin 数据页的分页 / 排序 / 选择 / 懒加载 / 空态 / 行操作。
2. 确认 Dialog / Select / DatePicker / Toast / Confirm 的映射方式，形成统一迁移模式。
3. 建立 Admin 视觉参考态与自基线（含确定性数据与管理员会话）。
4. 定义 Admin 浅色 / 暗色 token 契约，修复 `layouts/admin.vue` 的硬编码浅色背景。
5. 扩展路由白名单、导入守卫与包体预算记录。

**退出条件**：

- DataTable spike 覆盖下表全部能力，结论为「直接使用 `CaomeiDataTable`」或明确「需要薄封装 / 上游缺口」。
- Admin 视觉矩阵可复现：固定账号、固定数据、固定容器，参考态与自基线各不少于 24 张。
- 暗色 token 契约落盘，Admin 布局与首个试点页面暗色无明显硬编码浅色残留。
- P4 批次清单、回退步骤与预算记录写入文档。
- 不满足以上任一项，不进入 P4-1。

## 2. 现状基线（P4 开工前复测）

| 指标 | 当前值 | 说明 |
| :--- | ---: | :--- |
| PrimeVue 组件族 / 开标签 / 文件 | 24 / 195 / 31 | 来自 `primevue-usage-snapshot.json`（2026-11-09 收口） |
| Admin 页面行数 | users 512、OAuth 应用 468、SSO 556、logs 109 | 不含组件；`components/admin/**` 约 8k 行 |
| 现有视觉矩阵 | 50 张（仅认证页） | Admin 页面尚无参考态 / 自基线 |
| 入口 CSS（`keyCss`） | 411,221 B | 基线 399,733 B；预算上限 439,706 B（+10%） |
| 入口 JS | 485,133 B | 仅记录，不设硬预算 |
| `caomei-ui` | 1.2.0 | 迁移期锁定，不自动升级 |

> P4-0 开工时重新执行 `pnpm migration:usage --json=docs/design/governance/primevue-usage-snapshot.json --quiet` 与 `pnpm migration:measure`，把当天值写入 P4 批次记录；不用阶段 3 数字直接判定 P4 增长。

## 3. 技术验证项

### 3.1 DataTable 映射（最高风险）

现有 Admin 页面通过 `components/base/table.vue`（PrimeVue `DataTable` 薄封装）使用 `<Column>` 子节点与 `#body` 插槽。caomei 的 `CaomeiDataTable` 使用 `columns` 数组 + `#cell-*` / `#header-*` 插槽，结构不同，不能机械替换。

**候选映射（需 spike 验证）**：

| PrimeVue / BaseTable | caomei `CaomeiDataTable` | 备注 |
| :--- | :--- | :--- |
| `:value` | `:data` | 行数组 |
| `:data-key` | `:row-key` | 选择 / 展开依赖稳定 key |
| `<Column field header sortable>` | `columns: [{ key, header, accessor, sortable }]` | `accessor` 支持点号路径 |
| `#body="{ data }"` | `#cell-{key}` 或 `cell` 函数 | 插槽优先于函数 |
| `#header`（表格工具栏） | 表格外层容器 | caomei 无同名工具栏插槽；标题 / 批量操作留在页面 |
| `#empty` | `#empty` 或 `empty-text` | 空态插画 / 按钮用 `#empty` |
| `selection-mode="multiple"` | `selection-mode="multiple"` | 同义 |
| `v-model:selection` | `:selection` + `@update:selection` | 受控选择 |
| `:first`（0 基） | `:page`（1 基） | 需统一 `page` / `first` 换算 |
| `:rows` / `:total-records` / `:lazy` | 同名 | `lazy` 时 `data` 不切片 |
| `:sort-field` / `:sort-order`（1/-1） | `:sort-field` / `sort-order`（`asc`/`desc`） | 事件 `@sort` 载荷不同 |
| `@page` | `@page` / `@update:page` | 核对 `page`、`rows`、`first`、`pageCount` |
| `striped-rows` | `striped` | 同义 |
| `responsive-layout="scroll"` | 外层 `overflow-x: auto` 或 CSS | caomei 无同名 prop |
| `paginator-template` / `current-page-report-template` | 内建分页器 | 需确认是否可定制「x 到 y 共 n 条」；不可定制则登记为有意差异 |

**Spike 用例**（不合并生产代码）：

- 以 `components/admin/users/user-sessions-dialog.vue`（小表）或一个临时 sandbox 页面为样本，接入 `CaomeiDataTable`。
- 覆盖：多选 + 全选、懒加载分页、排序、空态、加载态、行操作按钮、自定义单元格、`rowKey`。
- 对照当前 Admin 页面行为，记录差异；特别验证 `selection` 行对象与 `rowKey` 一致性、分页 `page` / `first` 换算、排序事件方向。
- 结论二选一：**直接使用**（推荐，除非重复代码明显）或 **薄封装**（仅当 3+ 页面重复同一套分页 / 排序 / 选择逻辑时）。

### 3.2 Dialog / 表单映射

| PrimeVue / V1 | caomei / V2 | 备注 |
| :--- | :--- | :--- |
| `BaseDialog`（`visible`） | `BaseDialogV2`（`open`） | 保留 V2 薄封装；`@update:open` → `@update:visible` |
| `Dialog` `width` / `breakpoints` | `CaomeiDialog` `size` / CSS | 需按内容宽度逐页确认 |
| `#footer` | `#footer` + `BaseDialogV2` 插槽 | 按钮改 `CaomeiButton` |
| `InputText` | `BaseInputV2` / `CaomeiInput` | 保留 label / error / aria 组合 |
| `Select` / `Dropdown` | `CaomeiSelect` | 选项类型与 `option-value` 映射需核对 |
| `Textarea` | `CaomeiTextarea` | 行高 / resize 差异 |
| `Checkbox` | `CaomeiCheckbox` | `v-model` 语义 |
| `Password` | `BasePasswordV2` | 显隐按钮 a11y |
| `InputNumber` | `CaomeiInputNumber` | 步进 / 空值 |
| `Badge` | `CaomeiTag` | tone / variant 映射 |
| `Avatar` | `CaomeiAvatar` | 图片失败回退 |
| `Menu` | `CaomeiMenu` / DropdownMenu | 批量操作菜单 |
| `Accordion` | `CaomeiAccordion` | SSO 表单分组 |
| `useToast` / `useConfirm` | `caomei-ui` 的 `useToast` / `useConfirm` | Admin composables 同批切换，导入守卫更新 |

### 3.3 DatePicker range（Admin logs）

- 从 PrimeVue `DatePicker` / 双输入改为 `CaomeiDatePicker selectionMode="range"`；模型类型按 `DatePickerRange` 处理。
- 1.2.0 无 `showClear` / `manualInput`；清空交互需用外部「清除」按钮或空值约定，P4-0 记录最终方案。
- 用 `@update:model-value` 触发筛选；注意 range 选择过程中的中间值，避免每次点击都请求。
- 时区 / 格式化沿用现有 `dayjs` 与页面约定，不在 P4 改业务语义。

### 3.4 Admin 暗色主题

`layouts/admin.vue` 当前存在 `background: #f8fafc`、`background: white` 等硬编码；Admin 页面 / 表格也有浅色覆盖。P4-0 需要：

1. 定义 Admin 内容区 token：`--admin-bg`、`--admin-surface`、`--admin-border`、`--admin-text`、`--admin-muted`，在 `:root` / `html.dark` 下取值。
2. 审计 `layouts/admin.vue` 与 4 个 Admin 页面的硬编码颜色，列出「P4-0 立即修 / 随页面批次修」。
3. 用暗色截图验证侧边栏、内容区、DataTable、Dialog、空态、分页器。
4. 不改变品牌色与现有浅色观感，只补齐暗色。

### 3.5 Admin 视觉矩阵与夹具

现有视觉空库只预置公开 OAuth 客户端；Admin 页面需要管理员会话与列表数据。P4-0 需要确定：

- **管理员账号**：优先在 `prepare-visual-db.mjs` 预置固定管理员（密码哈希用 better-auth 兼容方式生成）；若哈希方案不稳定，则在视觉 setup 中注册固定账号后用 SQL 更新 `user.role`，再刷新会话。两种方案在 spike 中择一，要求可重复、无外部依赖。
- **确定性数据**：至少 3 个用户、2 个 OAuth 应用、2 个 SSO Provider、10 条登录日志；固定 ID / 名称 / 时间，动态列用 `data-visual-mask`。
- **矩阵**（每层不少于 24 张）：

| 路由 | 场景 |
| :--- | :--- |
| `/admin/users` | 默认、选择行、创建用户、用户详情、封禁、会话 |
| `/admin/oauth/applications` | 默认、创建应用、密钥、API 文档 |
| `/admin/sso/providers` | 默认、创建、详情、OIDC、SAML、属性映射 |
| `/admin/logs` | 默认、筛选、日期范围、统计 / 趋势 |
| `/oauth/clients` | 默认 / 空态 |
| `/`、`/error` | 首页、404 / 错误态（如可稳定触发） |

- **参考态分支**：从 P4 开工前提交新建 `p4-visual-reference` 分支，安装视觉工具并构建采集；`git merge --no-ff` 回主分支。参考态不原地刷新。
- **自基线**：P4-0 采集当前 Admin 状态（与参考态同源），后续每批迁移后更新对应路由自基线。

### 3.6 白名单、守卫与回退

- `CAOMEI_UI_ROUTE_PREFIXES` 按已迁移路由逐条添加（`/admin/users`、`/admin/oauth/applications`、`/admin/sso/providers`、`/admin/logs`、`/oauth/clients`、`/`），不直接加 `/admin` 全域前缀。
- `migration:check-imports` 的 Toast / Confirm 来源守卫覆盖 `composables/admin/*` 与 Admin 组件；P4 批次切换后保持显式 import。
- 每批回退：恢复页面 / 私有组件 → 移除白名单条目 → 定向测试 + 视觉；P5 单独回退依赖与构建配置。
- `migration:check-budget` 继续使用 P0 基线；P4-0 记录当天 `keyCss`，P4 批次若接近 +10% 上限，先归因再继续。

## 4. P4-0 交付物

| 交付物 | 载体 |
| :--- | :--- |
| DataTable / Dialog / DatePicker 决策记录 | `docs/design/governance/2026-11-10-p4-0-decisions.md`（P4-0 执行后创建）或回写本文 |
| Admin 视觉参考态 + 自基线 | `tests/visual/reference/admin.*` + `tests/visual/__screenshots__/admin.*` |
| Admin 视觉矩阵与夹具 | `tests/visual/helpers/admin-matrix.ts`、`scripts/testing/prepare-visual-db.mjs` 扩展 |
| Admin 暗色 token 契约 | `styles/` + `layouts/admin.vue` 注释 / 变量 |
| DataTable spike | 临时分支 / sandbox，不合并；结论回写 |
| 白名单 / 守卫 / 预算记录 | `utils/shared/caomei-ui-migration.ts`、`scripts/migration/*`、P4 批次记录 |
| P4 批次清单与回退说明 | 本文 §3.6 + 阶段 4 登记 |

## 5. 执行顺序

1. 复测用量 / 包体，记录 P4 起点。
2. 创建 `p4-visual-reference` 分支，采集 Admin 参考态并合并。
3. 扩展视觉夹具与管理员会话；采集自基线。
4. DataTable spike（小表）→ 决策。
5. Dialog / DatePicker / Toast 映射 spike。
6. Admin 暗色 token + 布局修复。
7. 白名单 / 守卫 / 预算记录。
8. 输出 P4-0 决策记录与 P4-1 任务单。

## 6. 风险与待决问题

| 问题 | 处理 |
| :--- | :--- |
| caomei DataTable 分页器是否支持「x 到 y 共 n 条」定制 | spike 确认；不支持则登记有意差异，页面标题保留总数 |
| `responsiveLayout="scroll"` / 列宽 / 冻结列差异 | 外层 `overflow-x` + 固定列宽；逐表视觉登记 |
| 受控选择与 lazy 数据行对象一致性 | 强制 `rowKey`；选择只存 key 或完整行，需统一约定 |
| 管理员密码哈希方案 | P4-0 spike 二选一：预置哈希 / 注册后 SQL 提权 |
| Admin 暗色硬编码分散 | P4-0 先修布局与公共 token，页面级随批次修 |
| P4 包体增长 | 每批复测；`keyCss` 超 +10% 先归因，P5 后重设预算 |
| P5 与 i18n 顺序 | P5 完成后再进入阶段 5 i18n；Admin 文案不在 P4 修改 |
