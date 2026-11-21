# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段的进度表与大 / 小条目；准入、粒度、进度表与归档规则见 [规划规范](../standards/planning.md)。已收口阶段的索引见 [阶段归档索引](./todo-archive.md)（阶段 1–9 的权威记录见 [规划规范](../standards/planning.md) §4，摘要见 [已完成工作归档](../archive/completed-work.md)），未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前阶段：阶段 11「2FA 覆盖收紧与登录通道闭环」，2026-11-21 登记，进行中。** 范围与拟定决策见 [阶段 11 范围登记](../design/governance/2026-11-21-phase11-registration.md)；阶段 10「用户侧替代证明」已于 2026-11-21 收口（阶段正文见 [todo-archive-phases-10](./archive/todo-archive-phases-10.md)）。

---

## 阶段 11：2FA 覆盖收紧与登录通道闭环（2026-11-21 登记）

> **目标**：开启 2FA 的用户，经邮箱 OTP、魔法链接、邮箱验证自动登录、社交登录（内置 / genericOAuth / `idToken`）与 SSO（OIDC / SAML）登录时同样要求第二因子；复用上游 2FA 挑战，提供逐通道开关与回退。
> **容量基线**：commits 16–19 / files 45–60 / 行 2,000–2,800（逐条目拆解，测量方 = 规划角色）。
> **执行顺序**：M1 → M2 → M3 → M4 → M5；M4.1 可在 M2 完成后提前执行。
> **不做范围**：关闭 2FA 要求第二因子（D15）、可信设备 UI / passkey、管理员重置 2FA、审批流、恢复码作登录因子、按 SSO provider 例外、Redis 跨实例限流（详见 [登记记录 §7](../design/governance/2026-11-21-phase11-registration.md#7-不做什么)）。

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 通道盘点与挑战基座 | 3/3 | 进行中 | — | — | 3–4 → — |
| M2 无密码会话通道 | 3/3 | 进行中 | — | — | 3–4 → — |
| M3 社交与 SSO 通道 | 2/3 | 进行中 | — | — | 3–4 → — |
| M4 恢复、审计与边界 | 2/3 | 进行中 | — | — | 3–4 → — |
| M5 界面、文档与收口 | 2/3 | 进行中 | — | — | 4–5 → — |

### M1 通道盘点与挑战基座（P0 🛠️🛡️）

- **目标**：枚举所有会创建会话的入口，先落失败断言，再建立可复用的「调用上游 2FA 挑战」适配器与逐通道开关。
- **优先级**：P0（后续每条通道的完成定义与回退能力都依赖它）。
- **范围**：会话入口清单（3 条凭据路径已覆盖；新增邮箱 OTP、手机 OTP、邮箱验证码 / 邮箱验证链接自动登录、`/sign-in/social` 的 `idToken` 分支、`/callback/:id`、SSO OIDC / SAML ACS；匿名登录、新用户注册即登录、管理员扮演不在覆盖内）；挑战适配器（先 spike `ctx.context.getPlugin('two-factor')` + `{ ...ctx, returnHeaders: true }`，再封装；不可复用时走自建 challenge fallback）；逐通道显式布尔开关。
- **验收标准**：矩阵清单与测试一一对应；当前仅 3 条凭据路径通过，其余断言失败并输出实际响应；挑战适配器删除凭据会话、写入 `two_factor` cookie、返回实际可用的 `twoFactorMethods`；信任设备命中时不挑战；异常 fail-closed；开关默认 `true`、显式 `false` 生效、全部关闭等价回退。
- **不做什么**：不重写 TOTP / OTP / 备份码 / 信任设备判定；不新增独立挑战页；不改匿名登录。
- **依赖**：阶段 9 / 10 的测试夹具、`logger.audit`、`AUDIT_ACTIONS`。
- **交付物**：`docs/design/two-factor-coverage.md`、`tests/unit/server/two-factor-coverage-core.spec.ts`、`server/utils/two-factor-coverage/`、`utils/shared/env.ts` 开关、单测；3–4 次提交。
- **风险与缓解**：上游内部 hook 漂移 → 契约测试锁定 + 升级必跑；复制 cookie 丢失 → 断言会话删除与 cookie 同时成立，失败即 fail-closed；`lib/auth.ts` 触达 600 行上限 → 适配与钩子全部落在独立模块。

#### M1.1 会话入口清单与失败断言

- **目标**：产出入会创建会话的端点矩阵（端点、当前是否挑战、响应形态、开关名），并先写红灯集成测试。
- **验收标准**：清单覆盖凭据登录、邮箱 OTP、手机 OTP（`/phone-number/verify`）、邮箱验证码（`/email-otp/verify-email`）、魔法链接、`/verify-email`、`/sign-in/social`（`idToken`）、`/callback/:id`、SSO OIDC（`/sso/callback/:providerId` 与共享 `/sso/callback`）与 SAML（`/sso/saml2/sp/acs/:providerId`）；每条断言「2FA 用户登录后无可用会话，响应为挑战或 302 挑战」，并额外断言端点真实存在（先注册 SSO / OAuth fixture provider，再断言非 404），禁止用 404 充当预期失败；除 3 条凭据路径外全部失败；匿名登录、新用户首次注册登录与管理员扮演断言不受影响；测试可在内存 SQLite 下独立运行。
- **交付物**：`docs/design/two-factor-coverage.md`（矩阵与开关名）、`tests/unit/server/two-factor-coverage-core.spec.ts` 骨架（沿用仓库现有 `tests/unit/server/*-integration.spec.ts` 位置）。
- **依赖**：阶段 10 的 `channel-change-integration.spec.ts` 夹具写法。

#### M1.2 挑战适配器

- **目标**：先做可行性 spike（`{ ...ctx, returnHeaders: true }` 调用 two-factor after-hook handler，读取 `headers` 复制 `Set-Cookie`），再封装 `challengeTwoFactor(ctx, { responseMode })`，支持 `json` 与 `redirect` 两种响应形态；不可复用时切换自建 challenge fallback。
- **验收标准**：spike 结论与版本前提写入 `docs/design/two-factor-coverage.md`；集成测试断言 DB 会话被删除、`two_factor` cookie 写入、`twoFactorMethods` 为实际可用项；`trust_device` 命中不挑战；无 2FA 用户直接放行；上游异常返回 500 且不保留会话；代码评审确认未复制上游判定逻辑；fallback 分支同样通过上述断言。
- **交付物**：`server/utils/two-factor-coverage/challenge.ts`、spike 记录、单测、集成测试。
- **依赖**：M1.1。

#### M1.3 逐通道开关与回退

- **目标**：`emailOTP` / `phoneOTP` / `magicLink` / `emailVerification` / `social` / `sso` 六个显式布尔开关，缺省 `true`，集中在 env 解析；`emailVerification` 同时覆盖 `/verify-email` 与 `/email-otp/verify-email`，不得只关一半。
- **验收标准**：缺省为 `true`；显式 `false` 关闭；非法值回落默认并 warn；`emailVerification` 关闭时两条验证自动登录路径都不挑战；全部关闭时 M1.1 的断言整体反转为「与登记前一致」；`.env.example`、安全规范与单测同步。
- **交付物**：`utils/shared/env.ts`、`.env.example`、单测、安全规范片段。
- **依赖**：M1.2。

### M2 无密码会话通道（P0 🛠️）

- **目标**：把邮箱 OTP、手机 OTP、邮箱验证码 / 邮箱验证链接自动登录、魔法链接接入同一挑战语义。
- **优先级**：P0（邮箱 OTP、手机 OTP 与两条邮箱验证自动登录路径都能直接绕过 2FA，威胁模型中的「邮箱 / 手机接管 = 账号接管」直接依赖它们）。
- **范围**：`/sign-in/email-otp`、`/phone-number/verify`（OTP 登录 + 自动建会话，含 `signUpOnVerification` 新用户分支）、`/email-otp/verify-email`（邮箱验证码验证后自动建会话）、`/verify-email` 的 `autoSignInAfterVerification` 分支、`/magic-link/verify`；浏览器 GET 通道统一 302 到登录页并携带安全回跳，XHR 通道返回 `twoFactorRedirect`。
- **验收标准**：2FA 用户五条路径均无可用会话且能完成挑战；已登录用户验证邮箱不重复挑战（复用当前会话）；无 2FA 用户与新用户首次注册登录行为不变；失败 / 过期 token 不触发挑战；回跳地址仅限站内白名单；审计记录触发通道。
- **不做什么**：不改 OTP 位数、有效期、限流；不改验证邮件的模板与发送时机；不做「验证后强制登录」。
- **依赖**：M1。
- **交付物**：三处接线、集成测试、回跳校验单测、错误键；3–4 次提交。
- **风险与缓解**：GET 通道返回 JSON 破坏体验 → `responseMode='redirect'`；开放重定向 → 只接受站内路径并复用既有登录回跳校验；token 预取 → 挑战不消费 token，仅替换为 2FA challenge。

#### M2.1 OTP 登录（邮箱 / 手机）

- **目标**：`/sign-in/email-otp` 与 `/phone-number/verify`（OTP 登录分支）成功校验后，2FA 用户改为返回挑战。
- **验收标准**：2FA 用户收到 `twoFactorRedirect` 且无会话；无 2FA 用户直接登录；`signUpOnVerification` 的新用户首次登录不挑战（用户此前不可能启用 2FA）；`updatePhoneNumber` 绑定分支不重复挑战；错误 OTP 不创建会话；挑战后可完成 TOTP / 邮件 OTP / 备份码；审计 `channel=email-otp|phone-otp`。
- **交付物**：两处接线、集成测试、审计字段。
- **依赖**：M1.2。

#### M2.2 魔法链接

- **目标**：`/magic-link/verify`（GET）成功后，2FA 用户 302 到 `/login?twoFactor=1&redirect=...`。
- **验收标准**：点击链接后落到登录页并自动打开 2FA 弹窗、无会话；无 2FA 用户按原逻辑登录；回跳只接受站内白名单；过期 / 已用 token 不触发挑战；挑战期间的链接不可重放。
- **交付物**：接线、集成测试、回跳校验单测。
- **依赖**：M1.2。

#### M2.3 邮箱验证码 / 链接验证后自动登录

- **目标**：`/email-otp/verify-email`（邮箱验证码）与 `/verify-email`（验证链接）在 `autoSignInAfterVerification` 下对 2FA 用户改为挑战。
- **验收标准**：2FA 用户验证成功后不直接登录，`/email-otp/verify-email` 返回 `twoFactorRedirect`、`/verify-email` 302 挑战；无 2FA 用户保持自动登录；已登录用户验证邮箱不触发挑战（OTP 分支上游会轮换会话令牌，测试以用户身份 / 登录态为准，不断言 token 不变）；验证状态写入与挑战互不破坏（沿用上游事务语义）；审计区分 `email-otp-verification` 与 `email-link-verification`。
- **交付物**：两处接线、集成测试。
- **依赖**：M1.2。

### M3 社交与 SSO 通道（P0 🛠️🛡️）

- **目标**：社交登录与 SSO 登录不能再成为 2FA 绕过路径，同时保证 OAuth 授权链可继续。
- **优先级**：P0（社交 / SSO 用户开启 2FA 后当前完全绕过第二因子）。
- **范围**：内置社交 `/callback/:id`、`/sign-in/social` 的 `idToken` 分支、genericOAuth 回调、SSO OIDC（`/sso/callback/:providerId` 与共享 `/sso/callback`）/ SAML ACS；`oauth2/authorize` 与同意页只做回归，不改写。
- **验收标准**：各通道 2FA 用户均被挑战且无会话（含共享 SSO 回调）；无 2FA 用户不变；`callbackURL` / `redirect_uri` 仅站内白名单；OAuth provider 授权链「无会话 → 登录 → 挑战 → 回到 authorize / consent」端到端通过；阶段 9 强制重置拦截顺序不回归。
- **不做什么**：不做按 provider 例外（D16）；不改 SSO 用户自动注册与角色映射；不改 OAuth provider 的授权 / 同意逻辑（D17）。
- **依赖**：M1；阶段 9 的 `assertPasswordResetCompleted` 拦截顺序。
- **交付物**：三处接线、端到端测试、文档；3–4 次提交。
- **风险与缓解**：OAuth 回调 302 回跳被利用 → 复用既有 `callbackURL` 白名单校验；SAML 回调响应格式差异 → 单独用例；授权链状态丢失 → 端到端测试覆盖 authorize → 登录 → 挑战 → 授权完成。

#### M3.1 内置社交回调与 `idToken`

- **目标**：`/callback/:id` 与 `/sign-in/social` 的 `idToken` 直登分支接入挑战。
- **验收标准**：2FA 用户社交登录后 302 挑战、无会话；无 2FA 用户不变；禁用 provider 不触发挑战；审计记录 provider 与通道；`callbackURL` 仅站内白名单。
- **交付物**：接线、集成测试（mock provider）、审计字段。
- **依赖**：M1.2。

#### M3.2 genericOAuth

- **目标**：genericOAuth 走 core `/callback/:id` 的差异点（自定义 providerId、scope、`allowDifferentEmails`）纳入覆盖与回归。
- **验收标准**：至少一个 generic provider 的 2FA 用例；provider 注册 / 禁用 / 回调失败回归；与内置社交共享同一适配器，无重复实现。
- **交付物**：接线确认、集成测试、夹具配置。
- **依赖**：M3.1。

#### M3.3 SSO 与授权链

- **目标**：SSO OIDC（`/sso/callback/:providerId` 与共享 `/sso/callback`）与 SAML ACS（`/sso/saml2/sp/acs/:providerId`，POST）接入挑战；OAuth provider 授权链端到端回归。
- **验收标准**：SSO 2FA 用户 OIDC 专属回调后需第二因子；共享 `/sso/callback` 同样被挑战；SAML POST ACS 同；`oauth2/authorize` 无会话 → 登录（含挑战）→ 回到 authorize / consent 全流程通过；强制重置用户仍在登录阶段被拦；不新增 provider 级开关；SAML SLO 仅登出、不纳入。
- **交付物**：接线、端到端测试、文档片段。
- **依赖**：M1.2、M3.1。

### M4 恢复、审计与边界（P0 🛡️）

- **目标**：证明收紧后恢复因子与信任设备仍按原语义工作，并把新的覆盖边界、既有会话与死锁边界写成唯一口径。
- **优先级**：P0（收紧若破坏恢复路径，会把「2FA 绕过」换成「合法用户锁死」）。
- **范围**：TOTP / 邮件 OTP / 短信 OTP / 备份码 / 信任设备回归；挑战审计与失败提示；`security.md` 覆盖矩阵、既有会话与 L2 边界；可选会话撤销脚本；「关闭 2FA 要求第二因子」转 backlog。
- **验收标准**：三种主要因子各一条成功用例；未配置短信时短信 OTP 不作为可选方式；信任设备命中跳过、过期后重新挑战；`/two-factor/*` 限流生效；审计不含敏感明文；文档与实现逐条对应；脚本 dry-run 默认、显式确认才执行。
- **不做什么**：不扩展恢复码为登录因子；不新增管理员重置入口；不改 L0 / L1 / L2 等级；不引入后台任务。
- **依赖**：M2、M3。
- **交付物**：集成测试、审计与错误码、`security.md`、可选脚本、backlog；3–4 次提交。
- **风险与缓解**：挑战失败被误判为成功 → 会话删除与 cookie 双断言；无因子用户无提示 → 登录页展示备份码 / 恢复说明；既有会话窗口 → 文档写明 + 可选撤销脚本。

#### M4.1 因子与信任设备回归

- **目标**：验证挑战后 TOTP、邮件 OTP、短信 OTP、备份码均可完成，信任设备语义与密码登录一致。
- **验收标准**：三种主要因子各一条成功用例；短信未配置时不出现为可选方式；信任设备命中跳过、过期后重新挑战；连续失败命中 `/two-factor/*` 限流（3 次/分）；挑战中途会话被撤销时给出稳定错误。
- **交付物**：集成测试、稳定性文档片段。
- **依赖**：M2.1、M3.1。

#### M4.2 审计与失败提示

- **目标**：挑战签发（含触发通道）、验证成功 / 失败（含因子）、信任设备创建写结构化审计；错误提示区分因子错误、通道不可用、会话失效。
- **验收标准**：`AUDIT_ACTIONS` 扩展并通过类型检查；挑战签发事件含 `channel`，验证事件含 `factor`；不含验证码 / 备份码明文；错误键 5 语齐全；审计可按 `action` 过滤；失败与成功使用同一 action 前缀。
- **交付物**：审计接线、错误码、i18n 键、单测。
- **依赖**：M1.2、M4.1。

#### M4.3 关闭 2FA 与既有会话边界

- **目标**：更新 `security.md` 覆盖矩阵与边界；提供可选撤销脚本；把「关闭 2FA 要求第二因子」登记 backlog。
- **验收标准**：文档写明覆盖通道、默认值与开关名、既有会话不回溯、L2 死锁边界；脚本 dry-run 打印目标数量、需显式 `--confirm`、只删会话；不新增表 / 列；backlog 条目含触发条件与影响面。
- **交付物**：`docs/standards/security.md`、`scripts/security/revoke-two-factor-sessions.mjs`（可选）、`docs/plan/backlog.md` 更新。
- **依赖**：M4.2。

### M5 界面、文档与收口（P1 🎨🧪）

- **目标**：让浏览器通道的挑战在登录页自然衔接，补齐 5 语文案、视觉基线与阶段归档。
- **优先级**：P1（M2 / M3 的浏览器通道依赖它才能形成闭环）。
- **范围**：`/login?twoFactor=1&redirect=...` 自动打开弹窗、触发通道文案、无因子引导；5 语键；登录页 2FA 弹窗三端视觉；文档、门禁与归档。
- **验收标准**：查询参数只触发一次、刷新不重复弹；成功回跳仅站内白名单；失败可重试；无可用因子展示备份码 / 恢复说明；5 语同构；视觉 390 / 768 / 1440 通过且既有 138 项视觉用例不回归；全量门禁与归档通过。
- **不做什么**：不新增独立挑战页；不改认证页整体布局；不改密码登录的弹窗行为；不补 2FA 启用弹窗视觉（仍留 backlog）。
- **依赖**：M2、M3；阶段 10 的视觉夹具。
- **交付物**：登录页改动、5 语语言包、视觉 spec 与基线、文档与归档分片；4–5 次提交。
- **风险与缓解**：查询参数被伪造 → 只控制弹窗显隐，不授予任何状态；回跳被利用 → 站内白名单；视觉基线漂移 → 统一容器采集。

#### M5.1 登录页挑战接线

- **目标**：`/login?twoFactor=1&redirect=...` 自动打开现有 2FA 弹窗，并展示触发通道与无因子引导。
- **验收标准**：查询参数触发一次、刷新不重复弹；成功回跳 `redirect`（站内白名单）；失败 / 取消可重试；无可用因子时展示备份码 / 恢复说明；既有密码登录弹窗行为不变。
- **交付物**：`composables/use-login-flow.ts`、`pages/login.vue`、单测。
- **依赖**：M2.2、M3.1。

#### M5.2 5 语文案与视觉基线

- **目标**：新增键 5 语同构；登录页 2FA 弹窗桌面 / 移动 / 暗色与错误态基线。
- **验收标准**：`pnpm i18n:check` 通过；无硬编码文案；视觉 390 / 768 / 1440 通过；无横向溢出；既有 138 项视觉用例 / 基线不回归。
- **交付物**：5 语语言包、视觉 spec、基线图。
- **依赖**：M5.1。

#### M5.3 文档、门禁与收口

- **目标**：更新安全规范指针、API 文档与发布说明，跑全量门禁并按规划规范归档。
- **验收标准**：`lint` / `lint:css` / `typecheck` / `test` / `i18n:check` / `planning:check` / `test:visual` 全绿；`todo-archive.md` 索引与分片、roadmap 指针、`.session/` 同批同步。
- **交付物**：文档、归档分片、收口记录。
- **依赖**：M1–M4。
