# 2026-11-08 视觉参考态基座（Visual Reference Harness）

> **状态**：参考态与自基线两层均已建立；2026-11-10 起覆盖 P2–P4 Admin；2026-11-14 自基线补充 about / privacy / terms（自基线 100 张 = 认证 62 + Admin 38；参考态 88 张 = 认证 50 + Admin 38，新页面只维护自基线）。
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

## 3. 视觉矩阵（自基线 100 张 / 参考态 88 张）

同一矩阵同时驱动两层：参考态层（迁移前原貌）与自基线层（当前接受状态）。参考态只覆盖迁移前已存在的页面（认证 50 + Admin 38）；about / privacy / terms 是迁移后新增的自基线页面，矩阵中以 `reference: false` 标记，参考态层跳过。

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
| `/security` | 浅 / 暗 | 1440×900 / 390×844 | 默认（会话动态列遮蔽） | `security-{theme}-{viewport}-default` |
| `/security` | 浅 | 1440×900 | 启用 2FA 对话框 | `security-light-desktop-enable-2fa-dialog` |
| `/security` | 浅 | 1440×900 | 撤销所有会话确认 | `security-light-desktop-revoke-all-confirm` |
| `/oauth/consent` | 浅 / 暗 | 1440×900 / 390×844 | 默认（预置 `visual-client`） | `oauth-consent-{theme}-{viewport}-default` |
| `/sso-login` | 浅 / 暗 | 1440×900 / 390×844 | 默认（4 种登录方式） | `sso-login-{theme}-{viewport}-default` |
| `/about` | 浅 / 暗 | 1440×900 / 390×844 | 默认（仅自基线） | `about-{theme}-{viewport}-default` |
| `/privacy` | 浅 / 暗 | 1440×900 / 390×844 | 默认（仅自基线） | `privacy-{theme}-{viewport}-default` |
| `/terms` | 浅 / 暗 | 1440×900 / 390×844 | 默认（仅自基线） | `terms-{theme}-{viewport}-default` |

### 3.1 Admin 矩阵（P4-0）

| 路由 | 主题 | 视口 | 状态 | 快照 |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/users` | 浅 / 暗 | 1440×900 / 390×844 | 默认（管理员会话） | `admin-users-{theme}-{viewport}-default` |
| `/admin/users` | 浅 | 1440×900 | 选择行 / 创建用户 / 用户详情 / 禁用用户 / 用户会话 | `admin-users-light-desktop-{selection,create-dialog,detail-dialog,ban-dialog,sessions-dialog}` |
| `/admin/oauth/applications` | 浅 / 暗 | 1440×900 / 390×844 | 默认 | `admin-applications-{theme}-{viewport}-default` |
| `/admin/oauth/applications` | 浅 | 1440×900 | 创建应用 / API 文档 | `admin-applications-light-desktop-{create-dialog,api-docs-dialog}` |
| `/admin/sso/providers` | 浅 / 暗 | 1440×900 / 390×844 | 默认 | `admin-sso-{theme}-{viewport}-default` |
| `/admin/sso/providers` | 浅 | 1440×900 | 创建（OIDC）/ 创建（SAML）/ 详情 | `admin-sso-light-desktop-{create-oidc-dialog,create-saml-dialog,detail-dialog}` |
| `/admin/logs` | 浅 / 暗 | 1440×900 / 390×844 | 默认 | `admin-logs-{theme}-{viewport}-default` |
| `/admin/logs` | 浅 | 1440×900 | 会话状态筛选 / 日期范围 | `admin-logs-light-desktop-{status-filter,date-range}` |
| `/oauth/clients` | 浅 / 暗 | 1440×900 / 390×844 | 默认（空态） | `oauth-clients-{theme}-{viewport}-default` |
| `/` | 浅 / 暗 | 1440×900 / 390×844 | 默认（管理员会话） | `home-{theme}-{viewport}-default` |
| `/visual-not-found` | 浅 | 1440×900 / 390×844 | 404 错误页 | `error-light-{viewport}-default` |

> 错误页是 Nuxt 独立错误实例，未接入主题插件（`html` 不挂 `.dark`），因此不采暗色。
> Admin 夹具与固定时钟见 §4.1；参考态采自 P4 开工前提交 `a6c8d3b`。

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
| 数据库 | sqlite：每次启动前按 `database/sqlite/create.sql` 重建并写入确定性夹具 | 生产构建里 `NODE_ENV` 已静态内联为 production，TypeORM `synchronize` 不生效；夹具见 `scripts/testing/visual-fixtures.mjs` |
| 登录后页面 | 认证面：固定视觉账号首次注册、后续登录；Admin 面：预置固定 token 的会话 | Admin 会话由测试侧签名 cookie 注入，避免 `/sign-in` 限流与会话行累积；账号信息不进入截图 |
| 功能开关 | 用户名 / 手机号登录开；验证码关；Demo 角标关 | 社交渠道固定 github / google / wechat（假凭据，仅渲染） |
| 固定时钟 | `VISUAL_HARNESS=1` + `VISUAL_FIXED_NOW=2026-06-15T12:00:00+08:00` | 服务端 Nitro 插件 + 浏览器 `page.clock`；日期 / 相对时间 / 趋势图 / DatePicker 当前月不随运行日期漂移 |
| 动态区域 | `[data-visual-mask]` 显式遮蔽 | 认证面用于 ID / 会话 token / IP / 时间；Admin 面使用固定夹具，无需遮蔽 |

环境元数据与逐快照清单记录于 [`tests/visual/reference-manifest.json`](../../../tests/visual/reference-manifest.json)。

### 4.1 Admin 夹具与固定时钟

- **确定性数据**：`scripts/testing/visual-fixtures.mjs` 写入 12 个用户（1 管理员 / 1 禁用）、3 个 OAuth 应用、2 个 SSO 提供商（OIDC + SAML）、25 条会话日志；ID / 名称 / 邮箱 / 时间 / IP / UA 全部固定。
- **管理员会话**：预置固定 token 的 `session` 行，测试侧用 `AUTH_SECRET` 做 HMAC-SHA256 签名写 cookie（`tests/visual/helpers/admin-session.ts`），不调用 `/sign-in`、不新增会话行。
- **固定时钟**：`server/plugins/visual-clock.ts` 在 `VISUAL_HARNESS=1` + `VISUAL_FIXED_NOW` 存在 + 视觉库路径同时成立时，把服务端时钟平移到锚点，并按真实速度前进（不冻结，限流 / 过期语义不变）；浏览器侧用 `page.clock.setFixedTime` 固定同一锚点。
- **暗色基座**：PrimeVue `darkModeSelector` 必须为 `.dark`（`html.dark` 会生成后代选择器，暗色变量不生效）；详见 [P4-0 决策记录](./2026-11-10-p4-0-decisions.md) §5。

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
| 参考态快照 | `tests/visual/reference/{auth,admin}.visual-parity.spec.ts/*.png` | 是 |
| 自基线快照 | `tests/visual/__screenshots__/{auth,admin}.visual.spec.ts/*.png` | 是 |
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

### 6.5 2026-11-09 M4-2 批次（安全设置）

**范围**：`/security` 6 张参考态，采自迁移前提交 `e4428b9`。会话表 token / IP / 创建 / 过期列加 `data-visual-mask`；会话类页面按用例创建独立账号（随机后缀），避免同一账号反复登录让会话行数随用例顺序增长。

**迁移面**：`pages/security.vue` 返回按钮；`two-factor-panel`（Message / Button / InputText / Password / Dialog）；`session-table`（Button / 3 个 Dialog）；`useSecuritySettings` 10 处 Toast 切到 caomei。`BaseDialogV2` 增加 `footer` 插槽与 `hide` 事件转发；会话表的对话框用 `:visible` + `@update:visible` 显式绑定（`v-model` 会触发 `vue/no-mutating-props`）。

**差异（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `security-light-desktop-default` | 26,641 / 3% |
| `security-dark-desktop-default` | 80,232 / 7% |
| `security-light-mobile-default` | 21,765 / 7% |
| `security-dark-mobile-default` | 43,095 / 14% |
| `security-light-desktop-enable-2fa-dialog` | 62,470 / 5% |
| `security-light-desktop-revoke-all-confirm` | 68,912 / 6% |

**接受项**：按钮由 PrimeVue 默认改为 caomei 主色 / 描边尺度；`CaomeiMessage` 语气底色与图标替换；对话框标题栏与关闭按钮形态变化。

### 6.6 2026-11-09 M4-3 批次（OAuth 同意页）

**范围**：`/oauth/consent` 4 张参考态，采自迁移前提交 `ca6661d`。测试库在 `prepare-visual-db.mjs` 中预置固定 OAuth 客户端 `visual-client`（名称 / 描述 / 官网 / scopes），授权页才能渲染应用信息；矩阵新增 `readySelector`（该页不使用 `.auth-card` 布局）。

**迁移面**：页面 3 个按钮（返回首页 / 拒绝 / 授权）改 CaomeiButton；`useOAuthConsent` 7 处 Toast 切 caomei。页面原有的 `.btn-allow` PrimeVue CSS 变量配色改为 caomei 变体，仅保留禁用态透明度。

**差异（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `oauth-consent-light-desktop-default` | 12,407 / 1% |
| `oauth-consent-dark-desktop-default` | 13,595 / 2% |
| `oauth-consent-light-mobile-default` | 12,534 / 4% |
| `oauth-consent-dark-mobile-default` | 13,721 / 5% |

**接受项**：按钮由 PrimeVue 默认 / 主色改为 caomei 主色与描边尺度。

### 6.7 2026-11-09 M4-4 批次（SSO 登录页）

**范围**：`/sso-login` 4 张参考态，采自迁移前提交 `ba07d26`。该页声明 `definePageMeta({ auth: false })`，但全局路由守卫只认 `publicPaths`，未登录会被重定向到 `/login`；同批把 `/sso-login` 加入白名单。

**迁移面**：4 个登录表单（`InputText` → `BaseInputV2` + 标签）、5 个按钮、Provider 卡片 `Badge` → `CaomeiTag`、`useSsoLoginFlow` 6 处 Toast 切 caomei；`:deep(.p-button)` 改为 `:deep(.caomei-button)`。

**同批修复（桥接范围）**：表单字号 / 控件尺度桥接此前只作用于 `.auth-card`，独立布局的 `/sso-login`、`/oauth/consent` 仍用 caomei 默认（标签 12px、输入 36px）。把 token 作用域扩为 `.auth-card, .sso-login, .oauth-consent`，字段块外边距仍只在 `.auth-card` 生效。

**差异（像素 / 占比）**

| 快照 | 像素 / 占比 |
| :--- | ---: |
| `sso-login-light-desktop-default` | 37,250 / 3% |
| `sso-login-dark-desktop-default` | 60,252 / 5% |
| `sso-login-light-mobile-default` | 24,798 / 8% |
| `sso-login-dark-mobile-default` | 37,149 / 12% |

**接受项**：按钮高度 47 → 40px、卡片内边距与输入框宽度由 caomei token 接管；`/oauth/consent` 的按钮尺度随桥接扩展一并变化（自基线已重采）。

### 6.8 2026-11-09 M6-1 收口

**结果**：参考态 / 自基线各 50 张，`pnpm test:visual` **50/50 通过**；CI `visual` job 保持自基线阻断。

**收口复测发现并修复**：`register 校验错误态` 在页面显示 `validation.emailInvalid` 等原始键。原因是 `useRegisterFlow` 的自定义 `validate` 直接回填 `err.message`，绕过了 `useForm` 的 `useValidationMessage`；同批修复 `use-forgot-password-flow` 发送验证码路径的同类漏点。修复后复测 50/50。

**遗留**：2FA / captcha / Toast 状态仍受环境限制，转入 [backlog](../../plan/backlog.md) 视觉覆盖候选；收口汇总见 [阶段 3 收口记录](./2026-11-09-phase3-closure.md) §5。

## 7. 已知限制

- **跨环境已用镜像固定**：本地与 CI 共用同一 Playwright 镜像；宿主直跑与容器相差约 1% 像素，故宿主结果不作判定依据。镜像升级或 playwright 版本变化时，必须重采自基线并在 PR 中说明。
- **未覆盖状态**：2FA 弹窗视觉（需已启用 2FA 的测试账号）、验证码启用态（需 captcha provider）、提交中 / 提交成功 Toast（需真实后端）。这些状态在环境具备后追加，并同批补参考态。
- **已覆盖十六个入口**：认证面九页 + Admin 面 `/admin/users`、`/admin/oauth/applications`、`/admin/sso/providers`、`/admin/logs`、`/oauth/clients`、`/`、`/error`；Admin 矩阵由阶段 4 P4-0 建立，见 [P4-0 决策记录](./2026-11-10-p4-0-decisions.md) §6。
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
