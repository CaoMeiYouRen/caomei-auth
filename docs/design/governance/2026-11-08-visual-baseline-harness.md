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

- **本阶段只建参考态层**：`tests/visual/parity/*.visual-parity.spec.ts` + `playwright.visual-parity.config.ts`，参考态入库。
- **不建自基线层**：迁移差异完成归因、待修项清零后再采集「当前接受状态」自基线（`tests/visual/__screenshots__/`），用于后续回归。届时再评估分级预算与允许清单。
- **不接入 CI 阻断**：参考态比对尚未在 CI 复采，跨环境（本地与 ubuntu runner）渲染差异未验证，接入前不得作为阻断门禁。
- **不追求像素级一致**：`threshold 0.2` + `maxDiffPixels 200` 只吸收抗锯齿噪声；超限即报告差异，由人工归因。

## 3. 参考态矩阵（14 张）

| 路由 | 主题 | 视口 | 状态 | 快照 |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | 浅 / 暗 | 1440×900 / 390×844 | 默认（用户名 Tab） | `login-{theme}-{viewport}-default` |
| `/login` | 浅 | 1440×900 | 校验错误 | `login-light-desktop-error` |
| `/login` | 浅 | 1440×900 | 用户名 / 邮箱 / 手机号 Tab | `login-light-desktop-tab-{username,email,phone}` |
| `/register` | 浅 / 暗 | 1440×900 / 390×844 | 默认（邮箱 Tab） | `register-{theme}-{viewport}-default` |
| `/register` | 浅 | 1440×900 | 校验错误 | `register-light-desktop-error` |
| `/register` | 浅 | 1440×900 | 手机号 Tab | `register-light-desktop-tab-phone` |

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
| 服务环境 | `NODE_ENV=test` + 空 sqlite + `synchronize` | 每次启动前重建空库，页面不依赖种子数据 |
| 功能开关 | 用户名 / 手机号登录开；验证码关；Demo 角标关 | 社交渠道固定 github / google / wechat（假凭据，仅渲染） |
| 动态区域 | `[data-visual-mask]` 显式遮蔽 | 本批两页无动态内容，暂未使用 |

环境元数据与逐快照清单记录于 [`tests/visual/reference-manifest.json`](../../../tests/visual/reference-manifest.json)。

## 5. 命令与产物

```bash
# 1) 采集参考态（只能在迁移前提交上执行；VISUAL_REFERENCE_CAPTURE 守卫会拒绝迁移后的页面）
pnpm test:visual:reference

# 2) 比对当前渲染 ↔ 参考态
pnpm test:visual:parity

# 3) 定向比对单个快照
pnpm exec playwright test --config=playwright.visual-parity.config.ts --grep "login 默认态"
```

| 产物 | 路径 | 是否入库 |
| :--- | :--- | :--- |
| 参考态快照 | `tests/visual/reference/auth.visual-parity.spec.ts/*.png` | 是 |
| 环境与清单 | `tests/visual/reference-manifest.json` | 是 |
| 失败产物 `-actual` / `-diff` | `test-results/visual-parity/` | 否（`.gitignore`） |
| HTML 报告 | `playwright-report/visual-parity/` | 否（`.gitignore`） |

前置条件：先 `pnpm build`（`webServer` 直接运行 `.output/server/index.mjs`），且 `3100` 端口未被其他构建占用。

## 6. 判定与差异处置

1. 迁移提交后运行 `pnpm test:visual:parity`，逐项阅读 `-diff.png` 与像素数。
2. 每项差异写入该批次迁移记录的「视觉差异」段：路由 / 场景 / 差异 / 归因 / 证据。
3. 归因分两类：
    - **有意差异**（圆角 8px→6px、暗色底 `#121212`→`#18181b`、状态色取 500 档、Toast 残余）：登记后不刷新参考态，差异保留为已知项。
    - **待修**（遮挡、布局断裂、对比度不足、意外位移）：登记为临时待办并修复。
4. **参考态不得原地刷新**。需要重新审计时，用 `git show <参考态提交>:tests/visual/reference/...` 取回，而不是重新采集。

> 参考态第一次提交即 `fc2201e` 的渲染原貌；后续任何一次「更新参考态」都会破坏其自证能力。

## 7. 已知限制

- **跨环境未验证**：参考态在本地 WSL2（linux x64）采集。迁移评估 §8.2 口径要求「跨环境差异无法消除时以 CI 产物为唯一基线来源」，因此 CI 接入前必须先在 ubuntu runner 复采并刷新 `reference-manifest.json`。
- **未覆盖状态**：2FA 弹窗视觉（需已启用 2FA 的测试账号）、验证码启用态（需 captcha provider）、提交中 / 提交成功 Toast（需真实后端）。这些状态在环境具备后追加，并同批补参考态。
- **仅认证两页**：P3 其余页面（忘记 / 重置 / 修改密码、快速登录、个人资料、安全设置、OAuth 同意、SSO）在各自迁移前补采。
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
