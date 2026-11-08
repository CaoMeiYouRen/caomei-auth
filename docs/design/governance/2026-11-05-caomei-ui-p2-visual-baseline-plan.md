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

### 2.1 2026-11-08 基线采集

- **方式**：本地 `pnpm build` 后启动生产 server（`127.0.0.1:3100`），Playwright 1.64.1 headless Chromium 截图。
- **已覆盖**（`artifacts/visual-baseline/2026-11-08/p2/`，截图不入库）：
    - 浅色 / 暗色 × 桌面 1440×900 默认：`login-{light,dark}-desktop-default.png`
    - 浅色 / 暗色 × 移动 390×844 默认：`login-{light,dark}-mobile-default.png`
    - 浅色桌面校验错误：`login-light-desktop-error.png`（点击登录后出现「请输入用户名」）
    - 三个 Tab：`login-light-desktop-tab-{username,email,phone}.png`
- **检查结论**：
    - 暗色生效：`html.dark`，卡片背景 `rgb(30,30,30)`；浅色为 `rgb(255,255,255)`。
    - 桌面 / 移动均无横向溢出（`scrollWidth == innerWidth`）。
    - 校验错误文案正常渲染。
- **未覆盖**：2FA 弹窗（需已启用 2FA 的测试账号）、验证码组件（需配置 captcha provider）、提交中 / Toast（P2 迁移后再补）。这些状态不阻塞基线建立，但 P2 试点验收前需补齐。

### 2.2 2026-11-08 M2-1 迁移后复核

- **方式**：同一生产 server + Playwright headless Chromium，截图存 `artifacts/visual-baseline/2026-11-08/p2-after/`（不入库）。
- **覆盖**：与 §2.1 相同的 8 个状态（三 Tab、明暗、桌面 / 移动、校验错误）。
- **结果**：
    - `/login` 页面内 PrimeVue 组件节点 **0**（`.p-button` / `.p-inputtext` / `.p-dialog` / `.p-tabview` / `.p-checkbox`）；主题切换改用 `ThemeToggleV2`（CaomeiButton），页面级 `<Toast />` 移除，Toast 服务仍为 PrimeVue 并在 M3-3 统一切换。
    - 交互回归通过：三 Tab 切换、邮箱格式校验（「请输入有效的邮箱地址」）、密码显隐、验证码登录切换、明暗切换；验证码未启用时控制台 0 error。
    - 桌面 / 移动均无横向溢出；暗色卡片 `rgb(30,30,30)`、浅色 `rgb(255,255,255)`。
    - 包体：[bundle-after-m2-1-2026-11-08.json](./bundle-after-m2-1-2026-11-08.json)：`entryJs` 431,229 B、`totalJs` 3,650,596 B（较 M1-1 +3.77%）、`totalCss` 1,703,412 B（+5.88%），`keyCss` 399,733 B 不变；增量来自 login 首次引入 Caomei 组件，P5 卸载 PrimeVue 后回收。
    - PrimeVue 用量快照：30 族 / 301 标签 / 50 文件 → **28 族 / 282 标签 / 49 文件**（`TabView` / `TabPanel` 清零）。
- **视觉差异（有意）**：控件圆角 8px → 6px、输入框内边距与高度由 Caomei token 接管、社交按钮图标间距改为组件插槽布局；主题切换按钮的暗色 / 移动端位置与 V1 对齐；无遮挡、无对比度不足。
- **行为保持**：2FA 弹窗禁止点击遮罩关闭（与旧 Dialog 默认一致）；2FA Tabs 保留隐藏面板，避免切换后发送验证码倒计时重置；登录方式按钮补 `aria-pressed`，手机号区号选择器绑定可访问名。
- **2FA 功能验证**（Playwright mock `sign-in` 返回 `twoFactorRedirect`）：弹窗打开；点击遮罩不关闭；Tabs 切换后面板保留（3 个输入均在）；`verify-totp` 请求发出且成功后弹窗关闭。2FA 视觉截图仍待真实测试账号。
- **仍未覆盖**：验证码启用状态的真实渲染（需 captcha provider）；2FA 视觉截图（需测试账号）。

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
