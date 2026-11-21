# 2026-11-21 阶段 11 范围登记：2FA 覆盖收紧与登录通道闭环

> **状态**：2026-11-21 登记（尚未开工）。§2 的 D11–D17 为拟定口径，随登记生效；如用户改判，M1 开工前同批更新本文件、[todo.md](../../plan/todo.md) 与 [security.md](../../standards/security.md)。
> **依据**：[账号找回与 2FA 边界设计草案](./2026-11-18-account-recovery-design.md) §6「阶段 4：收紧 2FA 覆盖」、[backlog §2.12](../../plan/backlog.md)、[安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)、阶段 10 收口记录 §5「后续方向」。
> **前置**：[阶段 10 收口记录](./2026-11-21-phase10-closure.md)（恢复码 / 已验证手机 / 冷静期 / OAuth-only 自助设密码）与 [阶段 9 收口记录](./2026-11-20-phase9-closure.md)（管理员协助恢复，设计草案阶段 2 的核心）。设计草案原文要求「阶段 2 / 3 已上线」：阶段 3 随阶段 10 交付、管理员协助恢复随阶段 9 交付，阶段 2 剩余审批流 / 工单不构成本阶段前置；「管理端重置 2FA」已被 D4 永久排除，本阶段按「用户侧恢复已具备」判定前置满足，L2 为已接受边界（见 §8）。
> **规划模型**：5 大条目 / 15 小条目（[规划规范](../../standards/planning.md) §4 / §7 / §8）。

## 1. 目标

- 开启 2FA 的用户，任何**会创建会话的用户自助登录通道**都必须通过第二因子：邮箱 OTP 登录、手机 OTP 登录、邮箱验证码验证后自动登录（`/email-otp/verify-email`）、魔法链接、邮箱验证链接自动登录、社交登录（内置 + genericOAuth + `idToken` 直登）、SSO（OIDC / SAML）。
- 收紧以「复用上游 2FA 挑战」为唯一实现路径，不重写 TOTP / OTP / 备份码 / 信任设备判定；所有通道与「邮箱 / 用户名 + 密码」共享同一挑战语义。
- 提供逐通道显式开关与回退路径，出问题时只关通道、不回滚代码；发布说明与安全规范写清覆盖矩阵、既有会话边界与死锁边界（L2）。
- 不扩大恢复面：恢复码仍**不参与**登录第二因子（[安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)），管理员仍不得重置 2FA（D4）。

## 2. 决策记录（拟定，2026-11-21）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D11 | 覆盖通道范围 | 邮箱 OTP 登录、手机 OTP 登录、邮箱验证码验证后自动登录（`/email-otp/verify-email`）、魔法链接、邮箱验证链接自动登录、内置社交回调、genericOAuth 回调、`/sign-in/social` 的 `idToken` 直登、SSO OIDC（`/sso/callback/:providerId` 与共享 `/sso/callback`）与 SAML `/sso/saml2/sp/acs/:providerId`；范围限于用户自助登录通道，匿名登录、新用户注册即登录、管理员扮演（`/admin/impersonate-user`）不在覆盖内 | 设计草案风险表 P0「2FA 不覆盖邮箱 OTP / 手机 OTP / 社交 / 验证链接」；邮箱验证码与邮箱验证链接两条自动登录路径都会建会话；共享 SSO 回调与专属回调共用 `handleOIDCCallback` |
| D12 | 默认值与开关 | 逐通道显式布尔开关，默认全部 `true`；支持环境变量关闭单通道；不提供「默认关闭」的发布口径 | 项目验收总则要求「默认配置不弱于当前」；回退只关通道 |
| D13 | 响应形态 | XHR 通道返回 `{ twoFactorRedirect: true, twoFactorMethods }`；浏览器导航 / OAuth 回调 302 到 `/login?twoFactor=1&redirect=<安全回跳>`，由登录页现有 2FA 弹窗接管 | 登录页已有 TOTP / 邮件 OTP / 备份码三页签弹窗（`composables/use-login-flow.ts`） |
| D14 | 既有会话 | 不回溯校验；升级前已建立的会话按原有效期自然过期（最长 30 天）；提供可选运维脚本批量撤销 2FA 用户会话，默认不执行 | 避免升级即全员掉线；脚本给需要立即生效的部署使用 |
| D15 | 关闭 2FA 的门槛 | 本阶段保持「仅密码」，不改为「密码 + 第二因子」 | 覆盖收紧后已无可绕过会话入口；提高门槛会扩大「同时丢失因子」的死锁面，与 D4 / L2 冲突。候选转 backlog |
| D16 | SSO 例外 | SSO 使用单一 `sso` 开关（跨 provider 统一），不与其它通道共用总开关；**不做**按 provider 关闭本地 2FA | 按 provider 配置会引入新的配置面与误用风险；IdP 已强制 MFA 的部署可整体关闭 `sso` 开关，后续按需登记 backlog |
| D17 | OAuth provider 授权链 | 不改写 `oauth2/authorize` / 同意页逻辑：无会话先登录，登录阶段完成挑战后再回到授权链；本阶段只补端到端回归 | `oauthProvider` 不在登录通道清单内，它消费既有会话而非创建会话 |

## 3. 现状取证（2026-11-21）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 已覆盖通道 | 仅 `/sign-in/email`、`/sign-in/username`、`/sign-in/phone-number` | `node_modules/better-auth/dist/plugins/two-factor/index.mjs` 的 `signInPaths`（1.7.20） |
| 挑战机制 | after-hook 读取 `ctx.context.newSession`，删除凭据会话、写 `two_factor` cookie 与 `2fa-*` verification，返回 `twoFactorRedirect` + `twoFactorMethods`；信任设备读取 `trust_device` cookie | 同上 `index.mjs` 的 after-hook 与 `constant.mjs` |
| 未覆盖通道 | `/sign-in/email-otp`、`/email-otp/verify-email`（邮箱验证码验证后自动建会话）、`/phone-number/verify`（OTP 登录 + 自动建会话）、`/magic-link/verify`、`/verify-email`（`autoSignInAfterVerification: true`）、`/sign-in/social`（`idToken` 分支）、`/callback/:id`、`/sso/callback/:providerId`、`/sso/callback`（共享回调）、`/sso/saml2/sp/acs/:providerId`（SAML ACS） | `lib/auth.ts` 的 `emailVerification.autoSignInAfterVerification`、插件清单；`composables/use-login-flow.ts` 的手机 OTP 分支；`email-otp/routes.mjs` 的 `verifyEmailOTP`；`@better-auth/sso` 的 `callbackSSO` / `callbackSSOShared` / ACS 端点（均无条件注册） |
| 上游线索 | #12062「social sign-in 后要求第二因子」仍 open；#12210 的自定义 after-hook 接法已 closed completed（信任设备回归已修复；项目 1.7.20 由 M1.2 契约测试复核） | GitHub issue 快照，2026-11-21 |
| 可复用面 | 登录页 2FA 弹窗、`/api/security/two-factor/send-otp`、`logger.audit`、`server/utils/audit-log.ts` 的 `AUDIT_ACTIONS` | 阶段 9 / 10 交付 |
| 明确边界 | 恢复码不参与登录第二因子；管理员不得重置 2FA / 备份码；SSO 用户同时丢失 2FA 与备份码属 L2 | [安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels) |

> **实现约束**：上游未导出覆盖清单，首选路径是在项目级 `hooks.after` 中以 `{ ...ctx, returnHeaders: true }` 调用 two-factor 插件的 after-hook handler（通过 `ctx.context.getPlugin('two-factor')` 取得），再读取返回的 `headers` 复制 `Set-Cookie`；`returnHeaders` 不在 `createAuthMiddleware` 的公开类型中，属**非公开契约**。M1.2 先做可行性 spike；若上游版本不再支持，fallback 为自建 challenge（删除会话 + 写 `two_factor` cookie 与 `2fa-*` verification），仍不复制 TOTP / 备份码 / 信任设备判定。
>
> **排除说明**：`/sso/callback`（共享）与 `/sso/callback/:providerId` 共用同一 `handleOIDCCallback`，两者都必须覆盖，不能只按 provider 专属路径判断；SAML 的 `/sso/saml2/sp/slo/:providerId` 只做登出，不建会话，不纳入覆盖。

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 通道盘点与挑战基座 | 3 | 会话入口清单与失败断言、复用上游挑战的适配器、逐通道开关与回退 |
| M2 | 无密码会话通道 | 3 | OTP 登录（邮箱 / 手机）、验证码 / 链接验证后自动登录、魔法链接 |
| M3 | 社交与 SSO 通道 | 3 | 内置社交回调 + `idToken`、genericOAuth、SSO OIDC（共享 / 专属回调）与 SAML ACS + 授权链回归 |
| M4 | 恢复、审计与边界 | 3 | 因子与信任设备回归、审计与失败提示、关闭 2FA / 既有会话口径 |
| M5 | 界面、文档与收口 | 3 | 登录页挑战接线与文案、5 语与视觉基线、文档 / 门禁 / 归档 |

条目明细（8 要素与 4 项字段）见 [todo.md](../../plan/todo.md)。

## 5. 容量基线

- **commits 16–19 / files 45–60 / 行 2,000–2,800**（行 = diff 改动量含删除；测量方 = 规划角色，依据逐条目拆解与阶段 10 实际值）。
- 类型：🛠️ M1 / M2 / M3，🛡️ M1 / M3 / M4，🎨 M5，🧪 随条目内嵌。
- 小条目 15 条，每条 ≤10 文件 / 800 行新增；超出即拆。
- 说明：本阶段触点多在 `lib/auth.ts`（已 589 行，600 行硬上限），挑战适配与钩子必须落在独立模块，不得继续内联；这也是 M1.2 独立成条的原因之一。

## 6. 执行顺序

M1 → M2 → M3 → M4 → M5。

先有可复用的挑战适配与开关，再按「无密码通道 → 社交 / SSO」逐类接入；恢复与信任设备回归必须在一半通道接入后立即做（M4.1 可提前到 M2 完成后），最后统一收文案、视觉与文档。M1.1 的红灯断言是后续每条通道的完成定义。

## 7. 不做什么

- 不做「关闭 2FA 要求第二因子」（D15）、可信设备列表 / 吊销 UI、passkey / 硬件密钥（设计草案阶段 5）。
- 不做管理员重置 2FA / 备份码（D4）、管理员代设密码（D8）、审批流 / 工单。
- 不把恢复码扩展为登录第二因子；不改恢复码 / 备份码的签发与消费语义。
- 不做按 SSO provider 的本地 2FA 例外（D16）。
- 不改 `security.md` 的 L0 / L1 / L2 等级划分，只更新 2FA 覆盖边界与实现指针。
- 不引入 Redis 或跨实例限流存储；不做风险评分、异地登录告警。
- 不改登录页整体布局；不新增独立挑战页。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| 上游内部 hook 非公开契约（`returnHeaders` 非公开类型字段），升级后漂移或不可复用 | M1.2 先做 spike；契约测试固定「挑战成功 / 信任设备命中 / 无 2FA 用户不受影响」；不可复用时走自建 challenge fallback（删会话 + 写 cookie / verification，不复制因子校验） |
| 复制的响应 cookie 丢失导致「看似挑战、实际会话仍有效」 | 集成测试断言 cookie 集合与 DB 会话删除同时成立；失败即拒绝放行（fail-closed） |
| 浏览器 GET 通道返回 JSON 造成体验断裂 | D13 统一 302 到登录页；错误 / 回跳地址白名单校验，禁止开放重定向 |
| 一次性收紧全部通道导致用户投诉 | 逐通道开关 + 发布说明给出建议灰度路径（先关社交 / SSO，观察后再开）；默认值仍为全部开启 |
| 2FA 用户丢失全部因子后被收紧「锁死」 | 属已接受的 L2 边界；登录页与安全页明确提示「至少保留一个可用第二因子」，管理端不新增重置入口（D4） |
| `lib/auth.ts` 继续膨胀触发文件规模门禁 | 挑战适配、通道钩子、开关全部落在 `server/utils/two-factor-coverage/` 或等价独立模块，`lib/auth.ts` 只留一行接线 |
| 既有会话 30 天内不被覆盖形成窗口 | 发布说明写明；需要立即生效的部署执行 M4.3 的可选撤销脚本 |

## 9. 验收总则

1. 2FA 用户经邮箱 OTP、手机 OTP、邮箱验证码（`/email-otp/verify-email`）、魔法链接、邮箱验证链接自动登录、内置社交、genericOAuth、`idToken`、SSO OIDC（共享 / 专属回调）与 SAML 登录时，均被要求第二因子；无 2FA 用户、匿名登录、新用户首次注册登录与管理员扮演行为不变。
2. 挑战成功后会话正常建立；TOTP / 邮件 OTP / 备份码三种方式均可完成；勾选信任设备后同一设备再次登录不再挑战（与密码登录一致）。
3. 挑战失败、取消、超时均不留下可用会话；Cookie 与会话表状态一致。
4. 任一通道开关关闭时，该通道行为与登记前完全一致；全部关闭等价回退。
5. 审计覆盖挑战签发（含触发通道）、验证成功 / 失败（含因子）、信任设备创建；不含验证码、备份码明文。
6. 5 语文案键齐全；登录页 2FA 弹窗桌面 / 移动 / 暗色视觉基线通过。
7. `security.md` §1.3 覆盖矩阵与实现一一对应，并写明既有会话与 L2 边界。
8. 全量质量门与 `pnpm planning:check` 通过；阶段按 §8 归档。

## 10. 回滚

- 逐通道关闭开关即可恢复登记前行为，无需回滚代码；挑战适配器保留但不被调用。
- 若挑战适配器本身异常，可一次性关闭全部通道，等价回到「仅凭据登录触发 2FA」。
- 可选撤销脚本只影响会话，不修改用户、2FA 或恢复数据；执行前打印目标用户数并要求显式确认。
- 不新增数据表与列；开关与开关默认值进入 env 文档，回滚不涉及迁移。

## 11. 关联

- 设计：[账号找回与 2FA 边界设计草案](./2026-11-18-account-recovery-design.md)（§2.3 覆盖范围、§2.7 风险、§6 阶段 4、§8.1 上游限制）
- 前置：[阶段 10 收口记录](./2026-11-21-phase10-closure.md)、[阶段 9 收口记录](./2026-11-20-phase9-closure.md)
- 规范：[安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)、[规划规范](../../standards/planning.md)
- 候选池：[backlog §2.12](../../plan/backlog.md)
- 上游：[#12062](https://github.com/better-auth/better-auth/issues/12062)（social 2FA 开关，open）、[#12210](https://github.com/better-auth/better-auth/issues/12210)（自定义 hook 接法与信任设备回归，closed completed）
