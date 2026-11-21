# 2026-11-21 阶段 11 收口记录：2FA 覆盖收紧与登录通道闭环

> **状态**：M1–M5 交付，2026-11-21 收口；M3.3（OAuth 授权链 state 回跳）与会话撤销脚本迁入 backlog。
> **范围与验收**：[阶段 11 范围登记](./2026-11-21-phase11-registration.md)。
> **阶段正文与提交清单**：[todo-archive-phases-11](../../plan/archive/todo-archive-phases-11.md)；里程碑见 [roadmap-phases-11](../../plan/archive/roadmap-phases-11.md)。
> **前置**：[阶段 10 收口记录](./2026-11-21-phase10-closure.md)、[阶段 9 收口记录](./2026-11-20-phase9-closure.md)。

## 1. 交付清单

| 条目 | 交付 | 状态 |
| :--- | :--- | :--- |
| M1.1 | 会话入口矩阵（`docs/design/two-factor-coverage.md`）、通道 ID 共享白名单、契约测试骨架 | 完成 |
| M1.2 | 挑战适配器：复用上游 two-factor after-hook（`{ ...ctx, returnHeaders: true }`）、Set-Cookie 复制、失败路径删除孤儿会话与双作用域 scrub | 完成 |
| M1.3 | 六通道显式开关（`TWO_FACTOR_COVERAGE_*`），默认开启、非法值回落、`.env.example` 同步 | 完成 |
| M2.1 | 邮箱 OTP（`/sign-in/email-otp`）与手机 OTP（`/phone-number/verify`）接入挑战 | 完成 |
| M2.2 | 魔法链接（`/magic-link/verify`）302 挑战、站内回跳白名单、重放 / 过期拒绝 | 完成 |
| M2.3 | 邮箱验证码（`/email-otp/verify-email`）与验证链接（`/verify-email`）挑战；同用户已登录跳过、跨用户必须挑战 | 完成 |
| M3.1 | 内置社交回调（`/callback/:id`）与 `/sign-in/social` 的 `idToken` 分支 | 完成 |
| M3.2 | genericOAuth fixture provider 端到端回调 | 完成 |
| M3.3 | OAuth provider authorize / consent 的 state 回跳 | **迁入 backlog**（原 M3.3） |
| M4.1 | TOTP / 备份码 / 邮件 OTP / 信任设备回归（含过期与挑战记录撤销）、`/two-factor/*` 限流 | 完成 |
| M4.2 | `twoFactor.challenge` / `twoFactor.verify` 审计（含 `trustDevice`）、错误分类与 5 语键 | 完成 |
| M4.3 | `security.md` 覆盖口径与 SQL 撤销口径 | 完成（自动脚本迁 backlog） |
| M5.1 | 登录页 `?twoFactor=1` 自动弹窗、通道提示、站内回跳、取消重试、参数清理 | 完成 |
| M5.2 | 5 语文案；桌面 / 平板 / 移动 × 浅 / 暗 6 张视觉基线；全量视觉 144 passed | 完成 |
| M5.3 | 文档、门禁与归档 | 完成 |

## 2. 终态指标

| 指标 | 收口值 | 对照（阶段 10） |
| :--- | :--- | :--- |
| 测试 | **1370 passed / 195 files** | 1325 / 188 |
| 视觉 | **144 passed**（新增 6 张 2FA 弹窗基线） | 138 |
| 提交 | **1 个实现提交** `f746fda` + 收口提交 | 19 |
| 质量门 | `lint` / `lint:css` / `typecheck` / `test` / `i18n:check` / `lint:md:check` / `planning:check` / `quality:file-size` / `lint:duplicate` / `test:visual` 全绿 | 同左 |

## 3. 阶段级变更

- **挑战基座**：新增 `server/utils/two-factor-coverage/{channels,challenge,plugin}.ts`；`lib/auth.ts` 只增加插件注册一行。适配器通过 `ctx.context.getPlugin('two-factor')` 复用上游 after-hook，非公开契约由契约测试锁定。
- **通道**：邮箱 / 手机 OTP、邮箱验证码 / 链接、魔法链接、内置 / genericOAuth 社交回调与 `idToken`、SSO OIDC 专属 / 共享回调、SAML ACS；匿名、新用户注册即登录、管理员扮演明确排除。
- **开关**：`TWO_FACTOR_COVERAGE_EMAIL_OTP / PHONE_OTP / MAGIC_LINK / EMAIL_VERIFICATION / SOCIAL / SSO`，默认 `true`；关闭单通道等价回退。
- **登录页**：`utils/web/login-challenge.ts` 解析查询与站内回跳；`composables/use-login-flow.ts` 自动弹窗、成功后回跳、取消重试、URL 清理；弹窗抽为 `components/auth/two-factor-dialog.vue`。
- **错误与审计**：`utils/web/two-factor-errors.ts` 区分验证码 / 会话 / 通道；`AUDIT_ACTIONS` 新增 `twoFactor.challenge`、`twoFactor.verify`，验证事件含 `factor`、`result`、成功时的 `trustDevice`。
- **治理**：`security.md` §1.3 覆盖口径、`docs/design/two-factor-coverage.md` 矩阵、`.env.example` 开关、5 语文案与错误键；`todo.md` / `roadmap.md` 归档为分片。

## 4. 与范围登记的偏差

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| M3.3 OAuth 授权链 | 端到端回到 authorize / consent | 迁入 backlog | state 中的 `callbackURL` 回填与授权请求保持需要额外端到端夹具；当前挑战回跳为 `/`，不影响安全性 |
| M4.3 撤销脚本 | 可选脚本（dry-run / `--confirm`） | 仅 SQL 口径 | 多数据库方言下的脚本需独立测试；避免在认证阶段引入未测试写入路径 |
| 视觉矩阵 | 390 / 768 / 1440 | 6 张基线（3 视口 × 浅 / 暗） | 与阶段 7 平板矩阵口径一致；交互态不纳入全站默认矩阵 |
| 提交数 | 16–19 | 1 个实现提交 + 收口提交 | 用户要求按批次提交；实现、测试、视觉与文档作为单一逻辑变更提交 |

## 5. 遗留与已知边界

- **OAuth provider 授权链**：社交 / SSO 的原始 `callbackURL` 在 state 中，当前挑战后回跳为 `/`；需要从 state 读取并回到 authorize / consent（backlog）。
- **会话撤销脚本**：升级前已建立的会话不回溯（D14）；需要立即生效的部署使用文档中的 SQL，自动脚本待补（backlog）。
- **真实 IdP**：社交 / SSO 端到端使用 fixture provider；真实企业 IdP 的断言未覆盖。
- **多实例限流**：沿用进程内限流；多实例部署按实例计数（backlog）。
- **短信 OTP 作为第二因子**：沿用上游 email-first + 手机回落；未单独构造未配置短信的挑战矩阵。

## 6. 验证命令

```bash
pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm i18n:check && \
pnpm lint:md:check && pnpm planning:check && pnpm quality:file-size && \
pnpm lint:duplicate && pnpm test:visual
```
