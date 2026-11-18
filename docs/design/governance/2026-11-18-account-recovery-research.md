# 2026-11-18 主流平台账号找回与改邮箱机制调研

> **状态**：调研快照（2026-11-18）。仅记录官方文档与官方支持页面的公开口径，不评价平台内部实现。
> **范围**：Google、Microsoft、Apple、GitHub、Supabase、Auth0、Okta、AWS Cognito、Keycloak、Firebase，以及 NIST / OWASP 的公开建议。
> **用途**：为 [账号找回与 2FA 边界设计草案](./2026-11-18-account-recovery-design.md) 提供外部参照。
> **限制**：平台策略会随地区、账号类型、风控结果变化；本文只覆盖“常规路径”，不覆盖各国法律调证、企业合同支持等特殊通道。

## 1. 结论摘要

1. **在本轮调研的平台中，没有平台把“邮箱”当作唯一根凭据**。邮箱是通道之一，恢复码、恢复密钥、恢复联系人、可信设备、已验证设备、人工复核都可以替代它。
2. **改邮箱的证明通常不是“旧邮箱确认”**。更常见的是“新邮箱验证 + 旧邮箱通知 + 延迟生效”；双邮箱确认是可选配置（Supabase 默认开启），不是行业唯一做法。
3. **恢复码 / 恢复密钥 / 恢复联系人是常见能力**。Google、Apple、GitHub、Keycloak、Auth0 都提供离线恢复材料；Apple 与 GitHub 明确“丢失即永久失去”的边界。
4. **延迟与可撤销是核心风控手段**。Microsoft 移除验证方式有 30 天等待，Google 恢复信息变更后 7 天内仍向旧信息发码，Apple 旧邮箱 30 天内不能被其他账号占用。
5. **人工兜底普遍存在，但门槛高**。GitHub 需要已验证邮箱 OTP + 可信设备 / SSH key / PAT，并由支持团队审核约 3 个工作日；Microsoft 客服被明确禁止修改账号详情；Apple 的账号恢复可能需要数天且无法加速。
6. **标准口径一致**：NIST SP 800-63B-4 要求恢复事件通知、恢复码一次性且哈希存储、恢复方法基于风险评估并记录；OWASP 要求恢复不得弱于认证、重置后通知用户、撤销会话、不要自动登录。

## 2. 平台矩阵

| 平台 | 改主邮箱的证明 | 旧邮箱不可用时 | 丢失 MFA 时 | 关键约束 / 备注 |
| :--- | :--- | :--- | :--- | :--- |
| Google | 以新邮箱验证为主；旧地址转为备用，双方都会收到邮件 | 账号恢复（恢复联系人 / 手机 / 自拍视频），可能数天 | 备份码（10 个，8 位，可随时重生成）→ 账号恢复 | 恢复信息或认证因子变更后，7 天内仍可能向旧信息发码 |
| Microsoft | 新验证方式需验证；移除旧方式有 30 天等待 | 账号恢复表单；客服不能改账号详情 | Authenticator / passkey / 恢复表单 | 全部安全信息移除后账号受限 30 天；客服不发重置链接 |
| Apple | 在受信任设备上验证新邮箱；旧地址可保留为附属 | 标准账号恢复（数天，Apple 无法加速） | 受信任设备 / 电话；恢复密钥（28 字符）；恢复联系人（最多 5 个） | 恢复密钥丢失 = 永久锁定；旧邮箱 30 天内不能被其他 Apple Account 使用 |
| GitHub | 验证新邮箱；可设置 backup email | 支持审核（约 3 个工作日）+ 已验证邮箱 OTP + 可信设备 / SSH key / PAT | 恢复码 / passkey / security key / 备用号码 | 全部丢失 = 永久失去账号；可解绑邮箱 |
| Supabase | 配置项 `double_confirm_changes` 默认 true（CLI 文档口径），旧 + 新双确认 | 关闭双确认后只需新邮箱 | 依赖应用实现；无内置恢复码 | 配置项，默认最严格；另有 `secure_password_change` 可选 |
| Auth0 | 无开箱自助改邮箱；用 Management API + 验证邮件实现 | 应用自定义 | 恢复码（默认关闭）；管理员可重置 MFA | 官方明确不建议把邮箱当作身份证明 |
| Okta | Identity Engine 改主邮箱流程；管理员也可直接改 | 管理员改 | 管理员重置 / 应用自定义 | 密码可选（password-optional）场景需专门设计 |
| AWS Cognito | 用户改 `email` 属性并验证 | 管理员或应用自定义 | 管理员调整 MFA 偏好；不会重置已有 TOTP | 重置 TOTP 需重新关联软件令牌 |
| Keycloak | 账户控制台 / 管理员改邮箱 | 管理员改 | 恢复码（26.3 起 12 个顺序一次性码）；管理员 Reset OTP | 开源、管理员驱动；Forgot password 可覆盖 OTP 重置 |
| Firebase | `updateEmail` / `verifyBeforeUpdateEmail` + 新邮箱验证 | 应用自定义 | 应用自定义；Admin SDK 可改 | 改主邮箱、改密码等敏感操作要求近期登录 |

## 3. 逐平台要点

### 3.1 Google

- **改邮箱**：Google Account 邮箱可以从 Gmail 地址改为另一个 Gmail 地址；旧地址会变成备用邮箱，双方都会收到邮件，账号数据不受影响；官方页面没有把“旧邮箱确认”列为必要步骤。
- **恢复信息变更的延迟**：修改恢复信息或其他认证因子后，Google 可能在 7 天内继续向旧信息发送验证码，方便用户在异常变更时快速止损。
- **备份码**：2FA 备份码为 10 个 8 位一次性码，可随时重新生成，重新生成后旧码自动失效。
- **账号恢复**：支持恢复联系人、恢复手机号、自拍视频等；恢复流程可能持续数天，且不保证成功。
- **启示**：以“新邮箱验证 + 旧通道通知 + 延迟”替代“旧邮箱确认”；恢复材料可轮换。

来源：[Set up recovery options](https://support.google.com/accounts/answer/183723?hl=en)、[Change your Google Account email](https://support.google.com/accounts/answer/19870?hl=en)、[Sign in with backup codes](https://support.google.com/accounts/answer/1187538?hl=en)。

### 3.2 Microsoft

- **安全信息变更**：新增验证方式需要向新方式发送验证码；移除验证方式存在 **30 天等待期**，期间旧方式仍可用于登录，用户可取消移除。
- **全部移除的风险**：如果移除全部安全信息，账号会进入约 **30 天的受限状态**，限制敏感操作。
- **客服边界**：官方支持页面明确写明，支持人员**不得**发送密码重置链接，也**不得**访问或修改账号详情。
- **启示**：延迟生效 + 可撤销，是防“会话被盗后立刻换绑”的有效手段；同时明确“客服不能绕过”。

来源：[Microsoft account security info & verification codes](https://support.microsoft.com/en-gb/accounts-billing/manage/microsoft-account-security-info-verification-codes)、[What does "Scheduled for removal" mean?](https://support.microsoft.com/en-gb/accounts-billing/manage/security-info-scheduled-for-removal)。

### 3.3 Apple

- **改主邮箱**：可以在受信任设备上更换 Apple Account 主邮箱，并验证新邮箱；官方建议优先使用受信任设备，网页端在无受信任设备时能力受限。
- **旧地址冷却**：移除的非 iCloud 邮箱在 **30 天内**不能被其他 Apple Account 关联，防止地址被立即抢注。
- **恢复密钥**：28 字符，需配合受信任电话号码和 Apple 设备使用；设置后关闭标准账号恢复，**丢失密钥可能永久失去账号**。
- **恢复联系人**：最多 5 个，联系人只能提供 6 位恢复码，不能访问账号；没有恢复联系人时仍可走标准恢复，但可能更慢。
- **账号恢复**：没有受信任设备或受信任电话号码时，标准恢复可能需要数天，Apple 明确表示联系客服也无法加速。
- **启示**：恢复材料必须离线保存；平台应明确“丢失即永久丢失”的边界，而不是给用户虚假的安全感。

来源：[Change your Apple Account primary email address](https://support.apple.com/en-us/109353)、[Set up a recovery key for your Apple Account](https://support.apple.com/en-us/109345)、[Set up a recovery contact for your Apple Account](https://support.apple.com/en-us/102641)、[Get a verification code and sign in with two-factor authentication](https://support.apple.com/en-us/102606)。

### 3.4 GitHub

- **改邮箱**：新增邮箱需要验证；支持主邮箱与 backup email，密码重置邮件只会发往主邮箱和已验证的备用邮箱。
- **丢失 MFA 的自助路径**：恢复码、passkey、security key、备用号码。
- **人工路径**：如果没有恢复码，但有已验证邮箱，可申请账号恢复；需要邮箱 OTP + 可信设备 / SSH key / PAT 之一，GitHub Support 审核约 **3 个工作日**。
- **不可恢复边界**：官方警告，如果 2FA 开启且恢复码与恢复方式全部丢失，GitHub Support **无法**恢复账号；用户只能解绑邮箱，把地址用于新账号。
- **启示**：人工兜底必须有“替代证明”，不能只靠客服判断；同时要提前告知不可恢复的边界。

来源：[Recovering your account if you lose your 2FA credentials](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/recovering-your-account-if-you-lose-your-2fa-credentials)。

### 3.5 Supabase

- **双确认开关**：CLI 配置文档口径下，`auth.email.double_confirm_changes` 默认 **true**，要求旧邮箱和新邮箱都确认；关闭后只需新邮箱确认。
- **安全密码变更**：`auth.email.secure_password_change` 可选，要求用户提供当前密码。
- **启示**：这是与草梅 Auth 当前行为最接近的实现，但 Supabase 把它做成**可配置项**，默认最严格、可按产品需要放宽。

来源：[Supabase CLI config — Auth Config](https://supabase.com/docs/guides/local-development/cli/config)。

### 3.6 Auth0

- **自助改邮箱**：Auth0 没有开箱的自助改邮箱端点；常见做法是用 Management API `PATCH /users` 更新邮箱，再通过验证邮件 / OTP 确认新地址。社区讨论也指出，这会带来“用户被锁在外面”的预期风险。
- **邮箱信任**：Auth0 官方明确“不建议使用邮箱地址来验证用户身份”，邮箱验证只降低风险，不是身份证明。
- **MFA 恢复**：恢复码是可配置能力，**默认关闭**；管理员可以在后台重置用户的 MFA。
- **启示**：身份基础设施通常只提供原语，把“改邮箱策略”留给应用；应用必须自己定义证明强度与人工流程。

来源：[Verify Emails using Auth0](https://auth0.com/docs/manage-users/user-accounts/verify-emails)、[Configure Recovery Codes for MFA](https://auth0.com/docs/secure/multi-factor-authentication/configure-recovery-codes-for-mfa)、[Reset a user's multi-factor account](https://auth0.com/docs/multifactor-authentication/administrator/reset-user)。

### 3.7 Okta

- **改主邮箱**：Identity Engine 提供“修改主邮箱”流程：用户登录 → 发起变更 → 提交新邮箱 → 由 Identity Engine 发起验证；管理员也可以在 Admin Console 直接修改用户邮箱。
- **密码可选场景**：在 password-optional / 无密码部署中，邮箱是主要登录标识，改邮箱是关键任务，需要专门设计验证与通知。
- **启示**：自助流程与管理员流程并存，且管理员改邮箱是常规能力，不依赖用户旧邮箱。

来源：[Change your primary email address (Okta Developer)](https://developer.okta.com/docs/guides/pwd-optional-change-email/aspnet/main)、[Update a User Email Address in an Okta Organization](https://support.okta.com/help/s/article/how-do-i-update-my-email-in-okta-org?language=en_US)。

### 3.8 AWS Cognito

- **管理员调整 MFA**：`AdminSetUserMFAPreference` 可设置 SMS / TOTP / Email / WebAuthn 的启用与首选状态。
- **不会重置 TOTP**：官方文档明确该接口**不会重置**已有 TOTP；要注册新的 TOTP 因子需要调用 `AssociateSoftwareToken`。
- **管理员重置密码**：`AdminResetUserPassword` 可强制用户重置密码。
- **启示**：管理员兜底是标准能力，但“重置 MFA”与“调整 MFA 偏好”是两件事，不能混为一谈。

来源：[AdminSetUserMFAPreference](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminSetUserMFAPreference.html)。

### 3.9 Keycloak

- **恢复码**：26.3 起支持 Recovery Authentication Codes，共 **12 个顺序一次性码**；用户需确认“已安全保存”后才能完成设置。
- **管理员重置 OTP**：管理员可在用户 Credentials → Reset Actions → Configure OTP 中重置；也可通过 required action 强制用户重新配置。
- **Forgot password**：启用后，用户可在忘记密码或丢失 OTP 生成器时重置登录凭据（具体取决于认证流程配置）。
- **启示**：开源身份平台把恢复码、管理员重置、强制重新配置都做成流程的一部分，而不是单点开关。

来源：[Recovery Authentication Codes (Keycloak 26.3)](https://keycloak.org/2025/10/recovery-codes)、[Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html)。

### 3.10 Firebase

- **改邮箱**：`updateEmail` / `verifyBeforeUpdateEmail`；敏感操作要求用户**近期登录**（recent login），否则需要重新认证。
- **验证新邮箱**：`verifyBeforeUpdateEmail` 会先向新邮箱发送验证链接，点击后才更新。
- **管理员能力**：Admin SDK 可更新用户邮箱、禁用账号等。
- **启示**：“近期认证”是一个低成本、高收益的门槛，适合放在改邮箱、改密码、关闭 MFA 之前。

来源：[Manage Users in Firebase](https://firebase.google.com/docs/auth/web/manage-users)。

## 4. 标准与最佳实践

### 4.1 NIST SP 800-63B-4

- 账号恢复是“恢复对认证器的控制”，恢复事件**必须通知**用户；恢复方法应基于风险评估并记录选择理由（OWASP 进一步要求恢复不得弱于正常认证）。
- 标准识别四类恢复方法：离线恢复码、恢复地址、恢复联系人、重做身份核验 / 人工核验；CSP 至少支持其中一类，并基于风险评估记录选择理由。
- 恢复码要求：至少 64 bit 随机数、哈希存储、一次性使用、使用后失效并重新签发；重新签发也要触发通知。
- 鼓励用户维护**至少两种独立的认证方式**，以减少对账号恢复的依赖；绑定新认证器时，要求在当前账号可用最高 AAL 与新认证器将使用的最高 AAL 中较低者下重新认证。
- 启示：恢复码不是“备用密码”，而是与密码同等重要的凭据；必须有轮换、通知与审计。

来源：[NIST SP 800-63B-4, Lifecycle Management](https://pages.nist.gov/800-63-4/sp800-63b/events/)。

### 4.2 OWASP

- 忘记密码：对存在与不存在的账号返回一致消息与一致耗时；按账号限流、加 CAPTCHA；令牌随机、足够长、安全存储、一次性、及时过期。
- 重置完成后：通知用户；撤销已有会话或让用户选择；不要自动登录。
- 账号恢复：本质是另一种认证，**不得弱于正常认证**；安全问题的使用需谨慎。
- 启示：当前项目的验证码通道在限流、CAPTCHA、一次性方面做得较好，但“重置后撤销会话 / 通知用户”仍缺失。

来源：[OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)、[OWASP Choosing and Using Security Questions Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Choosing_and_Using_Security_Questions_Cheat_Sheet.html)。

## 5. 模式归纳

| 模式 | 代表平台 | 作用 | 代价 |
| :--- | :--- | :--- | :--- |
| 双邮箱确认 | Supabase（默认） | 防会话 / 密码被盗后直接换绑 | 旧邮箱失效即卡死 |
| 新邮箱验证 + 旧邮箱通知 | Google | 兼顾可恢复性与可检测性 | 旧邮箱失效时仍需其他恢复路径 |
| 延迟生效 + 可撤销 | Microsoft 30 天、Google 7 天、Apple 30 天 | 给真实用户止损窗口 | 用户体验变慢，需要清晰文案 |
| 离线恢复码 / 恢复密钥 | Google、Apple、GitHub、Keycloak、Auth0 | 邮箱 / 设备全失时的最后凭证 | 丢失即永久失去，需要强提示 |
| 恢复联系人 | Google、Apple | 社交信任兜底 | 联系人本身可能失联；隐私设计复杂 |
| 可信设备 / 替代证明 + 人工审核 | GitHub（3 个工作日） | 在不可恢复与乱恢复之间取平衡 | 运营成本高，审核标准难统一 |
| 管理员重置 MFA / 密码 | Keycloak、Cognito、Auth0 | 解决死锁 | 权限集中，必须审计与审批 |
| 明确不可恢复边界 | GitHub、Apple | 管理用户预期，减少争议 | 需要产品与客服话术配合 |

## 6. 对本项目的启示

1. **不要只加“更容易”的通道**。任何放宽都必须配套：通知、冷静期、撤销入口、审计。
2. **把“旧邮箱确认”从唯一证明降为可选证明**。保留它作为默认路径，同时允许“密码 + 第二因子”替代。
3. **恢复码应独立于 2FA 备份码**。备份码的语义是“2FA 备用”，恢复码的语义是“账号恢复”；混用会让用户在 2FA 未开启时缺少恢复材料。
4. **管理员兜底必须先补齐**。在收紧 2FA 覆盖之前，管理端必须能重置 2FA；否则会把“类型 5”升级成“类型 2 的死锁”。
5. **先修“假通道”**。短信重置、备份码再生成、管理员改密码目前是“看起来有、实际没有”，比缺少功能更危险。
6. **明确产品边界**。如果最终选择 GitHub / Apple 模式（恢复材料丢失即永久丢失），必须在启用 2FA / 生成恢复码时明确告知，而不是事后解释。

## 7. 参考链接

> 访问日期：2026-11-18。平台页面可能随版本更新，引用时以当时内容为准。

- Google: [Set up recovery options](https://support.google.com/accounts/answer/183723?hl=en)
- Google: [Change your Google Account email](https://support.google.com/accounts/answer/19870?hl=en)
- Google: [Sign in with backup codes](https://support.google.com/accounts/answer/1187538?hl=en)
- Microsoft: [Microsoft account security info & verification codes](https://support.microsoft.com/en-gb/accounts-billing/manage/microsoft-account-security-info-verification-codes)
- Microsoft: [What does "Scheduled for removal" mean?](https://support.microsoft.com/en-gb/accounts-billing/manage/security-info-scheduled-for-removal)
- Apple: [Change your Apple Account primary email address](https://support.apple.com/en-us/109353)
- Apple: [Set up a recovery key for your Apple Account](https://support.apple.com/en-us/109345)
- Apple: [Set up a recovery contact for your Apple Account](https://support.apple.com/en-us/102641)
- Apple: [Get a verification code and sign in with two-factor authentication](https://support.apple.com/en-us/102606)
- GitHub: [Recovering your account if you lose your 2FA credentials](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/recovering-your-account-if-you-lose-your-2fa-credentials)
- Supabase: [Supabase CLI config — Auth Config](https://supabase.com/docs/guides/local-development/cli/config)
- Auth0: [Verify Emails using Auth0](https://auth0.com/docs/manage-users/user-accounts/verify-emails)
- Auth0: [Configure Recovery Codes for MFA](https://auth0.com/docs/secure/multi-factor-authentication/configure-recovery-codes-for-mfa)
- Auth0: [Reset a user's multi-factor account](https://auth0.com/docs/multifactor-authentication/administrator/reset-user)
- Okta: [Change your primary email address](https://developer.okta.com/docs/guides/pwd-optional-change-email/aspnet/main)
- AWS: [AdminSetUserMFAPreference](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminSetUserMFAPreference.html)
- Keycloak: [Recovery Authentication Codes](https://keycloak.org/2025/10/recovery-codes)
- Keycloak: [Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html)
- Firebase: [Manage Users in Firebase](https://firebase.google.com/docs/auth/web/manage-users)
- NIST: [SP 800-63B-4, Lifecycle Management](https://pages.nist.gov/800-63-4/sp800-63b/events/)
- OWASP: [Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- OWASP: [Choosing and Using Security Questions Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Choosing_and_Using_Security_Questions_Cheat_Sheet.html)
