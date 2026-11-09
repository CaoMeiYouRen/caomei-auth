# 2026-11-08 视觉参考态基座（Visual Reference Harness）

> **状态**：参考态已建立（分支 `test/visual-baseline`，采自 `fc2201e`）；自基线层与预算分级尚未建立。
> **替代关系**：本文替代 [P2 视觉基线方案](./2026-11-05-caomei-ui-p2-visual-baseline-plan.md) §1 的「不建截图工程 / 截图不入库 / 不做像素判定」口径。
> **关联**：[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8.1 / §9 / §12｜[P2 视觉基线方案](./2026-11-05-caomei-ui-p2-visual-baseline-plan.md)｜[测试规范](../../standards/testing.md)。

## 1. 为什么要补

原 P2 口径产出的是**一次性人工观测**：截图存 `artifacts/`（`.gitignore` 忽略）、无采集脚本、无比对工具、无判据。它无法回答三个问题：

1. 这条差异是相对**迁移前**的变化，还是相对上次采集的漂移？（仓库里没有任何迁移前产物）
2. 漏登记的差异如何发现？（归因由迁改方自撰，Review Gate 只能核对「有没有写」）
3. 换机器 / 换 Chromium 后结论是否还成立？（环境未固定，无 manifest）

因此建立**参考态层**：把迁移前的渲染原貌固化为随仓库提交的快照，迁移批次用当前渲染与之比对。这与 momei 的「视觉一致性门禁」同层（见其 `docs/design/governance/2026-10-13-visual-parity-gate.md` §1）。

## 2. 边界

- **两层已建立**：
    - 参考态层：`tests/visual/parity/*.visual-parity.spec.ts` + `playwright.visual-parity.config.ts`，快照 = 迁移前 PrimeVue 原貌，随仓库提交，**不可原地刷新**。
    - 自基线层：`tests/visual/baseline/*.visual.spec.ts` + `playwright.visual.config.ts`，快照 = 当前已接受状态，用于后续回归。
- **两层共用矩阵与服务环境**：`tests/visual/helpers/config.ts` 是唯一来源，禁止复制副本（服务环境漏一个变量就会让两层渲染分叉）。
- **CI 门禁**：自基线层是阻断门禁（`.github/workflows/test.yml` 的 `visual` job）；参考态层按迁移批次使用，当前仍有已登记的有意差异，只出报告与工件、不阻断。
- **渲染环境固定为容器**：本地与 CI 共用 `mcr.microsoft.com/playwright:v<版本>-noble`。宿主与容器实测约 1% 的整页漂移（12,509 / 1,296,000 px），因此基线只在容器内采集，宿主直接跑仅用于调试。
- **不追求像素级一致**：`threshold 0.2` + `maxDiffPixels 200` 只吸收抗锯齿噪声；超限即报告差异，由人工归因。

## 3. 视觉矩阵（每层 36 张）

同一矩阵同时驱动两层：参考态层（迁移前原貌）与自基线层（当前接受状态）各 36 张。

| 路由 | 主题 | 视口 | 状态 | 快照 |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | 浅 / 暗 | 1440×900 / 390×844 | 默认（用户名 Tab） | `login-{theme}-{viewport}-default` |
| `/login` | 浅 | 1440×900 | 校验错误 | `login-light-desktop-error` |
| `/login` | 浅 | 1440×900 | 用户名 / 邮箱 / 手机号 Tab | `login-light-desktop-tab-{username,email,phone}` |
| `/register` | 浅 / 暗 | 1440×900 / 390×844 | 默认（邮箱 Tab） | `register-{theme}-{viewport}-default` |
| `/register` | 浅 | 1440×900 | 校验错误 | `register-light-desktop-error` |
| `/register` | 浅 | 1440×900 | 手机号 Tab | `register-light-desktop-tab-phone` |
| `/forgot-password` | 浅 / 暗 | 1440×900 / 390×844 | 默认（邮箱 Tab） | `forgot-password-{theme}-{viewport}-default` |
| `/forgot-password` | 浅 | 1440×900 | 校验错误 | `forgot-password-light-desktop-error` |
| `/forgot-password` | 浅 | 1440×900 | 手机号 Tab | `forgot-password-light-desktop-tab-phone` |
| `/change-password` | 浅 / 暗 | 1440×900 / 390×844 | 默认（需登录） | `change-password-{theme}-{viewport}-default` |
| `/change-password` | 浅 | 1440×900 | 校验错误（需登录） | `change-password-light-desktop-error` |
| `/quick-login` | 浅 / 暗 | 1440×900 / 390×844 | 默认（邮箱验证码 Tab） | `quick-login-{theme}-{viewport}-default` |
| `/quick-login` | 浅 | 1440×900 | 校验错误 | `quick-login-light-desktop-error` |
| `/quick-login` | 浅 | 1440×900 | 短信验证码 Tab | `quick-login-light-desktop-tab-phone` |
| `/profile` | 浅 / 暗 | 1440×900 / 390×844 | 默认（需登录，ID 遮蔽） | `profile-{theme}-{viewport}-default` |
| `/profile` | 浅 | 1440×900 | 隐私模式 | `profile-light-desktop-privacy` |

P3 / P4 路由按同一矩阵逐批扩展：每批迁移**之前**在迁移前提交上采集参考态，与本批迁移提交同批入库。

## 4. 环境固定（可复现）

| 维度 | 取值 | 说明 |
| :--- | :--- | :--- |
| 浏览器 | chromium 156.0.8078.4（revision 1248） | Playwright 1.64.1 绑定版本，不跟随系统 Chrome |
| 视口 / DSF | 1440×900 / 390×844，DSF 1 | 每个 describe 显式 `test.use` |
| locale / 时区 | `zh-CN` / `Asia/Shanghai` | 避免文案与日期格式漂移 |
| 主题 | `localStorage['vueuse-color-scheme']=light\|dark` | 不依赖系统 `prefers-color-scheme`；暗色额外断言 `html.dark` 生效 |
| 动画 / 光标 | `animations: 'disabled'` / `caret: 'hide'` | 配置层统一 |
| 减少动效 | `reducedMotion: 'reduce'` | 配置层统一 |
| 数据库 | 空 sqlite：每次启动前按 `database/sqlite/create.sql` 重建 | 生产构建里 `NODE_ENV` 已静态内联为 production，TypeORM `synchronize` 不生效，故由 `scripts/testing/prepare-visual-db.mjs` 建表 |
| 登录后页面 | 固定视觉账号：首次注册、后续登录 | `change-password` 等受保护页面通过 `page.request` 建立会话，账号信息不进入截图 |
| 功能开关 | 用户名 / 手机号登录开；验证码关；Demo 角标关 | 社交渠道固定 github / google / wechat（假凭据，仅渲染） |
| 动态区域 | `[data-visual-mask]` 显式遮蔽 | 当前路由无动态内容，暂未使用 |

环境元数据与逐快照清单记录于 [`tests/visual/reference-manifest.json`](../../../tests/visual/reference-manifest.json)。

## 5. 命令与产物

```bash
# 1) 采集参考态（只能在迁移前提交上执行；VISUAL_REFERENCE_CAPTURE 守卫会拒绝迁移后的页面）
pnpm test:visual:reference

# 2) 比对当前渲染 ↔ 参考态（迁移一致性审计）
pnpm test:visual:parity

# 3) 比对当前渲染 ↔ 自基线（回归门禁）
pnpm test:visual

# 4) 差异归因完成后更新自基线（不得用于刷新参考态）
pnpm test:visual:update

# 5) 定向比对（容器内执行）
pnpm test:visual --grep "login 默认态"
```

> 以上命令默认在固定 Playwright 容器内执行（`scripts/testing/run-visual.mjs`）；容器内 / CI 用 `test:visual:raw*` 直接跑 Playwright。

| 产物 | 路径 | 是否入库 |
| :--- | :--- | :--- |
| 参考态快照 | `tests/visual/reference/auth.visual-parity.spec.ts/*.png` | 是 |
| 自基线快照 | `tests/visual/__screenshots__/auth.visual.spec.ts/*.png` | 是 |
| 环境与清单 | `tests/visual/reference-manifest.json` | 是 |
| 失败产物 `-actual` / `-diff` | `test-results/visual-parity/`、`test-results/visual/` | 否（`.gitignore`） |
| HTML 报告 | `playwright-report/visual-parity/`、`playwright-report/visual/` | 否（`.gitignore`） |

前置条件：`pnpm test:visual` 会先构建再启动 `.output/server/index.mjs`（3100 端口），无需手工 build。

### 5.1 CI 门禁

`.github/workflows/test.yml` 的 `visual` job 在 Playwright 官方容器内运行（`needs: [test]`）：

| 步骤 | 命令 | 是否阻断 |
| :--- | :--- | :--- |
| 自基线回归 | `pnpm test:visual:raw` | **是**（job 失败即阻断合并） |
| 参考态审计 | `pnpm test:visual:parity:raw` | 否（`continue-on-error: true`，产出 `-diff.png` 工件） |

- 工件：`visual-regression`（`test-results/visual*`、`playwright-report/visual*`、`reference-manifest.json`），保留 7 天。
- **基线只能在容器内更新**：本地 `pnpm test:visual:update` 会进入同一镜像执行并回写 `__screenshots__`；禁止用宿主直跑的结果更新基线。
- **镜像版本与 `@playwright/test` 精确绑定**：升级 Playwright 必须同批重采自基线（浏览器与字体随镜像变化）。
- 容器 job 以 root 运行，Chromium 依赖镜像自带的沙箱配置；`--ipc=host` 用于避免小 `/dev/shm` 导致的渲染抖动。

## 6. 判定与差异处置

1. 迁移提交后运行 `pnpm test:visual:parity`，逐项阅读 `-diff.png` 与像素数。
2. 每项差异写入该批次迁移记录的「视觉差异」段：路由 / 场景 / 差异 / 归因 / 证据。
3. 归因分两类：
    - **有意差异**（圆角 8px→6px、暗色底 `#121212`→`#18181b`、状态色取 500 档、Toast 残余）：登记后不刷新参考态，差异保留为已知项。
    - **待修**（遮挡、布局断裂、对比度不足、意外位移）：登记为临时待办并修复。
4. **参考态不得原地刷新**。需要重新审计时，用 `git show <参考态提交>:tests/visual/reference/...` 取回，而不是重新采集。

> 参考态第一次提交即 `fc2201e` 的渲染原貌；后续任何一次「更新参考态」都会破坏其自证能力。

### 6.1 2026-11-08 首轮差异归因

参考态采自 `fc2201e`，比对对象为 `0169d40`（`/login`、`/register` 已迁移）+ 本轮修复。首轮 14/14 快照均有差异，归因结果如下。

**发现并修复的回归（未登记的有意差异）**

| 项 | 迁移前 | 迁移后（修复前） | 处置 |
| :--- | :--- | :--- | :--- |
| 表单标签字号 | 16px | 12px（`--caomei-form-item-label-font-size` 默认 `font-size-sm`） | 用组件 token 恢复 16px |
| 标签与控件间距 | 8px | 4px | `--caomei-form-item-gap: 0.5rem` |
| 输入框字号 / 高度 | 16px / 50px | 14px / 40px | `--caomei-field-font-size: 1rem`、`--caomei-field-height: 3.125rem` |
| 字段块间距 | 24px（`.form-group` margin） | 0（`CaomeiFormItem` 无外边距） | `.auth-card .caomei-form-item { margin-bottom: 1.5rem }` |
| 校验错误字号 | 16px（继承） | 12px | `--caomei-form-item-message-font-size: 1rem` |

修复落点：`styles/_form.scss` 末尾的 `.auth-card` token 桥接块（不改 `CaomeiFormItem` 内部结构，不提升选择器特异性）。

**差异收敛（像素 / 占比）**

| 快照 | 修复前 | 修复后 | 归因 |
| :--- | ---: | ---: | :--- |
| `login-light-desktop-default` | 44,092 / 4% | 24,918 / 2% | 卡片居中位移 + 圆角 / 按钮高度 |
| `register-light-desktop-default` | 54,536 / 5% | 34,204 / 3% | 同上 |
| `login-light-mobile-default` | 43,818 / 14% | 38,394 / 12% | 移动端 Tab 由「逐字换行」改为单行（改善） |
| `register-light-mobile-default` | 39,908 / 13% | 31,480 / 10% | 同上 |
| `login-dark-desktop-default` | 45,017 / 4% | 25,770 / 2% | 深色底 `#121212` → `#18181b`（有意） |
| `login-light-desktop-error` | 46,356 / 4% | 22,641 / 2% | 同上 |
| `register-light-desktop-error` | 77,611 / 6% | 21,102 / 2% | 表单密度修复后大幅收敛 |
| `login-light-desktop-tab-email` | 64,094 / 5% | 43,879 / 4% | Tab 切换后表单高度变化 → 居中位移 |
| `login-light-desktop-tab-phone` | 66,767 / 6% | 48,048 / 4% | 同上 |

**剩余差异（登记为有意，不修）**

| 项 | 说明 |
| :--- | :--- |
| 控件圆角 8px → 6px | caomei-ui 设计 token，迁移评估已登记 |
| 暗色底 `#121212` → `#18181b` | 同上 |
| 按钮高度（Tab 40 → 36、提交 50 → 44） | 组件尺度 token；未在迁移评估登记，按「组件尺度差异」追认 |
| 卡片垂直位置 ~25px | 内容高度差导致居中位移，非布局断裂 |
| 移动端 Tab 单行 | 修复了迁移前的逐字换行问题，属改善 |

> 自基线层已按修复后的状态采集并通过（14/14），后续回归以自基线为准；参考态保留用于迁移一致性审计，不再作为绿/红门禁。M3-2 批次修正桥接后已重采两层快照，最新数值见 §6.2。

### 6.2 2026-11-09 M3-2 批次（忘记 / 修改密码）

**范围与采集**：`/forgot-password`（公开，6 张）、`/change-password`（需登录，5 张）。参考态采自该批迁移前提交 `bfb5ce3`，提交于 `22d440d`；受保护页面用固定视觉账号建立会话。

**发现的桥接缺陷（已修）**：首版桥接只声明 `--caomei-field-height` / `--caomei-field-font-size`，实际无效——组件在 `:where(.caomei-field--md)` 里就地声明这两个变量，元素级声明压过 `.auth-card` 的继承。修正为覆盖其引用源：

- `--caomei-font-size-md: 1rem`（字段与按钮字号 14 → 16px）
- `.caomei-field--md { --caomei-field-height: 2.875rem }`（36 → 46px，与迁移前实测一致）
- 标签行高 `normal`（组件默认 1.4 会把每个字段撑高 4px）
- 错误提示 `margin-top: -0.25rem`（组件用同一 flex gap，旧设计为 4px）
- 按钮 40px、验证码按钮 48px、复选框字号 16px

该修正同时改善了 login / register 的自基线（字段 40 → 46、字号 14 → 16、按钮 36 → 40），因此两层快照在 M3-2 批次一并重采。

**差异收敛（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `forgot-password-light-desktop-default` | 18,055 / 2% |
| `forgot-password-dark-desktop-default` | 17,899 / 2% |
| `forgot-password-light-mobile-default` | 23,394 / 8% |
| `forgot-password-dark-mobile-default` | 23,475 / 8% |
| `forgot-password-light-desktop-error` | 26,800 / 3% |
| `forgot-password-light-desktop-tab-phone` | 16,583 / 2% |
| `change-password-light-desktop-default` | 26,263 / 3% |
| `change-password-dark-desktop-default` | 24,137 / 2% |
| `change-password-light-mobile-default` | 23,915 / 8% |
| `change-password-dark-mobile-default` | 23,155 / 8% |
| `change-password-light-desktop-error` | 33,335 / 3% |
| `login-light-desktop-default`（复测） | 15,375 / 2% |
| `register-light-desktop-default`（复测） | 27,409 / 3% |
| `login-light-mobile-default`（复测） | 29,068 / 9% |
| `register-light-mobile-default`（复测） | 18,653 / 6% |
| `register-light-desktop-error`（复测） | 41,475 / 4% |

> 计数包含整卡垂直位移（内容高度差导致居中位置移动），因此是上限而非逐元素差异量；判断是否回归应以 `-diff.png` 的区域分布为准。

**剩余差异（接受）**

| 项 | 说明 |
| :--- | :--- |
| 控件圆角 8 → 6px、暗色底 `#121212` → `#18181b` | 迁移评估已登记 |
| 按钮高度 41.4 → 40px | 组件尺度 token |
| `change-password` 旧输入 40.4 → 46px | 该页原用 PrimeVue `Password`，统一到其他认证页的 46px |
| 卡片垂直位置 | 内容高度差导致居中位移，非布局断裂 |
| 移动端 Tab 单行 | 修复了迁移前的逐字换行问题，属改善 |
| 校验错误态累计位移 | 错误块与旧设计每字段仍有 ~2px 行高差 |

### 6.3 2026-11-09 M3-3 批次（快速登录）

**范围**：`/quick-login` 6 张参考态，采自迁移前提交 `3f8fdc3`。

**发现并修复的回归**：

- **区号选择器被裁剪**：`phone-input-v2.vue` 的 `.region-selector` 用 `flex: 1`，CaomeiSelect 的箭头占位后「CN +86」被裁成「CN」。该组件被 5 个已迁移页共用，属 M2/M3-2 遗留问题；改为 `flex: 0 0 7rem`，手机号输入 `flex: 1`。
- **验证码 6 位上限失效**：`maxlength` 随 `$attrs` 落在 CaomeiInput 的根容器而非原生 input；改由 `handleEmailCodeInput` / `handlePhoneCodeInput` 截断到 6 位。

**差异收敛（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `quick-login-light-desktop-default` | 15,935 / 2% |
| `quick-login-dark-desktop-default` | 15,458 / 2% |
| `quick-login-light-mobile-default` | 18,593 / 6% |
| `quick-login-dark-mobile-default` | 18,185 / 6% |
| `quick-login-light-desktop-error` | 19,915 / 2% |
| `quick-login-light-desktop-tab-phone` | 16,133 / 2% |

**接受项**：与其余认证页一致（按钮 41.4 → 40px、圆角 8 → 6px、卡片居中位移、移动端 Tab 单行）。Toast 已切到 caomei 组件，样式差异（圆角 / 内边距 / 标题字号）沿用迁移评估 §7.3 的登记，视觉矩阵不覆盖浮层。

### 6.4 2026-11-09 M4-1 批次（个人资料）

**范围**：`/profile` 5 张参考态，采自迁移前提交 `4d94931`。用户 ID 每次运行随机，`user-basic-info` 的 ID 输入加 `data-visual-mask`，截图以遮罩块呈现。

**迁移面**：`profile-header` / `user-avatar` / `user-basic-info` / `user-contact-info` / `social-accounts` / `profile-footer-actions` + 3 个对话框；新增 `BaseDialogV2`（CaomeiDialog）供本批使用，`base-dialog.vue` 保留给未迁移页。`useProfileFlow` 的 11 处 Toast 与 2 处 Confirm 切到 caomei（`confirm.require` 回调改为 `await confirm.open()` 返回布尔）。

**验证**：容器内探针确认邮箱对话框打开 / Esc 关闭、退出确认打开 / 取消、caomei Toast 渲染、隐私模式切换与遮罩生效；`user-avatar` 改为 CaomeiImage（preview）+ 原生 file input。迁移后 `/profile` 的 PrimeVue 节点为 0（含对话框）。

**同批修复**：路由白名单补齐 `/forgot-password`、`/change-password`、`/quick-login`、`/profile`——此前批次只改了页面未登记白名单，这些路由仍渲染 PrimeVue 主题切换；`migration:check-imports` 改为允许 `useToast` / `useConfirm` 显式来自 `primevue/*` 或 `caomei-ui`。

**差异（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `profile-light-desktop-default` | 50,945 / 4% |
| `profile-dark-desktop-default` | 86,836 / 7% |
| `profile-light-mobile-default` | 36,758 / 12% |
| `profile-dark-mobile-default` | 72,539 / 23% |
| `profile-light-desktop-privacy` | 59,227 / 5% |

**接受项**：操作按钮改为 caomei 尺度（原 PrimeVue 蓝 / 黄实心按钮改为主色 / 描边）、头像预览指示器与上传按钮形态、`CaomeiMessage` 语气底色；移动端 4 个操作按钮纵向换行与迁移前一致（非本批引入）。

## 7. 已知限制

- **跨环境已用镜像固定**：本地与 CI 共用同一 Playwright 镜像；宿主直跑与容器相差约 1% 像素，故宿主结果不作判定依据。镜像升级或 playwright 版本变化时，必须重采自基线并在 PR 中说明。
- **未覆盖状态**：2FA 弹窗视觉（需已启用 2FA 的测试账号）、验证码启用态（需 captcha provider）、提交中 / 提交成功 Toast（需真实后端）。这些状态在环境具备后追加，并同批补参考态。
- **已覆盖六页**：`/login`、`/register`、`/forgot-password`、`/change-password`、`/quick-login`、`/profile`；其余 P3 页面（安全设置、OAuth 同意、SSO）在各自迁移前补采。
- **无预算分级**：当前用统一 `maxDiffPixels 200`，未按 `reader` / `admin` 分档；P4 数据页前评估。

## 8. 与既有文档的关系

| 文档 | 需要同批回写的内容 |
| :--- | :--- |
| [P2 视觉基线方案](./2026-11-05-caomei-ui-p2-visual-baseline-plan.md) | §1 边界（不再「不建截图工程」）、§3 采集与存放（新增参考态层）、§5 放行条件（改为参考态比对 + 逐项归因） |
| [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) | §8.1 P0 行与 §12 上收条件第 2 条（「不建截图回归工程」改为「参考态层 + 差异清单」） |
| [阶段 3 登记记录](./2026-11-06-phase3-registration.md) | §5「视觉基线」行 |
| [todo.md](../../plan/todo.md) | M1-2 交付面与状态（可复现参考态） |
| [docs/design/index.md](../index.md) | 本文入口 |

## 9. 退出条件

- P5 收尾（无页面使用 PrimeVue）后，参考态不再承担迁移比对职责；**保留** `tests/visual/reference/` 作为历史证据，删除 `artifacts/visual-baseline/` 本地目录。
- 若届时已建立自基线层，迁移方案文档完成归档，本文并入 [测试规范 §视觉回归](../../standards/testing.md)。
