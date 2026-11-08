# 2026-11-05 caomei-ui P2 视觉基线方案

> **状态**：方案（P2 开工前执行）；**不建立截图视觉回归工程**。
> **关联**：[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8.1、§9｜[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)｜[UI/UX 设计](../ui-ux.md)。

## 1. 目标与边界

- **目标**：在 P2 试点路由切换前，建立"可复现、可对照"的人工视觉基线，确保迁移差异逐项归因，不让未登记的外观变化静默放行。
- **边界**：
    - 不引入 Playwright 截图对比、不建 CI 视觉回归、不新增任何依赖。
    - 基线产物为本地截图 + 差异清单，截图存 `artifacts/`（`.gitignore` 已忽略），仓库只提交差异结论。
    - 不做像素级阈值判定，按"差异清单 + 人工确认"放行。

## 2. 页面与场景矩阵

P2 试点（登录页）先执行，P3 / P4 逐批扩展到对应路由。

| 批次 | 路由 | 场景 |
| :--- | :--- | :--- |
| P2 | `/login` | 用户名 / 邮箱 / 手机号三个 Tab、校验错误态、2FA 弹窗、验证码组件 |
| P3 | `/register`、`/forgot-password`、`/profile`、`/security`、`/oauth/consent`、`/sso/*` | 默认、校验错误、提交中、Toast / Confirm、表单密集布局 |
| P4 | `admin/users`、`admin/oauth/applications`、`admin/sso/providers`、`admin/logs`、`oauth/clients`、API 文档弹窗 | 列表 / 空态、分页、排序、选择、弹窗、Accordion |

每个路由至少覆盖：

| 维度 | 取值 |
| :--- | :--- |
| 主题 | 浅色、暗色（`html.dark`） |
| 视口 | 桌面 1440×900、移动 390×844 |
| 状态 | 默认、校验错误（如适用）、浮层打开（弹窗 / Toast / Confirm） |

## 3. 采集与存放

1. 本地 `pnpm dev`，用真实浏览器逐项截图（`@ui-validator` 或人工）。
2. 存放路径：`artifacts/visual-baseline/<YYYY-MM-DD>/<batch>/<route>-<theme>-<viewport>-<state>.png`。
3. 命名示例：`artifacts/visual-baseline/2026-11-06/p2/login-light-desktop-error.png`。
4. 基线截图不提交入库；仓库只提交差异结论（见 §5）。

## 4. 已知预期差异（须逐项确认，不是 bug）

| 项 | 基线（PrimeVue 4） | caomei-ui 1.2.0 | 处置 |
| :--- | :--- | :--- | :--- |
| 控件圆角 | 8px | 6px | 登记为有意差异 |
| 暗色底 | `#121212` | `#18181b` | 登记为有意差异 |
| 状态色 | PrimeVue primitive | 取 500 档 | 截图对照文字/图标对比度，不足则提 issue |
| Toast | 6 套 `--p-toast-*` 语气样式 | 4 个语气 × bg/border/text/shadow + width；无圆角 / 内边距 / 标题 / 描述色 | 按评估 §7.3 做 token 映射；残余差异登记 |
| 表格密度 / 选择列宽 | `size="small"` / 52px | 无 `size` prop；提供 padding / selection width token | 用 token 覆盖并登记像素差异 |
| DatePicker range | 支持 | 支持（range 不含时间；无 `showClear` / `manualInput` / `@date-select`） | 直接迁移；`@update:model-value` 触发筛选；清空交互差异登记 |

## 5. 差异登记与放行

每个迁移批次提交前输出一份差异结论，直接写入该批次的迁移记录（不新建独立文档）：

```markdown
### 视觉差异（<批次>）
- 路由 / 场景：<route> <theme> <viewport> <state>
- 差异：<描述>
- 归因：有意差异（圆角 / 暗色底 / 状态色 / Toast）| 待修（阻断）
- 证据：artifacts/visual-baseline/<date>/...png
```

放行条件：

- 所有差异已归因；「待修」项清零。
- 浅色 / 暗色均无文字对比度不足、无遮挡、无布局断裂。
- 表单校验错误、浮层打开关闭、Toast / Confirm 行为与迁移前一致。

## 6. 触发与退出

- **触发**：P2 第一批迁移开始前执行；此后每批页面迁移复用同一矩阵。
- **退出**：P5 收尾（无页面使用 PrimeVue）后删除本方案与 `artifacts/visual-baseline/`，把稳定结论并入 [UI/UX 设计](../ui-ux.md)。

## 7. 关联文档

-   [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)
-   [UI/UX 设计](../ui-ux.md)｜[测试规范](../../standards/testing.md)
