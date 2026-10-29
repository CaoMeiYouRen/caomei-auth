# better-auth 1.7 升级规划

> 状态：`implemented`（Phase 1–2 已完成并落地 `feat/better-auth-1.7`；Phase 3 运行时验证待 staging 执行）
> 日期：2026-08-30（2026-10-29 更新）
> 适用范围：草梅 Auth 项目核心鉴权层（`lib/auth.ts`、`lib/auth-client.ts`、`server/database/storage.ts`、所有 `composables/use-*-flow.ts` 中涉及 `authClient.*` 的路径）

## 1. 背景与动机

`better-auth` 当前版本为 **`~1.6.30`**（pnpm-lock.yaml 锁定，semver 限定 1.6.x patch 范围）。上游 1.7 系列已发布（当前 latest 为 1.7.2），引入多项 breaking changes。2026-08-29 dependabot #604 将 `better-auth` 从 1.6.22 自动 bump 到 1.7.1 后，CI Test workflow 在 `pnpm run typecheck` 阶段暴露 16 处 TypeScript error（参见下方"风险点"详表）。

按 [PDTFC 5.1 插队规则](https://github.com/CaoMeiYouRen/caomei-auth/blob/master/AGENTS.md)，完整 1.7 迁移属于"探索性能力"（涉及 8+ 个文件、API 类型签名变化、社会化登录 provider scopes 移除），不适合作为 hotfix 通过 typecheck 改造完成。本次修复选择：

1. **紧急回退** better-auth 到 `~1.6.30`（API 兼容）恢复 CI 绿色
2. **独立规划** 1.7 升级到专项任务（本文件），按四阶段驱动
3. **dependabot 锁定** 防止后续自动再次触发 1.7 升级

**为何必须升级到 1.7**（动机）：

1. 1.7 修复了关键 bug：
   - `auth migrate` 在已存在数据的表上添加无默认值 required 列失败（`GHSA-...` advisory 修复）
   - native database transaction 支持（PostgreSQL / MySQL 测试实例）
   - bundled deps 升级（`jose`、nanostores、noble crypto、SimpleWebAuthn）
2. 1.6 line 进入维护模式，新特性只在 1.7+ 累积
3. 官方弃用插件（`oidcProvider`、`mcp`）在 1.7 中已**彻底移除**，6.x → 7.x 的 deprecation 周期已经结束

**为何必须独立规划**（风险）：

1. **API 类型签名变化**：1.7 移除 `oidcProvider` plugin（→ `@better-auth/oauth-provider` 独立包）、`oidcClient` / `genericOAuthClient` client plugin（→ 标准 social client API）
2. **Social provider scopes 配置移除**：Facebook / Twitter 等 provider 的 `scopes` 选项不再被接受
3. **`SecondaryStorage` 接口扩展**：必须实现 `increment` 和 `getAndDelete`（之前是 optional，现在是 required）
4. **`user.changeEmail.sendChangeEmailVerification` 改名** `sendChangeEmailConfirmation`
5. **`auth.api.createUser` 类型推断路径变化**，所有 `auth.api.xxx` 调用的类型推断需要重新核对
6. **better-auth 内部类型推断**：`role`、`accountId` 等 admin / account linking 字段类型需要从 server-side schema 重导出

## 2. 现状盘点

| 资产 | 现状 | 评估 |
|---|---|---|
| `package.json` 锁定版本 | `better-auth: ~1.6.30` | ✅ 起点明确（本次修复后的状态） |
| pnpm-lock.yaml 解析版本 | `better-auth@1.6.30` | ✅ |
| `@better-auth/sso` peer | `1.6.11` | ✅ 与 1.6.x line 兼容 |
| `better-auth-localization` peer | `3.0.0` | ✅ |
| `lib/auth.ts` 服务端配置 | 使用 `oidcProvider` plugin（位于 `better-auth/plugins`） | ⚠️ 1.7 中需迁移到 `oauthProvider`（独立包） |
| `lib/auth-client.ts` 客户端配置 | 使用 `genericOAuthClient()`、`oidcClient()` | ⚠️ 1.7 中已移除 |
| `server/database/storage.ts` 实现 | `BaseStorage` 含 `get/set/delete/increment`，`SecondaryStorage` 仅 3 方法 | ⚠️ 1.7 要求 `increment` + `getAndDelete` |
| `composables/use-login-flow.ts` | 使用 `authClient.oauth2.*` | ⚠️ 来自 `oidcClient()`，1.7 后端点路径可能变化 |
| `composables/use-oauth-consent.ts` | 使用 `authClient.oauth2.*` | ⚠️ 同上 |
| `composables/use-profile-flow.ts` | 使用 `authClient.account.unlink({ providerId, ... })` | ⚠️ 1.7 中 `providerId` 选项在 client 端可能改名 |
| `composables/use-security-settings.ts` | 假设 twoFactor 返回值总是有 `totpURI` 和 `backupCodes` | ⚠️ 1.7 中类型变 union（`{ method: "otp" } \| { method: "totp"; totpURI; backupCodes }`） |
| `server/middleware/2-auth.ts` | 使用 user.role 字段 | ⚠️ 依赖 `inferAdditionalFields<typeof auth>()` 推断，1.7 类型推断路径变化 |
| `server/utils/check-admin.ts` | 同上 | ⚠️ 同上 |
| `server/database/index.ts` | `auth.api.createUser` | ⚠️ 1.7 中类型推断需要重新核对 |
| `tests/unit/server/email.spec.ts` | mock `BaseStorage` | ⚠️ 1.7 后 mock 需要补 `getAndDelete` |

### 兼容基础结论

源代码层面存在 **多处需调整**：1.7 移除/改名的 API 直接影响 `lib/auth*.ts`（server + client）；运行时类型推断变化连锁影响 5 个 composables + 3 个 server utils。所有改动都是**机械迁移**（按官方升级指南一一对应），无功能性破坏风险。

## 3. 关键风险点（按依赖图分层）

### 3.1 🔴 必须修复（hotfix blocker）—— 已通过回退 1.6.30 解决

| 错误 | 位置 | 触发版本 |
|---|---|---|
| `'better-auth/plugins'` 没有导出 `oidcProvider` | `lib/auth.ts:13` | 1.7.0 |
| `'better-auth/client/plugins'` 没有导出 `genericOAuthClient` | `lib/auth-client.ts:2` | 1.7.0 |
| `'better-auth/client/plugins'` 没有导出 `oidcClient` | `lib/auth-client.ts:2` | 1.7.0 |
| `SecondaryStorage` 必须实现 `increment` 和 `getAndDelete` | `server/database/storage.ts:83` | 1.7.0 |

### 3.2 🟡 计划迁移（升级专项任务范围）

| 变更 | 官方迁移指南 | 本项目适配 |
|---|---|---|
| `oidcProvider` plugin 移除 → `@better-auth/oauth-provider/oauthProvider` | ✅ 必须安装新包 | `lib/auth.ts` 中 `oidcProvider({...})` → `oauthProvider({...})` |
| `oidcClient()` client plugin 移除 | ❓ 1.7 文档未明确替代，需查源码 | `lib/auth-client.ts` 删除 `oidcClient()`；对应 `authClient.oauth2.*` 端点改用 server 路由 |
| `genericOAuthClient()` 移除 → 标准 social client API | ⚠️ 需逐场景改写 | `lib/auth-client.ts` 删除；对应社交登录端点改用通用 social client |
| `user.changeEmail.sendChangeEmailVerification` → `sendChangeEmailConfirmation` | ✅ 直接改名 | `lib/auth.ts:136` |
| Facebook / Twitter `scopes` 选项移除 | ⚠️ 需查每个 provider 新 API | `lib/auth.ts:169, 181` |
| `oauthProvider` 包配置项兼容 | ⚠️ 部分选项（`validAudiences`）移除；新增 `resources` 显式资源模型 | 检查现有 `metadata`/`requirePKCE`/`trustedClients` 等选项是否保留 |
| `auth.api.createUser` 类型推断 | ⚠️ 需重新核对 | `server/database/index.ts:74, 92, 123` |
| twoFactor 返回类型变 union | ✅ narrowing 处理 | `composables/use-security-settings.ts:80-82` |
| account linking `providerId` 选项 | ⚠️ 需查 1.7 client API | `composables/use-profile-flow.ts:154, 182` |
| user role 类型推断 | ⚠️ server schema 重导出 | `server/middleware/2-auth.ts:32` + `server/utils/check-admin.ts:28` |
| `SecondaryStorage.getAndDelete` 实现 | ✅ 新增方法 | `server/database/storage.ts` |

### 3.3 🟢 低风险（驱动层 / 平台层）

本项目使用 PostgreSQL + Nuxt 全栈 + 无 NestJS，不受以下 1.7 变更影响：
- SQLite `sqlite3` → `better-sqlite3`
- MongoDB 驱动 v7
- MySQL `connectorPackage` 移除
- Redis 缓存升级到 v4+
- NestJS `@nestjs/typeorm` v11.0.1+ 适配

## 4. 升级策略：四阶段

### Phase 1：预演与代码扫描（预计 1 周）

- [x] 通读官方 [1.7 upgrade guide](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/guides/1-7-upgrade-guide.mdx) 全章
- [x] 比对 `lib/auth.ts` 中 `oidcProvider({...})` 配置（约 60 行）映射到 `oauthProvider({...})` 的逐项差异（重点：`metadata` / `requirePKCE` / `allowDynamicClientRegistration` / `generateClientId` / `generateClientSecret` / `scopes` / `getAdditionalUserInfoClaim` / `trustedClients`）
- [x] 调研 `genericOAuthClient` / `oidcClient` 在 1.7 中的替代方案（查 better-auth Discord / GitHub Discussions）
- [x] 调研 `account.unlink({ providerId })` 在 1.7 client 的正确签名
- [x] 编写类型收窄 helper：`(result: TwoFactorResponse) => 'totpURI' in result` 用于 `use-security-settings.ts`
- [x] 编写依赖 mock 更新：`tests/unit/server/email.spec.ts` 中 mock 加 `getAndDelete`

### Phase 2：依赖升级与基础类型（预计 1 周）

- [x] 单 PR 升级 `package.json` `better-auth` 到 `~1.7.14`（含 `@better-auth/sso`、`better-auth-localization`、`@better-auth/oauth-provider`）
- [x] `pnpm install` 让 lockfile 自然重写
- [x] 重点审计 8+ 文件的 typecheck 错误（每个错误对应一个迁移点）
- [x] `pnpm run lint && pnpm run typecheck && pnpm run build` 三关必须通过
- [x] 不跑端到端，先保证编译通过

### Phase 3：运行时验证（预计 1–2 周）

- [ ] **staging 环境**完整跑以下路径：
  - 邮箱 + 密码注册 → 登录
  - OAuth 授权回调（GitHub / Google）
  - SSO 登录
  - 手机号验证码登录
  - 二次验证（含 totp 与 otp 两种 method 分支）
  - 账号解绑（client API 变更路径）
  - 邮箱更换（`sendChangeEmailConfirmation`）
  - admin role sync
  - OAuth Provider（`oauthProvider` 替代 `oidcProvider` 后的动态客户端注册、scopes、custom claims）
- [ ] 检查 `auth.api.createUser` 在初始化流程中的实际行为
- [ ] 监控日志中是否有 `SecondaryStorage.getAndDelete` 调用失败

### Phase 4：合并与发布（预计 1 天）

- [ ] 单独 release PR，单 commit `chore(deps)!: bump better-auth from 1.6.30 to 1.7.x`
- [ ] PR body 必须包含：
  - 本文档链接
  - Phase 1–3 验证矩阵全部 ✅ 勾选
  - 已知风险点（3.2 节）与缓解措施
- [ ] 合并到 master 后观察下一个 release schedule
- [ ] 升级完成后删除 `better-auth >=1.7.0` ignore 段

## 5. 验证矩阵（必须 100% 通过）

| # | 测试项 | 工具 | 状态 |
|---|---|---|---|
| 1 | `pnpm run lint` | ESLint | ☐ |
| 2 | `pnpm run typecheck` | `tsc --noEmit` | ☐ |
| 3 | `pnpm run test` | Vitest | ☐ |
| 4 | `pnpm run build` | Nuxt build | ☐ |
| 5 | 邮箱密码注册 → 登录 → session 创建 | E2E | ☐ |
| 6 | OAuth 授权回调（GitHub / Google） | E2E | ☐ |
| 7 | SSO Provider CRUD + 登录 | E2E | ☐ |
| 8 | 手机号验证码登录 | E2E | ☐ |
| 9 | 二次验证（otp + totp 两条分支） | E2E | ☐ |
| 10 | 账号解绑 | E2E | ☐ |
| 11 | 邮箱更换 | E2E | ☐ |
| 12 | admin role sync | E2E | ☐ |
| 13 | OAuth Provider（动态客户端注册、scopes、custom claims） | E2E | ☐ |
| 14 | `auth.api.createUser` 初始化流程 | E2E | ☐ |

## 6. 回滚方案

由于本次回退已在 master 落地（`better-auth: ~1.6.30`），回滚路径稳定：

1. **Phase 1–2 期间**：直接在分支上 revert，无需 release
2. **已合并到 master 但未发布**：`git revert <merge-commit>`
3. **已发布**：
   - patch release（保留 `~1.6.30` 不变）
   - 1.6 line 仍维护，1.7.x 是 1.6.x 的 superset，回滚后 API 完全兼容

## 7. 预估工作量

| 阶段 | 预估时间 | 主要风险 |
|---|---|---|
| Phase 1（预演扫描） | 1 周 | 部分 client API 文档可能不完整，需读源码 |
| Phase 2（依赖升级） | 1 周 | 类型推断可能牵涉 5+ 个文件 |
| Phase 3（运行时验证） | 1–2 周 | OAuth Provider 迁移可能有功能差异 |
| Phase 4（合并发布） | 1 天 | 无额外风险 |
| **合计** | **3–4 周** | 不属于紧急修复，可排在正常迭代中 |

## 7.1 Phase 1–2 实施记录（2026-10-29）

### 依赖变更

| 包 | 1.6 | 1.7 |
|---|---|---|
| `better-auth` | `~1.6.33` | `~1.7.14` |
| `@better-auth/sso` | `1.6.30` | `1.7.14` |
| `better-auth-localization` | `^3.0.0` | `^4.0.0` |
| `@better-auth/oauth-provider` | — | `1.7.14`（替代内置 `oidcProvider`） |

- `pnpm-workspace.yaml` 的 `better-auth` override 同步提升到 `^1.7.14`。
- `patchedDependencies` 中的 `@better-auth/utils@0.4.2` 补丁迁移到 `@better-auth/utils@0.5.1`（内容不变：去掉 `./password` 的 workerd/node 导出条件，保证 Nuxt/Nitro 打包可用）。
- 新增 `publicHoistPattern`（`better-auth` / `@better-auth/*` / `@better-fetch/*` / `better-call` / `htmlparser2`）：better-auth 1.7 会以裸包名导入自身传递依赖，pnpm 默认隔离会让 dev 模式下的 Nitro 外部化解析失败（`Cannot find package '@better-fetch/fetch'`）。

### 代码迁移

| 位置 | 变更 |
|---|---|
| `lib/auth.ts` | `oidcProvider` → `oauthProvider`；`metadata` / `trustedClients` 移除（发现文档改为自动生成）；`getAdditionalUserInfoClaim` → `customUserInfoClaims`（`sub` 由服务端生成，不再手写）；`sendChangeEmailVerification` → `sendChangeEmailConfirmation`；显式设置 `baseURL` 与 `jwt.issuer`，保证发现文档端点为绝对 URL 且 issuer 与 1.6 一致 |
| `lib/auth-client.ts` | 移除 `genericOAuthClient()` / `oidcClient()`，改用 `oauthProviderClient()`（自动为 oauth2 POST 附加签名查询参数） |
| `composables/use-login-flow.ts` / `use-profile-flow.ts` | 通用 OAuth 登录改走 `signIn.social({ provider })`；绑定改走 `linkSocial()`；`unlinkAccount` 只传 `accountId`（1.7 移除 `providerId` 选择器） |
| `composables/use-oauth-consent.ts` | 同意提交改走 `authClient.$fetch('/oauth2/consent')`，响应由 `redirectURI` 改为 `{ redirect, url }` |
| `composables/use-security-settings.ts` | `twoFactor.enable` 显式传 `method: 'totp'` 并按返回的联合类型收窄 |
| `server/database/storage.ts` | `SecondaryStorage` 补 `increment` / `getAndDelete`；内存实现的 `increment` 仅在首次创建时设置 TTL |
| `server/entities/oauth-*` | 按 1.7 模型重建 7 张表：`oauth_client`、`oauth_resource`、`oauth_client_resource`、`oauth_access_token`、`oauth_refresh_token`、`oauth_consent`、`oauth_client_assertion`；删除 `oauth_application` |
| `server/api/admin/oauth/applications/*` | 内部改用 `OAuthClient`，对外仍保持 1.6 的字段命名（`redirectURLs` / `scope` / `type` 等），前端管理页无需改写 |
| `server/api/oauth/*` | 客户端公开信息、授权同意列表改用 `oauth_client`；同意记录不再有 `consentGiven`（存在即已授权），`scopes` 改为数组 |
| `server/api/auth/[...all].ts` + `server/routes/.well-known/*` | 1.7 将发现端点改为 server-only，需自行暴露：根路径 `/.well-known/openid-configuration`、`/.well-known/oauth-authorization-server`，并兼容旧的 `/api/auth/.well-known/*` |
| SSO 属性映射 | 移除 `mapping.id`（1.7 中 OIDC 用 `sub`、SAML 用 `NameID`，且 schema 为 `z.strictObject`，多余字段会直接报错） |

### 关键决策

1. **客户端密钥存储**：沿用 1.7 默认 `storeClientSecret: "hashed"`（SHA-256 + base64url）。管理端创建应用时按同一算法写库，明文密钥只在创建响应里返回一次。
2. **PKCE 默认值**：1.7 中 `client.requirePKCE ?? true`，与 1.6 的 `requirePKCE: false` 行为冲突。管理端创建客户端与演示数据显式写入 `requirePKCE: false`，保持既有接入方无需改造。
3. **issuer 保持根 URL**：`jwt.issuer` 继续取 `AUTH_BASE_URL`，避免已接入客户端校验 `iss` 失败；发现文档位于根路径（符合 OIDC Discovery 规范），同时保留旧路径。
4. **表结构来源**：实体字段直接对齐 `getAuthTables()` 输出，并新增回归测试 `tests/unit/server/database/oauth-schema.spec.ts`（模型↔实体映射 + 数组/JSON 字段读写）。
5. **部署建表脚本**：`database/{sqlite,mysql,postgres}/create.sql` 已同步为 1.7 的 7 张 OAuth 表（列数 16/37/4/6/9/19/15），并在 SQLite、PostgreSQL 16、MySQL 8.4 中实际执行验证通过。

### 生产库迁移清单（`synchronize: false` 时必须手工执行）

1. 新建 5 张表：`oauth_client`、`oauth_resource`、`oauth_client_resource`、`oauth_refresh_token`、`oauth_client_assertion`。
2. `oauth_application` → `oauth_client` 数据迁移：`redirectURLs`（逗号/换行分隔）拆成 `redirect_uris` 数组、`type` → `application_type`、`scope` → `scopes` 数组、`client_uri` → `uri`、`logo_uri` → `icon`、`tos_uri` → `tos`、`policy_uri` → `policy`、`description` 保留为扩展列。
3. 既有客户端密钥是明文，1.7 期望哈希值：迁移时对每个 `client_secret` 计算 `base64url(sha256(secret))` 后写回，同时把这些客户端的 `require_pkce` 置为 `false`。
4. `oauth_access_token` 结构变更（`token` / `scopes` / `resources` 等）：旧表数据可丢弃（访问令牌短时有效），建议改名备份后重建。
5. SSO：清理 `sso_provider.oidc_config` / `saml_config` 中 `mapping.id` 字段，否则 1.7 的 `z.strictObject` 校验会让该提供商的登录直接失败。
6. `oauth_consent` 无 `consent_given` 字段（存在即授权），`scopes` 改数组。

> 项目当前没有 TypeORM migration 框架，以上 DDL/DML 需在发布窗口按环境手工执行；开发与测试环境由 `synchronize` 自动建表。

### 已知遗留

- Phase 3 的 staging E2E 矩阵（见第 5 节）尚未执行。
- Demo 模式数据预填在 1.7 下报 `Username is invalid`（演示用户名为中文），导致演示数据未写入；不影响生产路径，待单独修复。
- `deepmerge` / `node-forge` 之外的其余 Dependabot 告警已在 1.7 升级中闭环，需合并到默认分支后由 GitHub 重新扫描确认。

## 8. 与现有依赖治理的关系

- `.github/dependabot.yml` 中 `better-auth >=1.7.0` 的 ignore 段已随本次升级删除（1.7 已是当前基线）
- `package.json` 改用 `~1.7.14` 锁定 patch 线，`@better-auth/*` 生态包保持同版本
- 后续 `@better-auth/sso`、`better-auth-localization` 的兼容窗口仍需在每次 1.7.x patch 升级时复核

## 9. 参考资料

- 官方 1.7 升级指南：<https://github.com/better-auth/better-auth/blob/main/docs/content/docs/guides/1-7-upgrade-guide.mdx>
- 官方 1.7 RC 发布说明：<https://github.com/better-auth/better-auth/blob/main/docs/content/blogs/1-7-rc.mdx>
- 官方 oauth-provider 插件文档：<https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/oauth-provider.mdx>
- 官方 CHANGELOG：<https://github.com/better-auth/better-auth/blob/main/packages/better-auth/CHANGELOG.md>
- 项目 PR 历史：[#604](https://github.com/CaoMeiYouRen/caomei-auth/pull/604) — 已 squash merge 到 master 后回退
- dependabot 配置：`.github/dependabot.yml`
- 项目 ORM 适配层：`server/database/typeorm-adapter.ts`

## 10. 变更记录

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-08-30 | 初始登记；dependabot #604 合并 1.7.1 后 CI 失败，已紧急回退到 `~1.6.30`；dependabot 已配置 ignore | full-stack-master |
| 2026-10-29 | Phase 1–2 落地：依赖升级到 1.7.14、`oauthProvider` 迁移、OAuth 实体重建、发现端点自暴露、SSO `mapping.id` 清理；新增模型映射回归测试；补充生产库迁移清单 | full-stack-master |