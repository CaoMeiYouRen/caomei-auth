# 2026-11-05 caomei-ui 迁移评估与方案（PrimeVue 4 → caomei-ui 1.2.0）

> **状态**：`proposal`（评估完成，**P0/P1 已于 2026-11-05 接入**；P2–P3 已于阶段 3 完成，P4/P5 已随 [阶段 4](./2026-11-10-phase4-registration.md) 完成（2026-11-14），PrimeVue 已下线）。**2026-11-08 按 caomei-ui 1.2.0 重新评估**，证据见 [1.2.0 复核记录](./2026-11-08-caomei-ui-1.2.0-revaluation.md)；caomei-ui 1.3.0 升级与 `CaomeiConfigProvider` locale 桥接已纳入 [阶段 5](./2026-11-14-phase5-registration.md) M1。本文只做评估与规划；后续批次是否上收由用户决策。
> **P1 落地记录**：[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md) §5（双库并存、包体复测、导入守卫）。
> **范围**：`caomei-auth` 主应用的 PrimeVue 4 组件、主题、图标、命令式 API、测试与构建接入面。
> **参考**：momei 迁移方案与第 67–71 阶段归档；dependfix M31 迁移记录；caomei-ui 1.2.0 文档与设计规范 §7。
> **关联**：[阶段 4 登记](./2026-11-10-phase4-registration.md)｜[i18n 评估](./2026-11-05-i18n-evaluation.md)｜[规划规范](../../standards/planning.md)
> **单一事实源**：执行口径（规划载体、i18n 目录 / 模块 / 里程碑 / 脚本 / 验收）以 [planning.md](../../standards/planning.md) 与 [i18n.md](../../standards/i18n.md) 为准；本文保留取证、取舍理由与迁移批次。

## 1. 结论摘要

**结论：可行，建议分阶段迁移；1.2.0 已消除 1.0.0 的两个主要阻塞，不存在整体性阻塞。**

- `caomei-auth` 的 PrimeVue 使用面显著小于 momei / dependfix：**31 个组件族 / 304 个开标签 / 52 个 `.vue` 文件**（2026-11-05 快照），且已有 `components/base/*` 薄封装收敛了输入、密码、电话、表格、弹窗与状态徽标。
- **无 `primeicons` 依赖**：图标统一使用 `@mdi/font`，迁移不涉及 629/556 处图标字符串替换（momei / dependfix 的主要工作量项在本项目不成立）。
- **`--p-*` token 仅 56 处 / 47 个唯一名 / 1 个文件**，且全部是 Toast 主题覆盖；组件级 `.p-*` 选择器 131 处 / 约 15 个文件。主题耦合远低于 momei。
- `caomei-ui` 已发布 **1.2.0（MIT，1.x 起遵循语义化版本）**，提供 `caomei-ui/nuxt`、`theme.css`、`resolver` 与内建 locale；其 **`caomei` 预设本身即由 caomei-auth 的 PrimeVue `AppPreset` 派生**，品牌色与主色阶可直接承接。
- **1.0.0 的两个主要缺口已在 1.1.0 / 1.2.0 补齐**（2026-11-08 复核）：
    1. **`DatePicker` 已支持 `selectionMode="range"`**（1.2.0）：`v-model` 为 `[Date, Date]` 闭区间；`components/admin/logs/logs-table.vue` 可直接迁移，不再需要双日期选择器或 PrimeVue 局部例外。限制：range 不支持 `showTime`（日志筛选只用日期，不受影响）、无 `showClear` / `manualInput` / `@date-select`，需改用 `@update:model-value`。
    2. **Toast 已提供逐语气覆盖钩子**（1.2.0）：`--caomei-toast-{primary|success|warning|danger}-{bg|border|text|shadow}` 共 16 个 token；现有 `success` / `warning` / `danger` 三档可直接映射，`info` / `secondary` / `contrast`（实际调用中仅 `info` 3 处）无专属钩子，统一按 `neutral` 默认处理并登记差异；宽度可映射，圆角 / 内边距 / 标题字号 / 描述色仍不可覆盖。
- **新增能力**：1.1.0 提供 `CaomeiForm` / `CaomeiFormItem` 组合层（无 rules 引擎，校验仍归 `useForm` + Zod）；1.1.0 新增 `data-density="touch"` 密度轴与 24px 命中区；1.2.0 新增 DataTable 密度与选择列宽度 token（无 `size` prop）。
- **推荐顺序**：先做「接入基座 + 视觉基线 + 基础封装 + 1–2 个试点页」，再按业务域分批；**不建议从 admin 数据表开始**。与 i18n 的关系见 §8.2：建议组件迁移先行（至少完成基座与核心页），再在最终组件标记上做文案替换，避免同一批页面二次改写。

## 2. 背景与迁移动因

| 项 | 事实（2026-11-05） |
| :--- | :--- |
| 当前依赖 | `primevue@^4.5.5`、`@primevue/nuxt-module@^4.5.5`、`@primevue/core`、`@primevue/forms`、`@primeuix/themes@^2.0.3`、`@primeuix/styles`、`@primeuix/styled`、`@primeuix/utils`、`primelocale@^2.6.2` |
| 迁移目标 | `caomei-ui@1.2.0`（精确锁定；2026-11-08 由 1.0.0 升级并复测 typecheck / build） |
| 许可证现状 | PrimeVue 4.x / PrimeUIX 2.x 为 MIT；PrimeVue 5.x 起转入 PrimeUI 商业许可，4.x 是 MIT 冻结分支 |
| 升级冻结 | `.github/dependabot.yml` 已按 `>=5.0.0` 屏蔽 PrimeVue / `@primevue/*` / `@primeuix/*` 的 major 升级，并合并 4.x minor/patch |
| 统一路线 | caomei-ui 的定位是替代多个下游项目中的 PrimeVue；momei 已完成第 67–69 阶段并进入 B3，dependfix 已完成 M31 全量迁移 |
| 迁移动因 | ① PrimeVue 4 不再获得 5.x 的安全与框架兼容更新；② 避免长期维护 `p-*` / `--p-*` / `@primevue/*` 与自建库双轨；③ 与 momei / dependfix 统一组件与主题契约 |

> 迁移动因与 momei 的 [PrimeVue 5 许可证变更评估](https://github.com/CaoMeiYouRen/momei/blob/master/docs/design/governance/2026-08-29-primevue-5-license-change-evaluation.md) 一致；本文不重复许可证分析，只记录 caomei-auth 的迁移面与批次。

## 3. 参考项目实证

| 项目 | 状态 / 规模 | 可复用经验 | 需注意的差异 |
| :--- | :--- | :--- | :--- |
| **momei** | 第 67–71 阶段轨迹（67–69 已归档，70 进行中）；`caomei-ui@1.0.0` 与 `primevue@4.5.5` 并存；2026-11-01 迁移方案 §3.10 复算剩余 PrimeVue **1,161 处 / 146 文件**；2026-11-03 backlog 记录 **1,094 处 / 52 个组件名**、`primeicons` 540 处、token 1,445 处 | 路由级白名单、整路由切换、三层视觉回归（单元 / E2E / 截图）、`--p-*` → `--caomei-*` 语义桥接、版本精确锁定 + Dependabot `ignore`、共享壳过渡组件、DataTable 受控状态回写 | momei 的图标、token、页面量远大于本项目；其「先试点再全量」与「不静默放行视觉差异」纪律可直接复用 |
| **dependfix** | M31 已于 2026-09-29 完成；23 个组件 / 417 个开标签 / 23 个 `.vue`；迁移后卸载 5 个 PrimeVue 依赖 | 一次性迁移可行；`TagSeverity` → `ComponentTone` 映射；`pi pi-*` 统一映射表；Drawer `visible` → `open` 桥接；e2e 选择器改写；DataTable 行分组 / 展开 / 多列排序缺口由库侧 0.3.0 补齐 | dependfix 无 `primeicons` 之外的复杂图标体系；其 DataTable 用量集中、页面数少，不能直接套用到本项目的 admin 多页场景 |
| **caomei-ui 1.2.0** | MIT；333 个导出（含组件、类型与工具），57 个组件目录（1.0.0 为 56）；`./theme.css`、`./nuxt`、`./resolver`、locale 子路径；Nuxt 4 模块；Node ≥22 | `caomei` 预设源即 caomei-auth；DataTable 支持 lazy / 分页 / 选择 / 排序 / 行分组 / 行展开 + 密度与选择列宽度 token；`DatePicker` 支持 range；Toast 逐语气 token；`CaomeiForm` / `CaomeiFormItem` 组合层；内建 locale；1.x 语义化版本承诺 | `DatePicker` range 不含时间、无 `multiple`；Paginator 无报表模板；DataTable 无 `size` prop（改用 CSS token）；Form 无 rules 引擎；图标体系仅调研 |

**核心教训**（来自 momei / dependfix 实测）：

1. **按路由整体切换**，禁止同一路由内按组件混用；用白名单 / 路由 scope 作为单一事实源。
2. **先建视觉基线再迁移**：截图差异必须逐项归因，不属于「有意差异」的变化不得静默出现。
3. **精确锁定 + Dependabot ignore**：精确版本不能阻止机器人在精确值上抬版；迁移期必须阻断静默升级。
4. **token 桥接不要放具名 `@layer`**：caomei-ui 基础层未分层且后加载，桥接写进 `@layer` 会被静默覆盖；应使用 `html:root` 一类更高特异性。
5. **Button / Tag 可见文案走默认插槽**：`CaomeiButton` 的 `label` 只映射 `aria-label`；`CaomeiTag` 没有 `value` prop。机械替换会得到无文案按钮 / 空标签，且类型检查不报错。
6. **DataTable 受控状态必须回写**：`multiSortMeta` / `expandedRows` / `selection` / `page` 不回写时，内建排序 / 展开 / 选择 / 翻页无效果。
7. **表单逻辑不迁移**：`CaomeiForm` / `CaomeiFormItem`（1.1.0 起提供）只承接布局与 aria 关联，无 rules 引擎；本项目继续使用 `useForm` + Zod，迁移批次内可用 `CaomeiFormItem` 替换 `BaseFormGroup`。

## 4. caomei-auth 现状盘点

### 4.1 依赖与集成方式

| 项 | 事实 |
| :--- | :--- |
| Nuxt 模块 | `@primevue/nuxt-module`（`nuxt.config.ts` `modules`） |
| 主题 | `definePreset(Lara, …)` 生成 `AppPreset`；primary `#e63946`、surface slate；`darkModeSelector: 'html.dark'` |
| locale | `primevue.options.locale = zh_CN`（`primelocale`） |
| 样式 | `normalize.css`、`@mdi/font`、`@/assets/iconfont.css`、`@/styles/_global.scss` |
| 暗色 | VueUse `useDark()` 在 `<html>` 上加 `.dark`，与 PrimeVue `html.dark` 一致 |
| 转译 / 内联 | `build.transpile` 与 `vite.ssr.noExternal` / `nitro.externals.inline` 显式列出 `@primevue/*`、`@primeuix/*` |
| 表单 | 自建 `useForm` + Zod 4.6.7；`@primevue/forms` 仅有依赖与 Nuxt 自动导入声明，**业务零使用**；`CaomeiForm` / `CaomeiFormItem` 1.1.0 起可用，但只做布局 / aria，不替代校验 |
| 图标 | `@mdi/font`（`mdi mdi-*`）；**无 `primeicons`** |

### 4.2 用量快照（2026-11-05）

统计口径：扫描 `.vue` 开标签，组件名取自 `node_modules/primevue/index.d.ts` 的默认导出，排除 `node_modules` / `.nuxt` / `.output` / `coverage` / `dist` / 报告目录；`logs` 仅跳过仓库根目录。数字会随代码演进失效，**每批开工前须重新取数**。

> **2026-11-05 起以脚本快照为唯一事实源**：`pnpm migration:usage --json=docs/design/governance/primevue-usage-snapshot.json`，结果与 P0 基线记录见 [caomei-ui P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)。下表为评估时的手工取数，二者差异 ≤3 处，不再逐项回填。

| 类别 | 计数 | 说明 |
| :--- | ---: | :--- |
| PrimeVue 组件族 | **31** | 见 §6 映射表 |
| 组件开标签 | **304** | 分布于 **52** 个 `.vue` |
| `Button` | 143 / 42 文件 | 最大热点；含大量 `label` / `icon` / `severity` / `text` / `outlined` |
| `InputText` | 37 / 14 文件 | 多经 `components/base/input.vue` 封装 |
| `Column` | 31 / 6 文件 | 4 个数据表 + 2 个日志表 |
| `Message` | 9 / 6 文件 | 部分可用 `Alert` 拆分 |
| `Dialog` | 8 / 6 文件 | 多数经 `BaseDialog` |
| `Select` + `Dropdown` | 6 + 5 | `Dropdown` 为 PrimeVue 4 的 Select 别名 |
| `Toast` | 4 | `app.vue` + 3 个页面 |
| `ConfirmDialog` | 1 | `app.vue` |
| `DatePicker` | 1 / 1 文件 | `selection-mode="range"`，见 §6.3 |
| 其他 | 其余 19 族 | Avatar / Badge / ButtonGroup / Checkbox / FileUpload / IconField / Image / InputIcon / InputNumber / Menu / MultiSelect / Password / TabPanel / TabView / Tag / Textarea / Accordion 四件套 |

补充指标：

| 指标 | 计数 |
| :--- | ---: |
| `useToast(` 文件 | 33 |
| `useConfirm(` 文件 | 7 |
| 显式 `from 'primevue/*'` 文件 | 41 |
| `vi.mock('primevue/*')` 测试文件 | 20 |
| 单测中的 `.p-*` 断言 | 34 处 / 7 个组件测试文件 |
| `--p-*` token | 56 处 / 47 唯一 / 1 文件（`styles/_theme.scss`，全部为 Toast） |
| `.p-*` 类选择器 | 131 处 / 约 15 文件 |
| `:deep(` | 23 处 |
| `tests/e2e` 中的 `.p-*` 断言 | 0（仅 1 个 API e2e spec） |

### 4.3 基础封装（迁移收敛点）

| 封装 | 内部 PrimeVue | 消费者 | 切换批次 / 方式 |
| :--- | :--- | :--- | :--- |
| `components/base/input.vue` | `InputText` | 多页面 / 表单 | 不全局切换；为已迁移路由建 `BaseInputV2`（或页面内直接用 `CaomeiInput`），V1 保留给未迁移路由 |
| `components/base/password.vue` | `Password` | 密码 / 安全设置 | 同上；P3 个人 / 安全批次再建 V2 |
| `components/base/phone-input.vue` | `Dropdown` + `InputText` | 注册 / 资料 / 安全 | 同上；P3 批次按消费者路由切换 |
| `components/base/base-dialog.vue` | `Dialog` + `Button` | 12+ 弹窗 | 不全局切换；P3 / P4 按弹窗所属路由建 V2，或直接改单个弹窗 |
| `components/base/table.vue` | `DataTable` | 4 个 admin 数据页 | 移到 **P4**，随数据页整页迁移 |
| `components/base/status-badge.vue` | `Tag` | 多处状态展示 | 不全局切换；P4 / P5 随消费者路由切换，或建 V2 |
| `components/base/form-group.vue` | 无 | 5 个表单页面 | 1.1.0 起可用 `CaomeiFormItem` 承接 label / hint / error / aria 关联；迁移批次内替换，`useForm` + Zod 校验逻辑不动 |

> **路由级隔离优先**：共享封装被多个路由消费，直接切到 caomei-ui 会让未登记白名单的路由提前混用两套库。因此 **P2 不全局替换共享封装**；需要 V2 时按消费者路由建立，未迁移路由继续用 V1，P5 再统一回收。`BaseTable` 只在 4 个 admin 数据页使用，直接放到 P4。

### 4.4 主题与暗色

- `caomei-ui` 的 **`caomei` 预设**已由 caomei-auth 的 `AppPreset` 与 `styles/_theme.scss` 派生（主色 `#e63946` / 暗色 `#ff6b6b`、surface slate、圆角归一化）。接入时设置 `<html data-preset="caomei">` 即可承接品牌色，不需要重建整套色阶。
- 暗色机制一致：caomei-ui 默认 `darkMode: 'class'`，识别 `.dark`；现有 `useDark()` 与 `html.dark` 可保留。
- **预期外观变化**（caomei-ui 设计规范 §5.1 已登记）：控件圆角 8px → 6px、暗色底 `#121212` → `#18181b`、`success` / `warning` / `danger` 取 PrimeVue primitive 500；迁移前必须采集视觉基线，逐项归因。
- **Toast 已从「唯一重耦合」降为「可收敛」**：`styles/_theme.scss` 定义了 56 个 `--p-toast-*`（宽度、圆角、各语气背景 / 边框 / 文字 / 阴影）。1.2.0 提供 16 个逐语气 token `--caomei-toast-{primary|success|warning|danger}-{bg|border|text|shadow}`，以及 `--caomei-toast-width` / `-offset` / `-z-index` / `-accent`。仍不可覆盖的是圆角、内边距、标题字号 / 字重、描述色，以及 `info` / `secondary` / `contrast` 三个旧语气（实际调用仅 `info` 3 处）。处理口径见 §7.3。

### 4.5 测试耦合

- 20 个 composable 测试文件 `vi.mock('primevue/usetoast')` / `vi.mock('primevue/useconfirm')`，以及 7 个 base 组件测试中的 `.p-*` 断言。迁移时需同步改写 mock 与选择器。
- `tests/e2e` 只有 1 个 API spec，无 UI e2e；相比 momei / dependfix，迁移的 e2e 改写面很小。
- 组件测试覆盖了 `base-dialog` / `input` / `password` / `phone-input` / `status-badge` / `table` / `send-code-button`，可作为第一批回归网。

### 4.6 与 i18n 的耦合

- PrimeVue 内建文案通过 `primevue.options.locale = zh_CN` 固定为中文；`app.vue` 无语言切换。
- 若先做 i18n，需要同时维护 PrimeVue `primelocale` 与 caomei-ui `CaomeiConfigProvider` 两套组件文案；若先做组件迁移，只需接 caomei-ui locale，再叠加应用 i18n。
- 详细评估与推荐顺序见 [i18n 评估](./2026-11-05-i18n-evaluation.md)。
- **表单布局层**：`CaomeiForm` / `CaomeiFormItem` 不提供 rules 引擎，校验仍由 `useForm` + Zod 承担；`FormItem` 只输出 `id` / `name` / `aria-labelledby` / `aria-describedby` / `invalid` 插槽作用域，适合替换 `BaseFormGroup`，不改变校验契约。

## 5. caomei-ui 能力面（1.2.0）

| 项 | 事实 |
| :--- | :--- |
| 版本 / 许可 | `1.2.0`；MIT；1.x 起语义化版本兼容承诺；Node ≥ 22 |
| 导出面 | `.` / `./theme.css` / `./nuxt` / `./resolver` / `./locale/<code>` / `./package.json` |
| 组件规模 | 57 个组件目录（1.0.0 为 56）；`dist/index.d.ts` 333 个导出（含组件、类型与工具）；1.1.0 新增 `CaomeiForm` / `CaomeiFormItem` |
| peer 依赖 | `vue@^3.5.0`、可选 `@nuxt/kit@^4.0.0`、`echarts@^6`、`vue-echarts@^8`、`md-editor-v3@^7` |
| 运行时依赖 | `reka-ui@2.10.4`、`@lucide/vue`、`@tanstack/vue-table@9.2.4`、`@internationalized/date@3.12.4`、`@vavt/cm-extension@^2` |
| Nuxt 模块 | `caomei-ui/nuxt`；自动导入组件 / composables；`injectStyles` 注入基础层；`theme` 覆盖 token；`darkMode: 'class' \| 'media' \| false` |
| 内建文案 | `zh-CN` / `en-US` 预注册；`zh-TW` / `ja-JP` / `ko-KR` / `es-ES` / `fr-FR` / `de-DE` / `ru-RU` / `pt-BR` 按需 `registerLocale` |
| DatePicker | 1.2.0 支持 `selectionMode="single" \| "range"`；range `v-model` 为 `[Date, Date]`，不支持 `showTime` / 秒 / 12 小时制；`multiple` 未实现 |
| Toast | 1.2.0 提供 16 个逐语气 token；`neutral` 沿用全局 token；圆角 / 内边距 / 标题字号 / 描述色无专属 token |
| DataTable | lazy / 分页 / 选择 / 单列与多列排序 / 行分组 / 可折叠分组 / 行展开 / 冻结列 / 列插槽；1.2.0 新增 `--caomei-data-table-cell-padding-block` / `-cell-padding-inline` / `-selection-column-width` / `-selection-cell-padding-inline`，无 `size` prop |
| 表单 | `CaomeiForm`（布局 + submit 编排）与 `CaomeiFormItem`（label / hint / error / aria 作用域）；无 rules 引擎 |
| 响应式 / a11y | 1.1.0 新增 `data-density="touch"` 密度轴（控件 36/44/52、字号 14/16/18）；P0 命中区 ≥ 24×24 |
| 已知缺口 | `DatePicker` range 不含时间、无 `multiple` / `showClear` / `manualInput`；Paginator 无 template / CurrentPageReport；DataTable 无 `size` prop；Toast 无圆角 / 内边距 / 描述色 token；图标体系仅调研；`ScrollPanel` / `Chips` 无对应组件（本项目未使用） |

> 逐组件精确映射以 caomei-ui [设计规范 §7](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/design-spec.md) 为唯一事实源；本文只登记本项目实际用到的映射与决策。

## 6. 逐组件映射（本项目实际用量）

### 6.1 直接替换 / 机械改写

| PrimeVue | caomei-ui | 本项目用量 | 关键改写 |
| :--- | :--- | ---: | :--- |
| `Button` | `CaomeiButton` | 143 | `severity` → `tone`；`text` → `variant="ghost"`；`outlined` → `variant="secondary"`；`label` → 默认插槽（可见文案）；纯图标用 `iconOnly` + `label`（aria-label） |
| `InputText` | `CaomeiInput` | 37 | `fluid` 删除（默认全宽）；`class="p-invalid"` → `:invalid`；`v-model` 同名 |
| `Password` | `CaomeiPassword` | 6 | `feedback` / `toggleMask` 同名；去掉 `.p-password-input` 深选择器 |
| `Textarea` | `CaomeiTextarea` | 5 | `autoResize` 同名；`fluid` 删除 |
| `Checkbox` | `CaomeiCheckbox` | 5 | `input-id` → `id`；数组模型同名；可点击控件是 `button.caomei-checkbox__control` |
| `Select` / `Dropdown` | `CaomeiSelect` | 6 + 5 | `option-label` → `optionLabel`；`option-value` → `optionValue`；`showClear` 同名；`filter` 无对应，改用 `AutoComplete`（本项目当前无 `filter` 用法） |
| `MultiSelect` | `CaomeiMultiSelect` | 1 | `option-label` → `optionLabel`；`options` 需对象数组 |
| `InputNumber` | `CaomeiInputNumber` | 1 | `useGrouping` 默认行为不同，需核对 |
| `Badge` | `CaomeiBadge` | 3 | `value` 同名可用；`severity` → `tone` |
| `Avatar` | `CaomeiAvatar` | 4 | `shape` / `size` 档位映射；`label` 同名 |
| `Tag` | `CaomeiTag` | 2 | **无 `value` prop**，可见文本写默认插槽；`severity` → `tone` |
| `Message` | `CaomeiMessage` / `CaomeiAlert` | 9 | 需要 live region 用 `Message`；内联常驻提示用 `Alert`；`severity` → `tone` |
| `Dialog` | `CaomeiDialog` | 8 | `visible` → `open`；`header` → `title`；`modal` 默认；`breakpoints` 同名；`@hide` 无对应，用 `@update:open` |
| `Toast` | `CaomeiToastProvider` + `useToast` | 4 | `toast.add` → `show({ tone, title, description, duration })`；在 `app.vue` 根部挂载一次 Provider，后代组件显式 import `useToast` |
| `ConfirmDialog` | `CaomeiConfirmDialog` + `useConfirm` | 1 | `confirm.require({...})` 回调 → `confirm()` Promise；显式 import `useConfirm` |
| `ButtonGroup` | `CaomeiButtonGroup` | 4 | 拼接容器同名；无功能 props |
| `DataTable` / `Column` | `CaomeiDataTable` | 3 + 31 | 列定义改为 `columns` 数组；列插槽 `#body` → `#cell-{key}`；`#header` → `#header-{key}`；`first` → `page`（1 基）；分页报表自渲染；受控状态需回写 |
| `FileUpload` | `CaomeiFileUpload` | 1 | `customUpload` / `uploader` 映射；`mode` / `maxFileSize` 同名 |
| `Image` | `CaomeiImage` | 1 | `preview` 同名；类名 `.caomei-image` |
| `Menu` | `CaomeiDropdownMenu` | 1 | `:model` + `popup` → 声明式 Trigger / Content；`toggle(event)` 改为 Trigger 本身 |

### 6.2 组合改写

| PrimeVue | caomei-ui | 本项目用量 | 改写要点 |
| :--- | :--- | ---: | :--- |
| `Accordion` + `AccordionPanel` + `AccordionHeader` + `AccordionContent` | `CaomeiAccordion` + `CaomeiAccordionItem` | 1 + 3 + 3 + 3 | 四件组合 → 两件；`v-model:value` → `v-model`；`multiple` → `type="multiple"`；`lazy` → `unmountOnHide`（默认相反）；面板 `header` → 条目 `title`，内容走默认插槽 |
| `TabView` + `TabPanel` | `CaomeiTabs` + `CaomeiTabList` + `CaomeiTabTrigger` + `CaomeiTabContent` | 1 + 3 | 索引 / `header` → 显式 `value` 标识；`lazy` → `unmountOnHide`；`header` 文本走 Trigger 默认插槽 |
| `IconField` + `InputIcon` | `CaomeiInput` 的 `#prefix` / `#suffix` | 4 + 4 | 不再需要两个包裹组件；图标放插槽 |

### 6.3 缺口与决策项

> 上游反馈：caomei-ui [#28](https://github.com/CaoMeiYouRen/caomei-ui/issues/28)（2026-11-05）汇总的 DatePicker range、Toast 主题 token、DataTable 密度 / 选择列宽度已在 **1.2.0** 落地；Paginator 报表模板与 DataTable `size` prop 维持现状。逐项复核见 [1.2.0 复核记录](./2026-11-08-caomei-ui-1.2.0-revaluation.md)。

| 缺口 | 本项目位置 | 1.2.0 状态 | 处理口径 |
| :--- | :--- | :--- | :--- |
| `DatePicker` range | `components/admin/logs/logs-table.vue` 1 处 | **已支持** `selectionMode="range"`；range 不含时间；无 `multiple` / `showClear` / `manualInput` / `@date-select` | 直接迁移 `CaomeiDatePicker`，`@date-select` 改 `@update:model-value`；清空依赖点击已选日期写回 `null` 或 `preventDeselect` 语义；UX 差异纳入 P4 视觉登记 |
| Toast 逐语气样式 | `styles/_theme.scss` 56 个 `--p-toast-*` | **部分支持**：4 个语气 × bg/border/text/shadow + width/offset/z-index/accent；无圆角 / 内边距 / 标题字号 / 描述色；`info` / `secondary` / `contrast` 无专属钩子 | 映射 `success` / `warning` / `danger` 三档；`info`（实际 3 处）走 `neutral` 默认；`secondary` / `contrast` 无调用点直接删除；圆角 / 间距差异登记为有意差异 |
| `CaomeiForm` / `CaomeiFormItem` | `components/base/form-group.vue`，5 个表单页 | **1.1.0 已提供**；无 rules 引擎 | 迁移批次内用 `CaomeiFormItem` 替换 `BaseFormGroup` 布局与 aria 关联；校验仍由 `useForm` + Zod 承担，不改 Schema |
| Paginator 报表模板 | `components/base/table.vue` `current-page-report-template` | 仍无 template / CurrentPageReport | 在分页器旁按 `page` / `itemsPerPage` / `total` 自渲染 |
| DataTable `size="small"` | 24 处 | **1.2.0 提供密度 token**（无 `size` prop） | 用 `--caomei-data-table-cell-padding-block` / `-cell-padding-inline` 页面级覆盖，逼近 `small`；登记像素差异 |
| DataTable 表头全选作用域 | `pages/admin/users.vue` `selection-mode="multiple"` | 不变：表头全选只作用当前页 | 核对业务是否需要跨页全选；需要则父级聚合 `selection` 或自建选择栏 |
| DataTable 选择列宽度 | `pages/admin/users.vue` | **1.2.0 提供** `--caomei-data-table-selection-column-width` / `-selection-cell-padding-inline` | 设 token 对齐 PrimeVue 的 52px，视觉基线复核 |

**2026-11-08 裁定（替代 2026-11-06 版本）**：

- **DatePicker range**：采用 **`CaomeiDatePicker selection-mode="range"`**，不保留 PrimeVue 局部例外，也不再用双日期选择器。迁移点：`@date-select` → `@update:model-value`；`show-clear` / `manual-input` 无对应，清空改用重新选择或 `preventDeselect` 语义；差异登记在 P4。
- **Toast 逐语气样式**：采用 **token 映射**（`success` / `warning` / `danger` 的 bg / border / text / shadow），`info` 走默认 `neutral`；不建薄封装。圆角 / 内边距 / 标题字号 / 描述色差异接受并登记；上游后续补齐再收敛。
- **表单布局**：`CaomeiFormItem` 可用于已迁移路由，`CaomeiForm` 仅在需要原生 submit 编排时使用；**不改 `useForm` + Zod**。
- **DataTable 密度**：用 1.2.0 的 padding / selection width token 覆盖，不等待 `size` prop。

## 7. 主题与 token 迁移

### 7.1 品牌预设

- 接入时设置 `<html data-preset="caomei">`（`app.head.htmlAttrs`），直接使用 caomei-ui 已派生的 `caomei` 预设。
- `nuxt.config.ts` 的 `caomeiUI.theme` 仅用于**项目级覆盖**（如需要保留旧圆角 / 暗色底），不要重复声明整套色阶；预设已是品牌源。
- `theme.css` 通过 `caomei-ui/nuxt` 的 `injectStyles: true` 注入；**基础层注入点唯一**（模块 / resolver / 显式 import 三选一）。

### 7.2 `--p-*` / `.p-*` 清理

- `--p-*` 全部在 `styles/_theme.scss` 的 Toast 段；随 Toast 迁移删除，按 §7.3 映射为 `--caomei-toast-{tone}-{bg|border|text|shadow}`，宽度用 `--caomei-toast-width`。
- `.p-*` 选择器 131 处 / 约 15 文件，集中在 `styles/_dark-mode.scss`、`styles/_form.scss`、`styles/_theme.scss` 与 base 封装；**只在该路由整页迁移时删除**，不做跨批提前清理。
- 若迁移期需要 token 并存桥接，参考 momei：`--p-*` → `--caomei-*` 写在 `html:root`（unlayered，特异性高于库侧 `:root`），不要放进 `@layer`。

### 7.3 Toast 决策建议

1. **token 映射（采用）**：4 个语义语气用 `--caomei-toast-{primary|success|warning|danger}-{bg|border|text|shadow}` 承接现有颜色；`info` 走 `neutral` 默认；宽度用 `--caomei-toast-width`。不建薄封装。
2. **接受的残余差异**：圆角（8px → `--caomei-radius-md`）、内边距、标题字号 / 字重、描述色不可覆盖，纳入有意差异；`secondary` / `contrast` 两套旧语气无调用点，直接删除。
3. 若后续业务要求 100% 还原，再评估薄封装 `AppToast`；封装必须写明移除条件。上游继续补齐圆角 / 间距 token 时删除本地覆盖。

> **2026-11-08 裁定**：采用第 1 项。1.2.0 的 16 个 token 已覆盖现有 `success` / `warning` / `danger` 的实际用色；`info` 仅 3 处，走中性默认。第 2 项残余差异登记为有意差异，不阻塞 P2。

## 8. 分阶段实施计划

### 8.1 批次

| 批次 | 范围 | 产出 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| **P0 基线与护栏** | 用量脚本 / 视觉基线 / 路由白名单 / 版本锁定 / 回退方案 | 可复现的用量快照；浅色 + 暗色截图基线（登录、注册、个人资料、admin 用户、admin 日志、一个弹窗）；`CAOMEI_UI_ROUTE_PREFIXES` 初值；`caomei-ui@1.2.0` 精确锁定 + Dependabot `ignore` | 基线可复现；白名单只含空集 / 试点页；版本锁定生效 | 无 |
| **P1 接入基座** | 安装 `caomei-ui@1.2.0`、`caomei-ui/nuxt`、`theme.css`、`data-preset="caomei"`、`darkMode: 'class'`；保留 PrimeVue；显式 import `useToast` / `useConfirm` 来源 | 双库可同时构建 / 启动；无组件替换；`keyCss` 与 entry chunk / 总 JS 复测；P0 基线 JSON 与允许增幅（建议 `keyCss` ≤ +10%，越线归因） | `pnpm build` / `typecheck` / `test` 通过；两套库样式加载顺序确认；基础层注入唯一；无自动导入歧义 | P0 |
| **P2 主题 / 试点** | 仅试点路由（建议**登录页**）与它实际消费的 V2 薄封装；不全局替换 `BaseInput` / `BaseDialog` / `BaseTable` | 试点页切换；按需建 V2 封装；试点路由登记白名单；视觉 / 交互回归；测试 mock 改写 | 试点页无 PrimeVue 在册族残留；浅色 / 暗色视觉差异逐项归因；定向测试通过 | P1 |
| **P3 表单 / 资料 / 安全 / 浮层** | 注册 / 忘记密码 / 快速登录 / 个人资料 / 安全设置 / OAuth 同意 / SSO 登录；Toast / Confirm 服务；按消费者路由建 V2 封装；`BaseFormGroup` → `CaomeiFormItem` | 这些路由整页迁移；`useToast` / `useConfirm` 显式 import 并按路由切换；Toast token 映射落地 | 路由内无混用；表单校验 / 提交 / Toast / Confirm 回归；a11y 与暗色通过 | P2 |
| **P4 Admin 数据页与剩余页面** | `BaseTable` 随数据页迁移；`admin/users`、`admin/oauth/applications`、`admin/sso/providers`、`admin/logs`、`oauth/clients`、`api-docs-dialog` 等 | DataTable / Column 迁移；选择 / 排序 / 分页 / 列插槽改写；`admin/logs` 的 `DatePicker` 用 1.2.0 `selectionMode="range"`；密度 / 选择列宽度 token 落地 | 每个数据页功能回归；视觉基线；测试 mock 与断言改写 | P3 |
| **P5 收尾** | 卸载 `primevue` / `@primevue/*` / `@primeuix/*` / `primelocale` / `@primevue/forms`；移除 `transpile` / `noExternal` / `internals.inline` 中的 PrimeVue 段；移除 PrimeVue `<Toast />` / `<ConfirmDialog />`（PrimeVue 侧无 Provider；caomei Provider 保留）；清理 `--p-*` / `.p-*`；更新文档 | 依赖归零；构建产物无 PrimeVue / primeicons 相关 chunk；包体对比；文档同步 | `pnpm why primevue` 为空；全量 lint / typecheck / test / build 通过；无 `.p-*` / `--p-*` 残留；文档完成 | P4 |

> **Provider 并存期**：P1 起双挂载 PrimeVue `<Toast />` / `<ConfirmDialog />` 与 caomei 的 `CaomeiToastProvider`；所有 `useToast` / `useConfirm` 调用点显式 import 来源（`primevue/usetoast` 或 `caomei-ui`），禁止依赖自动导入。P5 移除 PrimeVue 侧组件与依赖，caomei 的 `CaomeiToastProvider` 保留。

### 8.2 与 i18n 的顺序

- **推荐：组件迁移先行**（至少 P1–P3），再做 i18n 页面文案替换。理由：`CaomeiButton` / `CaomeiTag` 的可见文案必须写默认插槽，若先做 i18n，会在 PrimeVue 的 `label` / `value` 上写一遍 `t()`，迁移时再改一次插槽。
- **可并行**：i18n 的 Locale Registry、消息模块、治理脚本、服务端 / 邮件设计可以并行推进；不要与组件迁移同时改同一批页面。
- **若业务优先 i18n**：先做 i18n 基座与核心页，但保留 `plugins/primevue-i18n` 直到组件迁移完成；迁移时删除 `primelocale`，改接 `CaomeiConfigProvider`。必须在计划中显式登记这个过渡双轨。

## 9. 风险与缓解

| # | 风险 | 影响 | 缓解 |
| :-: | :--- | :--- | :--- |
| 1 | **视觉回归**：主题圆角、暗色底、状态色、Toast 样式变化 | 用户可感知，易被当成 bug | P0 视觉基线；逐项归因；不属于有意差异不得放行；`@ui-validator` 浏览器验证 |
| 2 | **DataTable 受控状态**：排序 / 选择 / 分页 / 行展开不回写 | 内建交互无效果，且不报错 | 按 caomei-ui 文档回写 `multiSortMeta` / `selection` / `page` / `expandedRows`；定向测试覆盖 |
| 3 | **DatePicker range 行为差异** | 日志筛选清空 / 触发时机与 PrimeVue 不一致 | 1.2.0 已支持 range；用 `@update:model-value` 替代 `@date-select`，清空交互纳入 P4 视觉 / 交互回归 |
| 4 | **Toast 样式残余差异** | 圆角 / 内边距 / 标题字号 / 描述色与旧观感不同 | 16 个语气 token 承接主色；残余差异登记为有意差异；薄封装仅在业务明确要求时启用 |
| 4.1 | **`CaomeiFormItem` 误用为校验引擎** | 误以为 Form 自带 rules，导致校验双轨 | 明确 `CaomeiForm` / `FormItem` 只做布局与 aria；校验仍由 `useForm` + Zod 承担 |
| 4.2 | **DataTable 密度 / 选择列宽度** | 表格观感与旧版不一致 | 用 1.2.0 padding / selection width token 覆盖；逐表视觉登记 |
| 5 | **测试 mock / 选择器大面积失败** | 迁移期 CI 红，掩盖真实回归 | 每批同批改写 mock 与 `.p-*` 断言；按批定向跑，P5 全量 |
| 6 | **SSR / hydration**：浮层 portal、主题 class、locale provider | hydration mismatch / 样式闪烁 | 受影响路由做 SSR + hydration 复核；e2e / 浏览器验证 |
| 7 | **包体变化**：双库并存期 CSS / JS 增长 | 性能预算越线 | P1 / 每批复测 `keyCss` / entry chunk / 总 JS；并存期配额显式登记；P5 对比 |
| 8 | **版本漂移**：Dependabot 在精确值上抬版 | 未读 BREAKING 就升级 | 精确锁定 + `ignore`；升级走人工批次，读 CHANGELOG + 重跑回归 |
| 9 | **与 i18n 冲突**：同页面二次改写 | 返工与冲突 | 按 §8.2 顺序；i18n 只并行基础设施，不并行页面文案 |
| 10 | **双库并存期混用** | 同路由两套组件，样式 / 行为不一致 | 路由白名单 + 整路由切换；守卫断言在册族零残留 |
| 11 | **`useToast` / `useConfirm` 同名自动导入冲突** | PrimeVue 自动导入与 caomei-ui/nuxt 自动导入同名 composable，可能静默解析到错误来源 | 所有调用点显式 `import` 来源（`primevue/usetoast` 或 `caomei-ui`）；禁止依赖自动导入；加 lint / 脚本守卫 |
| 12 | **旧 locale Cookie 首帧不一致** | SSR 读旧 `locale`、客户端只认 `i18n_locale` | 首次命中旧 Cookie 回写 `i18n_locale`；加入 hydration 用例 |

## 10. 验收标准

- [ ] `package.json` / `pnpm-lock.yaml` 中无 `primevue` / `@primevue/*` / `@primeuix/*` / `primelocale` 依赖（`@primevue/forms` 亦移除）。
- [ ] 全仓无 `<Button>` / `<InputText>` / `<DataTable>` / `<Column>` 等 PrimeVue 模板标签；无 `from 'primevue/*'`；无 `p-*` / `--p-*` 残留。
- [ ] `pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` 通过。
- [ ] 浅色 / 暗色下受影响页面视觉基线通过；差异逐项归因并登记。
- [ ] 表单校验、Toast / Confirm、DataTable 排序 / 分页 / 选择 / 列插槽、浮层打开 / 关闭 / 焦点回归通过。
- [ ] 可访问性：可访问名、键盘操作、焦点回归、表格 `aria-sort` / `aria-expanded` 符合 caomei-ui 契约。
- [ ] 构建产物无 PrimeVue / primeicons 相关 chunk；包体对比记录完整。
- [ ] 开发规范、UI/UX 设计、组件文档与 README 同步。

## 11. 不做什么

- 不做 UI 改版、交互重设计或设计语言调整。
- 不引入 Tailwind / UnoCSS。
- 不替换 `useForm` + Zod 的表单逻辑；`CaomeiForm` / `CaomeiFormItem` 只承接布局与 aria，不引入 rules 引擎。
- 不升级 PrimeVue 5.x。
- 不迁移 `@primevue/forms`（零使用，直接移除）。
- 不处理其他下游仓库。

## 12. 上收触发条件

**P0/P1 预备**已完成（阶段 2 M4，2026-11-06 归档，见 [已完成工作归档](../../archive/completed-work.md)），不再等待以下条件。

**P2–P3 已上收**（2026-11-06，阶段 3，见 [阶段 3 登记记录](./2026-11-06-phase3-registration.md)），五项条件均已满足：

1. 用户已明确授权 P2–P3 页面替换（2026-11-06 选择方向 A）。
2. P0 基线可复现；视觉回归按 [视觉参考态基座](./2026-11-08-visual-baseline-harness.md) 执行（参考态 14 张 + 自基线 14 张入库，差异逐项归因；CI 接入待 backlog）。
3. `caomei-ui` 精确锁定 `1.2.0`（2026-11-08 由 1.0.0 升级），Dependabot `ignore` 已同步为 `>1.2.0`。
4. DatePicker range 与 Toast 样式已裁定（§6.3 / §7.3）。
5. 顺序已确认：组件迁移先行；i18n 只并行非组件面，不改同一批页面。

**P4 / P5 已于 2026-11-10 授权进入阶段 4**，范围与验收见 [阶段 4 登记](./2026-11-10-phase4-registration.md)，P4-0 技术方案见 [Admin 迁移基座](./2026-11-10-p4-admin-migration-plan.md)。阶段 3 已于 2026-11-09 收口，M0-3 定时验证移至 backlog；P4 仍使用 PrimeVue 的 24 族 / 195 标签 / 31 文件为输入。

## 13. 工作量画像

| 项 | 数值 |
| :--- | :--- |
| PrimeVue 组件族 / 开标签 / 文件 | 31 / 304 / 52 |
| 基础封装收敛点 | 7 个 |
| `useToast` / `useConfirm` 文件 | 33 / 7 |
| 显式 `primevue/*` 导入文件 | 41 |
| 测试 mock / `.p-*` 断言 | 20 文件 / 34 处 |
| `--p-*` / `.p-*` | 56 处 / 1 文件；131 处 / 约 15 文件 |
| 建议批次 | P0–P5，共 6 批 |

> 不给出工期数字；批次容量按「一次一个变量」控制，每批独立提交、独立回滚。

### 13.1 2026-11-08 1.2.0 复核修订

| 原口径（1.0.0） | 修订（1.2.0） | 依据 |
| :--- | :--- | :--- |
| DatePicker 无 range，需双日期选择器 / 局部例外 | 直接使用 `selectionMode="range"`；`@date-select` → `@update:model-value`；清空语义登记 | 1.2.0 release notes + `dist/components/date-picker/types.d.ts` |
| Toast 仅有少量 token，需接受默认或薄封装 | 16 个逐语气 token 承接实际用色；残余圆角 / 间距差异登记 | 1.2.0 release notes + `toast.vue` 样式钩子 |
| 无 `Form` / `FormItem` | `CaomeiForm` / `CaomeiFormItem` 可用，仅承接布局 / aria，不替代 `useForm` + Zod | 1.1.0 release notes + `form/types.d.ts` |
| DataTable 无密度 / 选择列宽度控制 | 提供 4 个 padding / selection token（仍无 `size` prop） | 1.2.0 release notes + `data-table` 样式 |
| P1 锁定 1.0.0，包体基线 +4.76% / 0% | 升级 1.2.0 复测：`keyCss` +0.13%（+538 B），typecheck / build 通过；入口 chunk 名称随构建变化，未逐字节对比 | [1.2.0 复核记录](./2026-11-08-caomei-ui-1.2.0-revaluation.md) |

> 1.1.0 / 1.2.0 的新增面集中于基础层（命中区、密度轴）与尚未消费的组件能力（DatePicker range、Toast token、Form/FormItem、DataTable token）；项目当前无 caomei 组件消费点，故升级无运行时替换风险。

## 14. 关联文档

- 本项目：[阶段 4 登记](./2026-11-10-phase4-registration.md)｜[i18n 评估](./2026-11-05-i18n-evaluation.md)｜[UI/UX 设计](../ui-ux.md)｜[开发规范](../../standards/development.md)｜[测试规范](../../standards/testing.md)｜[规划规范](../../standards/planning.md)
- caomei-ui：[从 PrimeVue 迁移](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/primevue-migration.md)｜[设计规范 §7](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/design-spec.md)｜[快速上手](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/guide/getting-started.md)｜[主题与样式](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/design/theming.md)｜[内建文案](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/components/locale.md)
- momei：[PrimeVue → caomei-ui 迁移方案](https://github.com/CaoMeiYouRen/momei/blob/master/docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)｜[第 67–71 阶段路线图](https://github.com/CaoMeiYouRen/momei/blob/master/docs/plan/roadmap.md)
- dependfix：[caomei-ui 迁移评估与方案](https://github.com/dependfix/dependfix/blob/master/docs/design/governance/caomei-ui-migration.md)
