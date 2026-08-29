# better-auth 1.7 升级规划

> 状态：`proposed`
> 日期：2026-08-30
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

- [ ] 通读官方 [1.7 upgrade guide](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/guides/1-7-upgrade-guide.mdx) 全章
- [ ] 比对 `lib/auth.ts` 中 `oidcProvider({...})` 配置（约 60 行）映射到 `oauthProvider({...})` 的逐项差异（重点：`metadata` / `requirePKCE` / `allowDynamicClientRegistration` / `generateClientId` / `generateClientSecret` / `scopes` / `getAdditionalUserInfoClaim` / `trustedClients`）
- [ ] 调研 `genericOAuthClient` / `oidcClient` 在 1.7 中的替代方案（查 better-auth Discord / GitHub Discussions）
- [ ] 调研 `account.unlink({ providerId })` 在 1.7 client 的正确签名
- [ ] 编写类型收窄 helper：`(result: TwoFactorResponse) => 'totpURI' in result` 用于 `use-security-settings.ts`
- [ ] 编写依赖 mock 更新：`tests/unit/server/email.spec.ts` 中 mock 加 `getAndDelete`

### Phase 2：依赖升级与基础类型（预计 1 周）

- [ ] 单 PR 升级 `package.json` `better-auth` 到 `^1.7.2`
- [ ] `pnpm install` 让 lockfile 自然重写
- [ ] 重点审计 8+ 文件的 typecheck 错误（每个错误对应一个迁移点）
- [ ] `pnpm run lint && pnpm run typecheck && pnpm run build` 三关必须通过
- [ ] 不跑端到端，先保证编译通过

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

## 8. 与现有依赖治理的关系

- `.github/dependabot.yml` 已添加 `better-auth >=1.7.0` ignore（参考现有 `typeorm >=1.0.0` 写法），防止 dependabot 再次自动开 PR
- ignore 段同样作用于 **安全更新**：1.x 线专属安全修复不会自动出 PR，由 Dependabot alerts + `security-alert-remediator` skill 兜底
- 升级完成后，需要：
  1. 删除 `better-auth >=1.7.0` ignore 段
  2. 重新评估其他核心依赖（`@better-auth/sso`、`better-auth-localization`）的兼容窗口

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