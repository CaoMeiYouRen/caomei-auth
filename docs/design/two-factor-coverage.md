# 2FA 覆盖矩阵（阶段 11）

> **状态**：2026-11-21 建立并随阶段 11 各条目更新；当前 M1–M5 均已接线，验收进度见 [todo.md](../plan/todo.md)。
> **范围与决策**：[阶段 11 范围登记](./governance/2026-11-21-phase11-registration.md)。
> **唯一口径**：[安全规范 §1.3](../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)。
> **实现**：`server/utils/two-factor-coverage/`（通道定义、挑战适配、插件）。

## 1. 覆盖矩阵

| 通道 | 端点 | 响应形态 | 开关 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| 邮箱 OTP 登录 | `POST /sign-in/email-otp` | JSON `twoFactorRedirect` | `TWO_FACTOR_COVERAGE_EMAIL_OTP` | 已交付（集成测试） |
| 手机 OTP 登录 | `POST /phone-number/verify` | JSON `twoFactorRedirect` | `TWO_FACTOR_COVERAGE_PHONE_OTP` | 已交付（集成测试） |
| 邮箱验证码验证 | `POST /email-otp/verify-email` | JSON `twoFactorRedirect` | `TWO_FACTOR_COVERAGE_EMAIL_VERIFICATION` | 已交付（集成测试） |
| 邮箱验证链接 | `GET /verify-email` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_EMAIL_VERIFICATION` | 已交付（集成测试） |
| 魔法链接 | `GET /magic-link/verify` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_MAGIC_LINK` | 已交付（集成测试） |
| 社交回调 | `GET /callback/:id` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_SOCIAL` | 已交付（genericOAuth fixture provider 端到端） |
| 社交 `idToken` 直登 | `POST /sign-in/social` | JSON `twoFactorRedirect` | `TWO_FACTOR_COVERAGE_SOCIAL` | 处理链已交付（handler 契约测试）；原生客户端端到端未覆盖 |
| SSO OIDC 专属回调 | `GET /sso/callback/:providerId` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_SSO` | 已交付（fixture OIDC provider 端到端） |
| SSO OIDC 共享回调 | `GET /sso/callback` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_SSO` | 已交付（fixture OIDC provider 端到端） |
| SAML ACS | `GET/POST /sso/saml2/sp/acs/:providerId` | 302 `/login?twoFactor=1` | `TWO_FACTOR_COVERAGE_SSO` | 处理链已交付（handler 契约测试）；真实 IdP 断言未覆盖 |
| 邮箱 / 用户名 / 手机号 + 密码 | `/sign-in/email`、`/sign-in/username`、`/sign-in/phone-number` | JSON `twoFactorRedirect` | 上游 two-factor 插件 | 不变（既有能力） |

**不在覆盖内**（D11）：匿名登录、新用户注册即登录、管理员扮演（`/admin/impersonate-user`）。

## 2. 实现约束

- 上游 1.7.20 的 two-factor 插件只按 `signInPaths` 匹配；本项目在插件 `hooks.after` 中通过 `ctx.context.getPlugin('two-factor')` 取得插件自身的 after-hook，以 `{ ...ctx, returnHeaders: true }` 调用，再复制 `Set-Cookie`。
- `returnHeaders` 不在 `createAuthMiddleware` 的公开类型中，属**非公开契约**；`tests/unit/server/two-factor-coverage-core.spec.ts` 固定「挑战成功 / 信任设备命中 / 无 2FA 用户不受影响」。
- 挑战失败或适配器异常一律 fail-closed：不保留可用会话；不重写 TOTP / OTP / 备份码 / 信任设备判定。
- `/verify-email`、`/email-otp/verify-email`、`/phone-number/verify` 在请求已带同一用户有效会话时不重复挑战（验证邮箱 / 绑定手机场景）。
- 浏览器导航通道统一 302 到 `/login?twoFactor=1&channel=<通道>&redirect=<站内白名单路径>`；XHR 通道返回 `{ twoFactorRedirect, twoFactorMethods, channel }`。社交 / SSO 的原始 `callbackURL` 存在 OAuth / SSO state 中，当前回跳暂为 `/`；从 state 回填待 M3.3 收口项处理。
- 逐通道开关缺省全部为 `true`；关闭单通道等价回退到「仅凭据登录触发 2FA」。

## 3. 可选撤销（D14）

升级前已建立的会话不回溯；需要立即生效的部署可执行（表名按 `DATABASE_ENTITY_PREFIX` 调整）：

```sql
DELETE FROM session
WHERE userId IN (SELECT id FROM user WHERE twoFactorEnabled = 1);
```

执行前先备份并按部署类型确认表前缀；本阶段不提供自动脚本，避免在多数据库方言上引入未测试的写入路径。

## 4. 测试与已知边界

- 集成测试：`two-factor-coverage-core.spec.ts`（邮箱 OTP、信任设备、开关关闭、适配器失败、SAML / idToken 契约、通道匹配）、`two-factor-coverage-email-phone.spec.ts`（邮箱验证码 / 链接、魔法链接、手机 OTP、绑定手机、同用户跳过）、`two-factor-coverage-factors.spec.ts`（备份码、TOTP、重放 / 过期、限流、失败审计）；`two-factor-coverage-social.spec.ts`（genericOAuth 回调端到端）；`two-factor-coverage-sso.spec.ts`（OIDC 专属 / 共享回调端到端）。
- 未覆盖：社交 / SSO 真实 IdP 回调、跨实例限流、既有会话回溯（D14）。
- 审计：挑战签发写 `twoFactor.challenge`（含 `channel`），因子验证写 `twoFactor.verify`（含 `factor`、`result` 与成功时的 `trustDevice`）；不含验证码 / 备份码明文。
