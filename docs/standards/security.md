# 安全开发规范 (Security Development Standards)

## 0. 事实源与边界 (Source & Scope)

### 0.1 唯一事实源

本文档是安全相关的详细实施规范。与 `AGENTS.md` 第 7 节"安全与行为红线"的关系是**上下位不重复**：

- `AGENTS.md` 第 7 节定义项目级安全红线与禁止行为。
- 本文档提供这些红线的文件级要求与实施准则。

### 0.2 项目边界

以下内容不在本规范范围内：

- **Web 应用防火墙 (WAF) 配置**: 属基础设施层面，参考部署文档。
- **数据库加密服务**: 由数据库维护方负责。
- **CDN 安全策略**: 属部署架构文档。

### 0.3 权限实现权威来源

权限校验的权威实现在 `server/utils/` 下的工具函数：

- `getUserSession(event)`: 校验用户是否已登录并获取会话。
- `checkAdmin(event)`: 校验用户是否为管理员（未登录 401、非管理员 403）。
- `isUserAdmin(user, userId)`: 轻量管理员判断（只读会话用户角色与 `ADMIN_USER_IDS`，不查库、不同步角色），仅供中间件等已由 `checkAndSyncAdminRoleWithUser` 完成同步的场景使用。
- `normalizeAuthPath(path)`: 把请求路径归一化为 WHATWG URL pathname，所有路径鉴权必须先经过它（`utils/shared/auth-paths.ts`）。
- `isOAuthRegistrationAuthPath` / `isOAuthClientManagementAuthPath` / `isSsoManagementAuthPath`: 归一化后的端点精确匹配，禁止改回 `startsWith`。
- 其他权限逻辑以 `server/utils/` 下对应工具为准，禁止在 Handler 内手写重复实现。

## 1. 认证与授权 (Authentication & Authorization)

-   **严格鉴权**: 所有涉及用户数据的 API 必须通过会话校验（`getUserSession`）或明确的路由保护。
-   **权限最小化**: 管理端接口必须使用 `checkAdmin`；业务逻辑中按角色判断时，使用统一的角色判断工具，禁止散落 `role === 'admin'` 一类硬编码判断。
-   **密码安全**: 禁止在数据库中存储明文密码。使用 better-auth 默认的安全哈希机制。

### 1.1 第三方认证插件端点 (Third-party Auth Plugin Endpoints)

-   **不信任上游默认端点**: better-auth 及其插件的端点默认可能只校验登录态（`sessionMiddleware`），不校验管理员身份。启用插件前必须核对上游实现，显式关闭或拦截其中的管理类端点。
-   **SSO 提供商仅限管理员维护**: `@better-auth/sso` 的 `/sso/register`、`/sso/update-provider`、`/sso/delete-provider`、`/sso/request-domain-verification`、`/sso/verify-domain` 必须通过 `disabledPaths`（SSO 相对路径列表见 `utils/shared/sso-management-paths.ts`，合并后的禁用列表见 `utils/shared/auth-disabled-paths.ts`）关闭，并把 `providersLimit` 设为 `0`；`server/middleware/2-auth.ts` 还会按 `isSsoManagementAuthPath` 追加管理员校验作为纵深防御。提供商维护只允许走 `/api/admin/sso/providers`。登录链路（`/sign-in/sso`、`/sso/callback*`、`/sso/saml2/*`）不在关闭列表内，必须保持可用。
-   **中间件与业务接口的权限口径**: 中间件层使用 `isUserAdmin`（只读判断，不额外查库）；业务接口仍使用 `checkAdmin`（读取会话中的角色，含 Demo 分支）。同一请求内的管理员角色同步由中间件调用 `checkAndSyncAdminRoleWithUser` 完成，两者结论必须一致。
-   **历史配置排查**: 升级或收紧 SSO 配置后，管理员必须调用 `GET /api/admin/sso/audit`（只读，不返回 `clientSecret`、`oidcConfig` 等敏感字段）核查 `suspiciousProviders` / `suspiciousAccounts`，确认后清理历史遗留的提供商与账号链接；仅关闭注册端点不会撤销已经建立的链接。清理顺序：先用 `DELETE /api/admin/sso/providers/{id}` 删除可疑 `sso_provider` 记录，再删除 `account` 表中对应 `providerId` 的链接——管理端删除接口只删除 provider，不会级联删除 account，残留链接在重建同名 `providerId` 后会重新生效。
-   **`trustEmailVerified` 使用前提**: 仅当用户无法自助注册 SSO 提供商（上述管理端点全部关闭）时才可开启；若重新开放注册，必须同时改为 `false`，或启用 `domainVerification` 并在 `SSOProvider` 实体中持久化 `domainVerified`（当前实体尚未包含该字段，启用前需先补列）。
-   **OAuth 客户端仅限管理端维护**: `@better-auth/oauth-provider` 的 `/oauth2/register` 通过 `allowDynamicClientRegistration: false` 关闭（返回 `403 access_denied`）；`/oauth2/create-client`、`/oauth2/get-client`、`/oauth2/get-clients`、`/oauth2/update-client`、`/oauth2/delete-client`、`/oauth2/client/rotate-secret` 通过 `AUTH_DISABLED_PATHS`（`utils/shared/auth-disabled-paths.ts`）关闭（返回 404）。这些端点都不校验管理员身份：`create-client` 任意会话可调用，其余仅按 `userId` 做归属校验。`lib/auth.ts` 同时配置管理员 `clientPrivileges` 作为纵深防御。应用统一通过 `/api/admin/oauth/applications` 创建（GHSA-2r7m-492j-p8xm）。

### 1.2 路径鉴权与归一化 (Path-based Authorization)

-   **禁止原始路径比较**: 任何基于请求路径的鉴权、限流、Demo 守卫判断，都必须先调用 `normalizeAuthPath`（`utils/shared/auth-paths.ts`）再比较，禁止直接对 `event.path` / `req.url` 做 `startsWith`。h3 的 `event.path` 会解码百分号编码（`%2e` → `.`、`%2D` → `-`）但不折叠点段，而 better-auth 路由按 WHATWG URL 折叠点段，两者不一致会导致门禁被绕过。例外仅限不参与权限判断的路由兼容查表（如 `server/api/auth/[...all].ts` 的发现端点查表）与日志记录。
-   **白名单同样要归一化**: 公开路径白名单（`utils/shared/public-paths.ts`）必须用归一化路径匹配，否则 `/login/../api/auth/oauth2/register` 会因原始前缀命中白名单而提前放行。
-   **回归测试要求**: 新增或修改鉴权与白名单门禁时，测试必须覆盖 `.`、`..`、`%2e` 三种点段形态，以及白名单前缀穿越；断言"原始路径被拒绝"不足以证明安全。
-   **反向代理不能替代应用校验**: 反向代理归一化 URI 只能作为纵深防御，不得作为唯一防线。

## 1.3 2FA 覆盖边界与账号恢复等级 (2FA Coverage & Recovery Levels)

本节是账号恢复路径的唯一口径，实施见 [阶段 9 范围登记](../design/governance/2026-11-19-phase9-registration.md)、[阶段 10 范围登记](../design/governance/2026-11-21-phase10-registration.md) 与 [阶段 11 范围登记](../design/governance/2026-11-21-phase11-registration.md)。

-   **2FA 覆盖边界（阶段 11 已收口，2026-11-21）**: 阶段 11 已把邮箱 OTP、手机 OTP、邮箱验证码 / 邮箱验证链接自动登录、魔法链接、社交（内置 / genericOAuth / `idToken`）与 SSO（OIDC 专属 / 共享回调、SAML ACS）接入第二因子挑战；逐通道开关缺省开启（`TWO_FACTOR_COVERAGE_*`），关闭单通道等价回退。覆盖矩阵、响应形态与未覆盖边界见 [2FA 覆盖矩阵](../design/two-factor-coverage.md)，范围与决策见 [阶段 11 范围登记](../design/governance/2026-11-21-phase11-registration.md)。覆盖矩阵作为长期口径维护；后续变更同步本节与矩阵。
-   **可信设备与会话撤销（阶段 12）**: 2FA 验证勾选「信任此设备」后写入 `TrustedDevice`（identifier / UA / IP / 过期时间），用户与管理员均可查看 / 吊销；吊销同时删除 `verification` 行与实体，当前设备额外清除 `trust_device` cookie。D14 既有会话不回溯：启用 2FA 前建立的会话仍按原语义有效，只有主动撤销或重新登录后才按当前 2FA 策略校验。批量撤销脚本 `scripts/security/revoke-two-factor-sessions.mjs` 默认 dry-run、`--confirm` 执行，覆盖 SQLite / MySQL / PostgreSQL。
-   **恢复等级**:
    -   **L0 自助恢复**:
        -   已验证邮箱 / 手机通过一次性验证码重置密码；已登录会话使用密码确认后重新生成备份码；使用备份码完成 2FA。短信通道未配置（`PHONE_CHANNEL` 为空）时手机入口必须隐藏，服务端返回 `CHANNEL_NOT_CONFIGURED`，不得表现为「已发送」。
        -   **密码 + 第二因子更换已验证邮箱（阶段 10）**：旧邮箱失效但持有恢复因子的用户，可用「密码 + 恢复码 / 已验证手机 OTP / TOTP / 备份码」申请把已验证邮箱换成新邮箱。新邮箱必须先完成归属验证才进入冷静期；冷静期默认 24h、上限 72h（`CHANNEL_CHANGE_COOLING_OFF_HOURS`），期间可撤销；到期后 `email` 覆写为新邮箱、`emailVerified=true`，旧邮箱立即失效且全部会话失效。该分支**不**强制重置密码（用户已用密码通过证明），生效判定与登录读路径共用同一状态函数。
        -   **OAuth-only 受控自助设置密码（阶段 10，D10）**：无密码用户可在新鲜会话（15 分钟内登录）+ 第二因子的前提下设置密码；第二因子只接受恢复码 / TOTP / 备份码，**手机 OTP 一律拒绝**（D3 延伸，避免 SIM swap 直接提权）。设置成功后撤销其他会话并审计。
        -   **恢复码与 2FA 备份码分离（D2）**：恢复码只用于通道全失时的自助恢复证明，不参与登录第二因子；一次签发 10 条、只展示一次、只存 sha256 哈希、使用即失效，重签使旧码全部失效。
    -   **L1 管理员协助恢复**: 管理员只能**发起**邮箱 / 手机改绑并填写原因；用户必须在新通道用一次性验证码确认；确认后新通道立即置为已验证、全部会话失效，并强制重置密码；重置完成前**所有**登录方式（密码 / 邮箱 OTP / 手机 OTP / 社交 / SSO）一律拒绝。L1 请求必须由管理员发起（`source=admin`），用户自助请求（`source=user`）不得经管理员确认端点生效。
    -   **L2 无人工路径**: 同时丢失 2FA 验证器与备份码时，管理员**不得**重置 2FA / 备份码，也不得代设密码。界面与文档必须明确告知该限制，不做隐性兜底。
-   **不变量（D4 / D8 / D9）**:
    1. 管理员不得直接修改用户邮箱 / 手机，只能发起待确认改绑（`/api/auth/admin/update-user` 的邮箱 / 手机字段、`/api/auth/admin/set-user-password` 一律拒绝）。
    2. 改绑必须经新通道验证码确认；确认页链接只预填请求 ID，**令牌消费只发生在 POST**。
    3. **L1（管理员协助）**确认生效后强制重置密码；重置成功清除标记并撤销全部会话。L0 自助改邮箱走冷静期，生效后只撤销会话、不置 `mustResetPassword`。
    4. 改绑与强制重置**不改变** `twoFactorEnabled` 与备份码集合。
    5. 自助换邮箱的同一用户同一通道同时只保留一条 pending 请求；新申请会取消旧请求，冷静期内不做二次改绑。
-   **验证码与请求**: 统一 6 位数字验证码，有效期 10 分钟、最多 3 次尝试；验证码窗统一按 `createdAt + 10 分钟` 判定（`expiresAt` 只作老数据回落，不参与冷静期生效）；过期、已验证、已取消不可重放。恢复证明的因子失败按 `userId + factor` 计数（15 分钟 5 次锁定），计数写在业务事务之外，回滚不清零。
-   **审计**: 改绑发起 / 确认 / 通知 / 撤销 / 生效、恢复码生成 / 重签 / 使用 / 删除、恢复证明校验与证明 OTP 发送、自助设置密码、2FA 开关、备份码再生成、密码重置请求 / 完成 / 强制重置、社交与手机绑定必须写入 `logger.audit` 结构化事件，包含 `action`、`actorId`、`targetUserId`、`before`、`after`、`result`、`reason`、`ip`、`userAgent`、`source`；禁止记录密码、验证码、恢复码、备份码明文。当前 `action` 枚举见 `server/utils/audit-log.ts` 的 `AUDIT_ACTIONS`（`recoveryCodes.*` / `proof.*` / `email.change.*` / `password.set.selfService` / `channel.change.*`）。

## 1.4 登录事件与可信设备访问矩阵 (Login Events & Trusted Devices)

阶段 12 引入 `login_event` 与 `trusted_device` 两张表；完整字段、保留期与审计清单见 [安全可观测性口径](../design/security-observability.md)。

-   **访问矩阵**: 匿名无事件 / 统计 / 可信设备权限（会话仅限本人，框架内建）；普通用户只能查看 / 吊销**本人**可信设备与会话，不提供用户侧事件列表；管理员可按类型 / 结果 / 通道 / 用户 / IP / 时间查询全部事件、统计与热力图，并可查看 / 吊销任意用户的可信设备与会话。所有管理端端点必须先过 `checkAdmin`，用户端点按 `userId` 作用域过滤，不存在与越权统一 404。
-   **禁止字段**: 事件与可信设备不得落密码、验证码、令牌、备份码 / 恢复码；`metadata` 只接受白名单键与标量值，读取时再过滤一次。值级脱敏覆盖邮箱与令牌形态，手机号依赖白名单键与写入方约束（自由文本尚未做值级手机号脱敏）。
-   **保留与导出**: 登录事件默认保留 90 天（`LOGIN_EVENT_RETENTION_DAYS`，1–3650），管理端统计查询按进程内 1 小时节流惰性清理，不引入常驻调度器；不提供 CSV / JSON 导出，不做风险评分与异地告警。
-   **D14 边界**: 启用 2FA 前的既有会话不回溯；只有主动撤销或重新登录后才按当前 2FA 策略重新校验。
-   **审计**: `trustedDevice.create` / `trustedDevice.revoke` / `session.revokeAll` 与 `twoFactor.challenge` / `twoFactor.verify` 统一走 `logger.audit`，只记录标识与结果，不记录凭据。

## 2. 数据安全 (Data Security)

-   **输入校验**: 所有 API 请求参数必须使用 `utils/shared/` 下的 Zod Schema 校验，禁止直接信任 `getQuery` 或 `readBody` 的原始结果（见 [API 规范 - 参数校验](./api.md#5-参数校验-zod)）。
-   **防止注入**: 使用 TypeORM 的参数化查询与 Repository API，禁止拼接 SQL 字符串。
-   **敏感信息脱敏**: API 返回前对用户对象进行处理（剔除密码哈希、Token、内部字段等）。
-   **Secrets 管理**: 严禁将 API Keys、数据库密码等提交到 Git；一律使用 `.env` 环境变量并在 `nuxt.config.ts` / `server` 中读取，参考 `.env.example` 了解字段。

## 3. Web 安全防护 (Web Protection)

-   **XSS 防护**: 默认使用 Vue 的模板转义。使用 `v-html` 前必须严格校验与清洗内容（可使用 `sanitize-html`）。
-   **CSRF 防护**: 确保 API 使用 cookie 认证时带 SameSite 属性；敏感写操作按 better-auth 约定处理。
-   **CORS 配置**: 禁止在生产环境放开 `Access-Control-Allow-Origin: *`；按 OAuth 应用配置白名单。
-   **验证码与风控**: 登录、注册、验证码发送等接口接入 `server/utils/captcha-config.ts` / `rate-limit.ts` 能力，防止暴力破解与滥用。

## 4. 日志与监控 (Logging & Monitoring)

-   **日志记录**: 登录失败、权限拒绝、限流触发、敏感操作（改密、删除、授权）必须记录日志（使用内部 `logger` 模块）。
-   **禁止敏感信息日志**: 日志中严禁包含密码、Token、验证码、完整手机号等敏感字段。

## 5. 依赖与供应链安全 (Dependency & Supply Chain Security)

### 5.1 依赖管理

-   **定期更新**: 关注依赖的安全漏洞通告（Dependabot / `pnpm audit`），高危告警优先处理。
-   **最小依赖**: 新增依赖必须经过必要性评估，优先使用官方维护的安全库。
-   **对齐 CI**: 依赖安全检查应纳入 CI 或定期回归任务，本地抽查不能替代流水线检查。

### 5.1.1 pnpm supply-chain cooldown 命中时的处置

pnpm 10+ 默认启用 1440 分钟（24h）发布冷却期（`minimumReleaseAge`），防止从 registry 立即拉取刚发布的版本（典型防御场景：账号劫持后短时间内投毒）。当 Dependabot PR 引入刚发布的传递依赖时，`pnpm install --frozen-lockfile` 会触发 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`，导致 Test job 失败。

处置流程：

1.  从 CI 日志中提取违规包名与版本（例如 `obug@2.2.1 was published within the minimumReleaseAge cutoff`）。
2.  评估是否必须立刻拉取（通常不需要，可等 24h 自然 age out）；若必须，仅对该精确版本加入豁免。
3.  在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 中追加 `pkg@x.y.z`（pnpm 10.19+ 支持精确版本语法；OR 形式 `pkg@1.2.3 || 1.2.4` 也支持）。
4.  注释中标注"为何需要豁免"与"预计自然失效时间"，便于后续 review 时清理。
5.  严禁使用范围语法或 glob 通配符豁免（pnpm 不支持，会被忽略），否则豁免失效且无任何报错。

### 5.1.2 Security Auto Fix 工作流启用真实自动修复的前置条件

`.github/workflows/security-auto-fix.yml` 当前 schedule 触发默认采用 `report-only`（仅产出报告归档，不创建 PR）。若需启用 `fix-and-pr` 自动创建修复 PR，需满足以下前置条件，缺一不可：

1.  仓库 Settings → Secrets 配置 `GH_TOKEN`（fine-grained PAT，仓库级 Dependabot alerts: read 权限）；GITHUB_TOKEN 无法读取 Dependabot alerts API。
2.  workflow_dispatch 触发时显式选择 `mode: fix-and-pr`（默认即为 fix-and-pr，但 schedule 默认是 report-only）。
3.  验证链命令在 `commands` 中已配置（默认：pnpm i --frozen-lockfile + nuxt prepare + lint + typecheck + build）。

工作流内置 `Validate GH_TOKEN` 前置校验，先探测 `GET /user` 与 Dependabot alerts API 再进入扫描：401（token 失效）、403（缺 Dependabot alerts: read 或无权访问仓库）、404（仓库未启用 Dependabot alerts）均以 `::error` 直接失败并给出处置指引，不再产出"0 条告警"的误导性报告（run 40794773689 即为 `GH_TOKEN` 失效导致的 401）。

fine-grained PAT 有有效期，到期后会持续失败，轮换流程：

1.  GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens 重新生成：Repository access 选本仓库；Repository permissions 至少 `Dependabot alerts: Read`，`fix-and-pr` 模式另需 `Contents: Write`、`Pull requests: Write`。
2.  更新 Secret：`gh secret set GH_TOKEN --repo CaoMeiYouRen/caomei-auth`（或 Settings → Secrets and variables → Actions）。
3.  以 `mode: report-only` 手动运行一次，确认前置校验通过后再恢复 schedule。

无法提供有效 token 时，本地巡检改用 `pnpm audit`，不得把本工作流的报告结论当作"无告警"结论。

### 5.1.3 发布前安全告警门禁 (Release Security Alert Gate)

适用于任何生产发布（`release.yml`、`docker.yml` 的版本与镜像发布、`docker-publish.yml` 的 `mode=build` 重建）以及每周回归检查（`regression-weekly.yml` 的 schedule 运行）。检查对象是 GitHub Dependabot alerts 与 Code scanning alerts 中 `state=open` **与 `state=dismissed`** 的告警（`auto_dismissed` 不再适用，不参与阻断），两者采用同一处置口径。

| 严重级别 | 是否允许发布 | 要求 |
| --- | --- | --- |
| `critical` | 否 | 必须修复，**不允许豁免**；被 dismiss 也算存在，dismiss 不能替代修复 |
| `high` | 默认否 | `open` 仅 `no-fix` / `hard-fix` 可豁免；`dismissed` 仅 `false-positive` 可豁免。均须登记、追踪，并尽快安排修复 |
| `medium` | 是 | 记录在门禁报告中，随后续版本升级修复 |
| `low` | 是 | 同上 |

补充约束：

-   "修复成本过高"指升级路径受阻（上游未发布修复版本、升级会破坏跨 major 兼容等），对应豁免类别 `hard-fix`，不得因为"暂时不想改"而豁免。
-   豁免必须登记到 `.github/security-alert-exemptions.json`，以下字段缺一不可：
    1.  定位字段：`source` + `alertNumber`；或稳定标识（Dependabot 用 `ghsaId`，可配 `package`；Code scanning 用 `ruleId`，可配 `path`）。
    2.  `category`：`no-fix`（上游无可用修复版本）/ `hard-fix`（本发布窗口无法完成）/ `false-positive`（仅用于已 dismiss 的告警，且 `reason` 必须写明原 dismiss 原因）。
    3.  `reason`：为何当前无法修复（`false-positive` 时写原 dismiss 原因）。
    4.  `tracking`：追踪的 Issue 链接、`docs/plan/todo.md` 中的待办条目，或复核依据记录（`docs/design/governance/*.md`）；条目已归档时指向 `docs/plan/archive/` 的对应分片，不保留已迁移的旧路径（[AGENTS.md §7.4](../../AGENTS.md) 的「Issue 或待办条目」为摘要口径，字段形态以本节为准）。
    5.  `expiresAt`：复核截止日期（`YYYY-MM-DD`），到期即失效并重新阻塞发布。
-   `category` 与告警状态必须匹配：`open` 告警登记 `false-positive`、或 `dismissed` 告警登记 `no-fix` / `hard-fix`，门禁都判为未通过。
-   豁免不得用于 `critical`；已修复或已关闭的告警必须删除对应豁免条目，否则报告中会以"豁免清单问题"提示，避免历史条目掩盖新告警。
-   豁免条目字段不完整（缺少定位字段、`category`、`reason`、`tracking` 或合法 `expiresAt`）时，门禁直接判为未通过，需修正豁免清单后重跑。
-   无法完成扫描（`GH_TOKEN` 失效、权限不足、Dependabot alerts 未启用、Code scanning 告警接口返回 404、网络异常）按**未通过**处理；不得把"未扫描"当作"无告警"。

门禁实现：

-   脚本：`scripts/security/check-alerts.mjs`，本地等价命令 `pnpm security:alerts`（支持 `--scope=release|weekly`、`--report=`、`--json=`）。
-   发布前检查：`.github/workflows/release.yml`（semantic-release 与镜像推送）、`.github/workflows/docker.yml`（master 推送触发的 latest / sha-* 镜像发布及 Jenkins 部署）与 `.github/workflows/docker-publish.yml`（手动补发的 `mode=build` 重建路径；`retag` 复用已构建镜像，不重复扫描）均在发布动作之前执行，未通过则终止发布。
-   每周回归检查：`.github/workflows/regression-weekly.yml` 每周一 09:00（UTC+8）运行，内容等价于 `release.yml` 发布前质量门（`install` + `lint` + `lint:css` + `typecheck` + `build` + 测试与覆盖率，另补 `lint:md` / `ai:check` / `lint:duplicate` / `docs:build`，不含 semantic-release 与镜像推送），并同时执行本告警门禁；未通过时自动创建或更新「安全告警追踪」Issue（含阻塞项与豁免到期时间），恢复通过后自动关闭。
-   读取 Dependabot alerts 必须使用 `GH_TOKEN`（fine-grained PAT：Dependabot alerts: read）；`GITHUB_TOKEN` 无法读取该 API（403），Token 轮换流程见 5.1.2。Code scanning 使用 workflow 的 `GITHUB_TOKEN`（权限 `security-events: read`，环境变量 `CODE_SCANNING_TOKEN`），本地执行时回退 `GH_TOKEN`；两类 token 不共用，避免单一凭据失效同时中断两路扫描。
-   报告输出：完整 Markdown 写入 `--report` 文件与 GitHub Step Summary；设置 `GITHUB_STEP_SUMMARY` 时 stdout 仅输出一行状态，避免同一份报告同时出现在 Step Summary 与 Step Log。本地运行或显式 `--verbose` 时 stdout 输出完整 Markdown。weekly 的追踪 Issue 仍读取 `security-alert-report.md`，不受影响。

### 5.1.4 漏洞研判与安全公告 (Vulnerability Triage & Security Advisory)

适用于每日 12:00 的定时任务「CI 失败巡检修复」。

1.  **来源与权限**：Security advisories（含私下漏洞报告，入口见 [SECURITY.md](../../SECURITY.md)；需仓库管理级凭据，如 fine-grained PAT 的 `Repository security advisories: Read`，凭据不足时改为人工在 GHSA 页面读取并抄录到本地报告，并在摘要中显式告警）、Dependabot alerts（依赖 `GH_TOKEN`，见 §5.1.2）、Code scanning alerts（`GITHUB_TOKEN` / `GH_TOKEN`，见 §5.1.3）、issue 关键词检索（`security` / `vulnerability` / `CVE` / `漏洞` / `安全`）。任一来源不可用按「未扫描」记录，不得当作「无漏洞」（§5.1.3）。
2.  **本地研判，不得外泄**：安全公告与私下报告的内容**不得写入 issue、PR、评论，也不得推送到远端分支**；提交信息、分支名与 CHANGELOG 同样不得包含漏洞细节，统一使用中性描述（如 `fix(security): 修复鉴权边界判断`）。研判记录只落在本地 `.session/security-triage/<YYYY-MM-DD>.md`（`.session/` 已被 git 忽略），最少包含：来源与编号、报告摘要、复现与影响版本、攻击面前提、影响数据范围、严重级别（对照 §5.1.3 与 CVSS）、结论（真 / 误报 / 信息不足）、建议动作、时间戳。每周回归自动创建的「安全告警追踪」Issue 只承载告警元数据（编号 / 包 / 级别 / 豁免到期），不承载研判内容。
3.  **误报**：写明依据并记录到本地报告；Dependabot 告警 dismissal 使用 `fix_started` / `inaccurate` / `no_bandwidth` / `not_used` / `tolerable_risk`，Code scanning 使用 `false positive` / `won't fix` / `used in tests`，并填写 `dismissed_comment`；**仍须**按 §5.1.3 登记 `.github/security-alert-exemptions.json`（定位字段 `source` + `alertNumber`，或 `ghsaId` / `ruleId`；以及 `category=false-positive` + `reason` + `tracking` + `expiresAt`），否则发布门禁照旧判未通过。
4.  **为真**：在本地报告中给出修复方案（受影响文件、修复思路、回归范围、发布影响、公告要点），等待人工审查；**人工批准前不得改代码、不得推送、不得对外沟通**。研判结论与本地报告路径必须写进本次巡检摘要并标注「待人工审查」。已确认真实性且人工批准修复的漏洞，按 [规划规范 §3](./planning.md#3-准入规则) 的插队例外进入当前阶段并写明理由；尚未研判的新候选登记 `backlog.md`，不得直接写入 `todo.md`。
5.  **修复**：按 [AI 协作规范](./ai-collaboration.md) 走 PDTFC；安全 / 鉴权改动 `audit-depth=deep`；`critical` 必须修、`high` 默认阻塞（§5.1.3）；`pnpm security:alerts` 必须通过。
6.  **发布（两道人工门）**：方案批准 ≠ 发布批准。**发布批准须在合入 `master` 之前取得**——推送 `master` 即触发 `Publish Docker Image`（镜像发布与部署），合入本身已属发布动作（见 [Git 规范 §8](./git.md#8-推送策略)）。发布时需同时满足：人工批准发布、修复已合入 `master`、CI 全绿、`pnpm security:alerts` 通过、release notes 与公告文案已由人工确认；发版批准口径以本节为唯一事实源，`release.yml` 的触发方式见 Git 规范 §8。
7.  **发布方式**：release 用 `gh workflow run release.yml --ref master`（或仓库既有流程），版本号遵循 semver，安全修复默认 patch，触发后等待该次 run 结果；公告载体为 GitHub Security Advisory（GHSA），如需 CVE 编号须在 GHSA 草稿中 Request CVE 由 GitHub（CNA）分配，未获编号前公告写 `CVE ID: Pending`，不得对外声称已有 CVE；模板与协同披露顺序见 [SECURITY.md](../../SECURITY.md)。
8.  任一条件不满足时停在方案 / 草稿阶段，把缺口写入本地报告；禁止跳过人工确认直接发布。

### 5.2 供应链信任边界 (Supply Chain Trust Boundary)

引入新的依赖、MCP server、外部 skill/agent 或 AI 推荐的包时，必须执行来源核验，默认不信任：

1.  **AI 推荐包来源核验**: AI 推荐的包如果无法在官方 registry 确认存在，必须经过实际检索验证后再安装，警惕 typosquatting（如 `lodahs` vs `lodash`）等仿冒包。
2.  **锁定版本 + 锁文件**: 依赖锁定版本并提交锁文件（`pnpm-lock.yaml`）；CI / Dockerfile / 自动化脚本中的工具版本使用不可变版本（tag / SHA），禁止使用浮动标签。
3.  **外部 skill / agent / MCP 来源核验**: 引入外部 skill、agent 或 MCP server 前，必须核对来源仓库 URL 与维护组织是否为可信主体；警惕伪装成"有用文档 / 技能"诱导信任的投毒模式（TrustFall 教训）。来源不明的资产必须登记到 [外部 Skills 准入清单](./external-skills-intake.md) 并完成来源核验后才能引用（见 [AI 资产治理规范 - 2.2](./ai-governance.md#22-外部同步或平台提供资产)）。

## 6. 终端命令与自动化安全 (CLI & Automation Security)

执行任何自动化脚本或终端操作时，必须遵循以下安全准则：

-   **环境感知**: 执行任何 shell 命令之前，先检查当前操作系统（Windows / Linux / macOS）与终端（CMD / PowerShell / Bash），确保命令语法兼容。
-   **路径校验**: 执行涉及文件或目录删除的命令（如 `rm`、`rd`、`Remove-Item`）前，必须验证目标路径的存在性与有效性；只允许一次删除一个明确路径的文件，禁止批量删除文件或目录。
-   **禁止危险通配**: 禁止把未经验证的变量直接拼入通配符路径并传递给删除命令。禁止执行类似 `rm -rf /`、`rm -rf $EMPTY_VAR/*` 的高危命令。

## 7. 不可妥协清单 (Non-Negotiable Checklist)

以下项目在任何实现策略下都不能简化：

- **输入校验**: 所有 API 请求必须经过 Zod 或等价工具校验
- **鉴权逻辑**: 涉及用户数据的接口必须有明确权限边界；路径鉴权必须先归一化（见 1.2）
- **XSS 防护**: 用户输入渲染到页面之前必须经过转义或清洗
- **SQL 注入防护**: 必须使用参数化查询，禁止拼接 SQL
- **敏感信息脱敏**: API 返回前剔除密码、Token 等字段
- **异常处理**: 关键路径的异常必须记录日志并抛出，不吞异常
- **发布前安全告警门禁**: 扫描 `open` + `dismissed`；`critical` 零豁免（dismiss 也不能替代修复）；`high` 需按 `category` / `reason` / `tracking` / `expiresAt` 登记豁免后方可发布（见 [5.1.3](./security.md#513-发布前安全告警门禁-release-security-alert-gate)）
- **国际化文本**: UI 文本禁止硬编码，必须使用 i18n（见 [国际化实施方案](./i18n.md)）
