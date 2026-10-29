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
- 其他权限逻辑以 `server/utils/` 下对应工具为准，禁止在 Handler 内手写重复实现。

## 1. 认证与授权 (Authentication & Authorization)

-   **严格鉴权**: 所有涉及用户数据的 API 必须通过会话校验（`getUserSession`）或明确的路由保护。
-   **权限最小化**: 管理端接口必须使用 `checkAdmin`；业务逻辑中按角色判断时，使用统一的角色判断工具，禁止散落 `role === 'admin'` 一类硬编码判断。
-   **密码安全**: 禁止在数据库中存储明文密码。使用 better-auth 默认的安全哈希机制。

### 1.1 第三方认证插件端点 (Third-party Auth Plugin Endpoints)

-   **不信任上游默认端点**: better-auth 及其插件的端点默认可能只校验登录态（`sessionMiddleware`），不校验管理员身份。启用插件前必须核对上游实现，显式关闭或拦截其中的管理类端点。
-   **SSO 提供商仅限管理员维护**: `@better-auth/sso` 的 `/sso/register`、`/sso/update-provider`、`/sso/delete-provider`、`/sso/request-domain-verification`、`/sso/verify-domain` 必须通过 `disabledPaths`（统一列表见 `utils/shared/sso-management-paths.ts`）关闭，并把 `providersLimit` 设为 `0`；`server/middleware/2-auth.ts` 还会按 `isSsoManagementAuthPath` 追加管理员校验作为纵深防御。提供商维护只允许走 `/api/admin/sso/providers`。登录链路（`/sign-in/sso`、`/sso/callback*`、`/sso/saml2/*`）不在关闭列表内，必须保持可用。
-   **中间件与业务接口的权限口径**: 中间件层使用 `isUserAdmin`（只读判断，不额外查库）；业务接口仍使用 `checkAdmin`（读取会话中的角色，含 Demo 分支）。同一请求内的管理员角色同步由中间件调用 `checkAndSyncAdminRoleWithUser` 完成，两者结论必须一致。
-   **历史配置排查**: 升级或收紧 SSO 配置后，管理员必须调用 `GET /api/admin/sso/audit`（只读，不返回 `clientSecret`、`oidcConfig` 等敏感字段）核查 `suspiciousProviders` / `suspiciousAccounts`，确认后清理历史遗留的提供商与账号链接；仅关闭注册端点不会撤销已经建立的链接。清理顺序：先用 `DELETE /api/admin/sso/providers/{id}` 删除可疑 `sso_provider` 记录，再删除 `account` 表中对应 `providerId` 的链接——管理端删除接口只删除 provider，不会级联删除 account，残留链接在重建同名 `providerId` 后会重新生效。
-   **`trustEmailVerified` 使用前提**: 仅当用户无法自助注册 SSO 提供商（上述管理端点全部关闭）时才可开启；若重新开放注册，必须同时改为 `false`，或启用 `domainVerification` 并在 `SSOProvider` 实体中持久化 `domainVerified`（当前实体尚未包含该字段，启用前需先补列）。

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

适用于任何生产发布（`release.yml`、`docker.yml` 的版本与镜像发布）以及每周回归检查（`regression-weekly.yml` 的 schedule 运行）。检查对象是 GitHub Dependabot alerts 与 Code scanning alerts 中全部 `state=open` 的告警，两者采用同一处置口径。

| 严重级别 | 是否允许发布 | 要求 |
| --- | --- | --- |
| `critical` | 否 | 必须修复，**不允许豁免** |
| `high` | 默认否 | 无可用修复版本或修复成本过高时可豁免，但必须登记、追踪，并尽快安排修复 |
| `medium` | 是 | 记录在门禁报告中，随后续版本升级修复 |
| `low` | 是 | 同上 |

补充约束：

-   "修复成本过高"指升级路径受阻（上游未发布修复版本、升级会破坏跨 major 兼容等），不得因为"暂时不想改"而豁免。
-   豁免必须登记到 `.github/security-alert-exemptions.json`，以下字段缺一不可：
    1.  定位字段：`source` + `alertNumber`；或稳定标识（Dependabot 用 `ghsaId`，可配 `package`；Code scanning 用 `ruleId`，可配 `path`）。
    2.  `reason`：为何当前无法修复。
    3.  `tracking`：追踪的 Issue 链接或 `docs/plan/todo.md` 中的待办条目。
    4.  `expiresAt`：复核截止日期（`YYYY-MM-DD`），到期即失效并重新阻塞发布。
-   豁免不得用于 `critical`；已修复或已关闭的告警必须删除对应豁免条目，否则报告中会以"豁免清单问题"提示，避免历史条目掩盖新告警。
-   豁免条目字段不完整（缺少定位字段、`reason`、`tracking` 或合法 `expiresAt`）时，门禁直接判为未通过，需修正豁免清单后重跑。
-   无法完成扫描（`GH_TOKEN` 失效、权限不足、Dependabot alerts 未启用、网络异常）按**未通过**处理；不得把"未扫描"当作"无告警"。

门禁实现：

-   脚本：`scripts/security/check-alerts.mjs`，本地等价命令 `pnpm security:alerts`（支持 `--scope=release|weekly`、`--report=`、`--json=`）。
-   发布前检查：`.github/workflows/release.yml`（semantic-release 与镜像推送）与 `.github/workflows/docker.yml`（master 推送触发的 latest / sha-* 镜像发布及 Jenkins 部署）均在发布动作之前执行，未通过则终止发布。
-   每周回归检查：`.github/workflows/regression-weekly.yml` 每周一 09:00（UTC+8）运行，内容等价于 `release.yml` 发布前质量门（`install` + `lint` + `lint:css` + `typecheck` + `build` + 测试与覆盖率，另补 `lint:md` / `ai:check` / `lint:duplicate` / `docs:build`，不含 semantic-release 与镜像推送），并同时执行本告警门禁；未通过时自动创建或更新「安全告警追踪」Issue（含阻塞项与豁免到期时间），恢复通过后自动关闭。
-   读取 Dependabot alerts 必须使用 `GH_TOKEN`（fine-grained PAT：Dependabot alerts: read）；`GITHUB_TOKEN` 无法读取该 API（403），Token 轮换流程见 5.1.2。

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
- **鉴权逻辑**: 涉及用户数据的接口必须有明确权限边界
- **XSS 防护**: 用户输入渲染到页面之前必须经过转义或清洗
- **SQL 注入防护**: 必须使用参数化查询，禁止拼接 SQL
- **敏感信息脱敏**: API 返回前剔除密码、Token 等字段
- **异常处理**: 关键路径的异常必须记录日志并抛出，不吞异常
- **发布前安全告警门禁**: `critical` 零豁免；`high` 需登记 `reason` / `tracking` / `expiresAt` 豁免后方可发布（见 [5.1.3](./security.md#513-发布前安全告警门禁-release-security-alert-gate)）
- **国际化文本**: UI 文本禁止硬编码，必须使用 i18n（见 [国际化实施方案](./i18n.md)）
