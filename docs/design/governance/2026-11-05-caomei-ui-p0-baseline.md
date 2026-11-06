# 2026-11-05 caomei-ui 迁移 P0 基线与护栏

> **状态**：M4-1 已完成（用量快照、路由白名单初值、版本锁定、回退方案）。
> **关联条目**：[阶段 2 M4-1](../../archive/completed-work.md)。
> **方案来源**：[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8.1 P0。
> **边界**：本记录只建立护栏，未接入 `caomei-ui` 运行时（P1 见 M4-2），未替换任何页面组件。

## 1. 交付清单

| 交付面 | 载体 | 说明 |
| :--- | :--- | :--- |
| 用量盘点脚本 | `scripts/migration/primevue-usage.mjs`（`pnpm migration:usage`） | 可复现扫描 PrimeVue 组件族 / 开标签 / token / 类名 / 测试耦合 |
| 用量快照 | [primevue-usage-snapshot.json](./primevue-usage-snapshot.json) | 脚本输出，提交入库，供逐批对比 |
| 路由白名单初值 | `utils/shared/caomei-ui-migration.ts` | `CAOMEI_UI_ROUTE_PREFIXES = []`，P2 试点时登记 |
| 版本锁定 | `package.json`（`caomei-ui: "1.0.0"`）+ `pnpm-lock.yaml` | 精确版本，无 `^` / `~` |
| Dependabot 忽略 | `.github/dependabot.yml`（`caomei-ui > 1.0.0`） | 迁移期禁止自动抬版 |
| 回退方案 | 本文 §4 | 分「未接入 / 已接入 / 单路由」三档 |

## 2. 用量快照

复现：

```bash
pnpm migration:usage --json=docs/design/governance/primevue-usage-snapshot.json --quiet
```

2026-11-05 结果：

| 指标 | 数值 |
| :--- | ---: |
| PrimeVue 组件族 | 30 |
| 组件开标签 | 301 |
| 使用 PrimeVue 的 `.vue` 文件 | 50 |
| `useToast(` 文件 | 33 |
| `useConfirm(` 文件 | 7 |
| 显式 `from 'primevue/*'` 文件 | 41 |
| `vi.mock('primevue/*')` 测试文件 | 20 |
| `--p-*` token | 56 处 / 47 个唯一名 / 1 个文件（`styles/_theme.scss`，Toast 段） |
| `.p-*` 类选择器 | 131 处 / 18 个文件 |
| `:deep(` | 23 处 |
| e2e `.p-*` 断言 | 0 |

Top 组件：`Button` 141（40 文件）、`InputText` 37（14）、`Column` 31（6）、`Message` 9、`Dialog` 8、`Password` 6、`Select` 6、`Checkbox` 5、`Dropdown` 5、`Textarea` 5。

> 与 [迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §4.2 的 31 / 304 / 52 存在少量差异（评估时手工取数），**以脚本快照为唯一事实源**；每批开工前重新取数并提交新快照，避免数字随代码漂移。

## 3. 路由白名单

- 初值为空集：迁移未开始前，任何路由都不应出现 caomei-ui 组件。
- 匹配规则：按路径段前缀匹配，`/login` 命中 `/login` 与 `/login/xxx`，不命中 `/login-extra`；忽略查询串与哈希。
- 使用方式（P2 起）：页面守卫或检查脚本用 `isCaomeiUiRoute(path)` 判断；未命中的路由必须继续使用 PrimeVue 组件。
- 登记纪律：白名单只增不减直到该路由迁移完成；P5 收尾时清空并删除 `utils/shared/caomei-ui-migration.ts`。

## 4. 回退方案

| 阶段 | 回退动作 | 验证 |
| :--- | :--- | :--- |
| **P0（当前）** | 删除 `caomei-ui` 依赖、`.github/dependabot.yml` 的 `caomei-ui` 忽略段、`utils/shared/caomei-ui-migration.ts` 与其单测；恢复 `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` + `pnpm test` |
| **P1 接入后** | 移除 `caomei-ui/nuxt` 模块、`theme.css` 注入、`html[data-preset="caomei"]`、`CaomeiToastProvider` / `CaomeiConfirmDialog` 挂载；白名单回到空集；保留 PrimeVue 原样 | `pnpm build` / `typecheck` / `test` 通过；浅色 + 暗色视觉与 P0 基线一致 |
| **P2+ 单路由** | 将该路由移出白名单，页面组件恢复为 PrimeVue（或回退该批 commit）；已建 V2 封装保留但不再被引用 | 该页定向测试 + 浏览器回归；白名单与页面实际组件一致 |

约束与说明：

- **无数据迁移**：迁移不涉及数据库 schema、API 契约或存储格式，回退不需要数据恢复。
- **依赖回退不改锁文件版本**：`caomei-ui` 为精确锁定，回退时整段删除依赖并重新生成 lockfile，不保留悬空 peer。
- **触发条件**：构建失败无法快速定位、关键页面视觉差异无法归因、Toast / Confirm 行为异常、SSR hydration 报错、`keyCss` / 入口 JS 越线且无法归因。
- **回退记录**：每次回退在提交说明与本文追加一行（日期、阶段、原因、验证结论）。

## 5. P1 基座接入结果（M4-2）

2026-11-05 完成接入，**未替换任何页面组件**：

| 项 | 变更 |
| :--- | :--- |
| Nuxt 模块 | `modules` 增加 `caomei-ui/nuxt`（与 `@primevue/nuxt-module` 并存） |
| 主题 | `app.head.htmlAttrs` 增加 `data-preset="caomei"`，承接品牌色预设 |
| 暗色 | `caomeiUI.darkMode = 'class'`，沿用 `useDark()` 的 `html.dark` |
| 样式 | `caomeiUI.injectStyles = true`，基础层由模块注入一次（不重复引入） |
| 页面组件 | **零替换**，PrimeVue 模板与 `components/base/*` 保持不变 |

### 5.1 构建与包体复测

| 指标 | 接入前 | 接入后 | 变化 | 允许增幅 | 结论 |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `keyCss`（`entry.*.css`） | 381,057 B | 399,195 B | +4.76% | ≤ +10% | 通过 |
| 入口 JS（`entry` chunk） | 81,340 B | 81,340 B | 0% | ≤ +5% | 通过 |
| 全部 CSS | 1,569,652 B | 1,587,790 B | +1.16% | — | 记录 |
| 全部 JS | 3,421,440 B | 3,421,463 B | +23 B | — | 记录 |

`pnpm build` 通过；接入前后均为 50 个 `.vue` 使用 PrimeVue（快照未变）。

### 5.2 自动导入冲突与守卫

`caomei-ui/nuxt` 会自动注册 `useToast` / `useConfirm`，与 `@primevue/nuxt-module` 同名。构建时 Nuxt 提示 PrimeVue 侧被忽略，但由于项目中全部调用点都已显式 `import` 自 `primevue/usetoast` / `primevue/useconfirm`，运行时来源正确。

- 守卫脚本：`scripts/migration/check-caomei-imports.mjs`（`pnpm migration:check-imports`）。
- CI：`test.yml` 与 `regression-weekly.yml` 在 `ai:check` 之后执行；命中自动导入即失败。
- 迁移纪律：调用点必须显式 import 来源；P5 卸载 PrimeVue 时统一改为 `caomei-ui` 来源。

## 6. 关联文档

-   [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[P2 视觉基线方案](./2026-11-05-caomei-ui-p2-visual-baseline-plan.md)｜[待办事项](../../plan/todo.md)｜[Backlog](../../plan/backlog.md)
-   [开发规范](../../standards/development.md)｜[测试规范](../../standards/testing.md)｜[规划规范](../../standards/planning.md)
