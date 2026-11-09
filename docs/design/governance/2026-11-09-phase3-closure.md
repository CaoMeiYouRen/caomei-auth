# 2026-11-09 阶段 3 收口记录：caomei-ui P2–P3 与 i18n 非组件面

> **状态**：M6-1 收口完成；阶段 3 主体已交付，**剩余 M0-3 发布链路定时验证**（2026-11-14 20:00 UTC+8 或手动 dispatch）。
> **单一事实源**：阶段范围与验收见 [阶段 3 登记记录](./2026-11-06-phase3-registration.md)；原子条目状态见 [todo.md](../../plan/todo.md)；本记录只汇总交付结果、质量门与回退证据。
> **关联**：[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[视觉参考态基座](./2026-11-08-visual-baseline-harness.md)｜[i18n 实施方案](../../standards/i18n.md)｜[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)

## 1. 结论

- **P2–P3 九条路由完成整页切换**：登录、注册、忘记密码、修改密码、快速登录、个人资料、安全设置、OAuth 同意、SSO 登录。
- **路由白名单收敛为 9 条**，已迁移页面与配套共享组件无 PrimeVue 标签 / 显式导入；P4 路由未登记。
- **视觉基线 50/50 通过**：参考态与自基线各 50 张，CI 自基线阻断；收口时发现并修复 1 处校验消息回归。
- **i18n 非组件面 M5-1～M5-3 完成**：`validation.*` / `errors.*` 键同构、治理脚本与门禁、认证类 API 错误与响应头。
- **包体预算通过**：入口 CSS `+2.87%`（上限 `+10%`）；入口 JS / 总 JS / 总 CSS 记录并归因。
- **未做**：P4 Admin 数据页、P5 卸载 PrimeVue、页面文案翻译、邮件 / `User.locale`、SEO 放量、2FA / captcha 视觉补采（见 §9）。

## 2. 路由白名单收口

最终白名单（`utils/shared/caomei-ui-migration.ts`）：

```ts
['/login', '/register', '/forgot-password', '/change-password', '/quick-login', '/profile', '/security', '/oauth/consent', '/sso-login']
```

| 路由 | 批次 | 迁移提交 | 验证 |
| :--- | :--- | :--- | :--- |
| `/login` | M2-1 | `228116c` | 登录三 Tab / 校验 / 密码显隐 / 明暗 / 移动 |
| `/register` | M3-1 | `0169d40` | 注册双 Tab / 校验 / 手机号 / 密码强度 / 明暗 |
| `/forgot-password` | M3-2 | `a9d1081` | 找回密码双 Tab / 校验 / 验证码 |
| `/change-password` | M3-2 | `a9d1081` | 修改密码 / Tab / 明暗 |
| `/quick-login` | M3-3 | `76dbce9` | 邮件 / 手机验证码登录 |
| `/profile` | M4-1 | `f7ab000` + `8f97d3f` | 展示组件 + 3 个对话框 + Toast / Confirm |
| `/security` | M4-2 | `2016e05` | 2FA / 会话 / 账号绑定 |
| `/oauth/consent` | M4-3 | `422f8d9` | 同意 / 拒绝 / 撤销 |
| `/sso-login` | M4-4 | `9c9ee98` | 4 种登录表单 + Provider 卡片 |

白名单校验收口：

- `tests/unit/utils/shared/caomei-ui-migration.spec.ts` 新增：每条白名单路由必须有对应页面文件；已迁移页面与共享 V2 组件不得出现 PrimeVue 模板标签或 `from 'primevue/*'`；P4 路由不得命中白名单。
- `docs/design/governance/primevue-usage-snapshot.json` 已更新至收口态：**24 族 / 195 开标签 / 31 个 `.vue` 文件**；九条已迁移页面均不在快照中。
- P4 仍使用 PrimeVue 的入口：`pages/oauth/clients.vue`、`pages/admin/{users,oauth/applications,sso/providers,logs}.vue`、Admin 组件族、`pages/index.vue`、`error.vue` 与 `components/base/*` 共享封装。

## 3. 包体复测

测量命令：`pnpm build && pnpm migration:measure --json=docs/design/governance/bundle-after-m6-1-2026-11-09.json --quiet`。

| 指标 | M1-1 基线（2026-11-08） | M6-1 收口（2026-11-09） | 变化 | 预算 | 结论 |
| :--- | ---: | ---: | ---: | :--- | :--- |
| 入口 CSS（`keyCss`） | 399,733 B | 411,221 B | +11,488 B / **+2.87%** | ≤ +10% | 通过 |
| 入口 JS（`entry` chunk） | 431,270 B | 485,133 B | +53,863 B / +12.49% | 记录，不设硬预算 | 已归因 |
| 全部 JS | 3,517,848 B | 3,688,378 B | +170,530 B / +4.85% | 记录 | 已归因 |
| 全部 CSS | 1,608,872 B | 1,795,225 B | +186,353 B / +11.58% | 记录 | 双库并存 |

**入口 JS 增幅归因**：双库并存期入口包含 caomei-ui 运行时、9 个 V2 薄封装、迁移后页面共享逻辑，以及 M5 新增的 `validation` / `errors` 语言包；PrimeVue 仍为 P4 保留，未到 P5 卸载阶段。预算只对 `keyCss` 设硬上限，与 [P0 §5.3](./2026-11-05-caomei-ui-p0-baseline.md#53-2026-11-08-m1-1-复测基线) 一致。

**CI 接入（M6-1 决策）**：新增 `pnpm migration:check-budget`（`scripts/migration/check-bundle-budget.mjs`），读取 M1-1 基线，入口 CSS 超过 `+10%` 时失败；`test.yml`、`release.yml`、`regression-weekly.yml` 在 `pnpm build` 之后执行。入口 JS / 总 JS / 总 CSS 仅输出记录，不设硬阈值，避免在双库共存期产生无依据的阻断。

## 4. PrimeVue 用量变化

| 指标 | M1-1 基线 | M6-1 收口 | 变化 |
| :--- | ---: | ---: | ---: |
| 组件族 | 30 | 24 | -6 |
| 开标签 | 301 | 195 | -106 |
| 使用 PrimeVue 的 `.vue` 文件 | 50 | 31 | -19 |
| 已迁移页面在快照中 | 0 | 0 | 保持 |

剩余面集中在 P4：Admin 数据表 / 日志 / OAuth 应用 / SSO 提供商、`oauth/clients`、首页与错误页，以及 `components/base/*` 共享封装。P4 开工前需重新评估白名单、包体与视觉差异台账（[迁移评估 §12](./2026-11-05-caomei-ui-migration-evaluation.md#12-上收触发条件)）。

## 5. 视觉基线

- 矩阵：**每层 50 张**（参考态 `tests/visual/reference/` + 自基线 `tests/visual/__screenshots__/`），覆盖九条路由 × 浅色 / 暗色 × 桌面 / 移动 × 交互态。
- CI：`.github/workflows/test.yml` 的 `visual` job 在固定 Playwright 容器内运行；自基线阻断，参考态审计仅出报告。
- **M6-1 收口复测发现并修复**：`useRegisterFlow` 的自定义 `validate` 直接回填 `err.message`，绕过了 `useForm` 的 `useValidationMessage`，在页面显示 `validation.emailInvalid` 等原始键。已改为 `translate(err.message)`；同时修复 `use-forgot-password-flow` 发送验证码路径的同类漏点。复测 **50/50 通过**。
- 2FA 弹窗、验证码启用态、提交中 / Toast 状态仍未覆盖，转入 backlog（见 §9）。

## 6. i18n 非组件面

| 条目 | 交付 |
| :--- | :--- |
| M5-1 | 76 个 `validation.*` 键 zh/en 同构；schema 消息改为键；边界统一 `resolveValidationMessage`，无上下文回退 zh-CN |
| M5-2 | 5 个治理脚本 + 共享 lib；`i18n:check` 接入 3 个 workflow 与 `lint-staged`；硬编码中文基线（114 文件 / 1430 行） |
| M5-3 | 17 个 `errors.*` 键；认证类 API 使用 `useTranslation(event)`；`Content-Language` / `Vary` 覆盖错误响应；不可用时回退 zh-CN |

当前语言包共 **99 个键**，`zh-CN` / `en-US` 同构；`en-US` 保持 `ui-ready`，不进入 sitemap / SEO 放量。页面静态文案仍为中文，本阶段未翻译。

## 7. 回退验证

**约束**：迁移不涉及数据库 schema、API 契约或存储格式，回退不需要数据恢复；V2 薄封装可按需保留，不影响未引用路由。

**已验证**（临时 worktree，基于收口提交）：

- `76dbce9`（快速登录）、`f7ab000`（个人资料展示）、`9c9ee98`（SSO 登录）`git revert --no-commit` 干净通过。
- `228116c`、`0169d40`、`a9d1081`、`8f97d3f`、`2016e05`、`422f8d9` 直接 revert 会与后续共享文件（`styles/_form.scss`、`utils/shared/caomei-ui-migration.ts`、`primevue-usage-snapshot.json`、视觉基线）冲突；应按路由回退，而不是机械 revert。
- 完整阶段回退未做 dry-run；不建议直接 revert 整个区间。

**单路由回退步骤**：

1. 将页面恢复为迁移前版本：`git checkout <该批提交>^ -- pages/<route>.vue`；若该批还有路由私有组件，一并恢复。
2. 从 `CAOMEI_UI_ROUTE_PREFIXES` 移除该路由，并同步 `tests/unit/utils/shared/caomei-ui-migration.spec.ts`。
3. 保留共享 V2 封装（其他已迁移路由仍引用）；确认该路由布局回落到 PrimeVue（`isCaomeiUiPage` 为 false）。
4. 执行 `pnpm typecheck`、该页定向测试与视觉回归；若视觉基线不再匹配，按回退后状态重采该路由自基线。

**整阶段回退**：恢复 `utils/shared/caomei-ui-migration.ts` 为空集，页面与 `styles/_form.scss` 回到 `fc2201e` 前后状态，保留 `caomei-ui` 基座（P0/P1）以免影响其他能力；再执行全量质量门。

## 8. 质量门

| 检查 | 结果 |
| :--- | :--- |
| `pnpm lint` | 0 error（25 个既有 warning） |
| `pnpm lint:css` | 通过 |
| `pnpm typecheck` | 通过 |
| `pnpm test` | **130 文件 / 967 用例通过** |
| `pnpm build` | 通过 |
| `pnpm migration:check-budget` | 通过（入口 CSS +2.87%） |
| `pnpm test:visual` | **50/50 通过**（固定容器） |
| `pnpm i18n:check` | 通过 |
| `pnpm ai:check` / `pnpm migration:check-imports` | 通过 |
| `pnpm lint:md` / `pnpm lint:duplicate` | 通过 |

## 9. 遗留与后续

| 项 | 状态 / 去向 |
| :--- | :--- |
| M0-3 `release.yml` 定时发版 | 待 2026-11-14 20:00 UTC+8 或手动 dispatch 验证；文档已登记 |
| 2FA 弹窗 / 验证码启用态 / Toast 视觉 | 需测试账号与 captcha provider；转入 [backlog](../../plan/backlog.md) 视觉覆盖候选 |
| P4 Admin 数据页与 `oauth/clients` | 未授权候选；需重新评估白名单、包体与视觉差异台账 |
| P5 卸载 PrimeVue | 未授权候选；依赖 P4 完成 |
| i18n 页面文案 / 邮件 / `User.locale` / SEO | 未授权候选；见 [backlog §1.2](../../plan/backlog.md#12-i18n-全量落地) |

## 10. 关联文档

- [阶段 3 登记记录](./2026-11-06-phase3-registration.md)｜[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[P0 基线与护栏](./2026-11-05-caomei-ui-p0-baseline.md)
- [视觉参考态基座](./2026-11-08-visual-baseline-harness.md)｜[i18n 实施方案](../../standards/i18n.md)
- [todo.md](../../plan/todo.md)｜[backlog.md](../../plan/backlog.md)｜[roadmap.md](../../plan/roadmap.md)｜[已完成工作归档](../../archive/completed-work.md)
