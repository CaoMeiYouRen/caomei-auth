# TypeORM 0.3 → 1.0 升级规划

> 状态：`proposed`
> 日期：2026-08-30
> 适用范围：草梅 Auth 项目后端 ORM（`server/database/`、`lib/auth.ts`、所有 `server/api/**` 中涉及数据库读写的路径）

## 1. 背景与动机

`typeorm` 当前版本为 **0.3.31**（pnpm-lock.yaml 锁定），已被上游 1.0 系列取代。Dependabot 已多次尝试自动升级到 1.x（参见已关闭的 [#564](https://github.com/CaoMeiYouRen/caomei-auth/pull/564)，标题 `chore(deps): bump typeorm from 0.3.31 to 1.1.0`），但因 1.0 是含 breaking changes 的 **major 跨级 release**（0.x → 1.x，跨 7 个 minor），不适合通过 dependabot 自动 PR 完成。

**为何必须升级**：

1. 0.3.x 已停留在维护模式，新依赖与新 feature 在 1.x 线持续累积
2. 0.3.x 与现代 Node.js 生态（ESM 完整支持、`tinyglobby` glob、`@aws-sdk/*` v4 等）的集成越来越多 workaround
3. 项目使用 `engines.node: ^20.19.0 || >=22.12.0`，已满足 1.0 硬要求

**为何不能快速升级**：

1. 1.0 引入多项 **运行时行为变更**（见第 3 节），不验证就上生产会破坏登录、OAuth、SSO 等核心路径
2. better-auth 内部通过 `server/database/typeorm-adapter.ts` 调用 typeorm，间接影响所有鉴权流程
3. 官方推荐迁移工具 `@typeorm/codemod` 需要在源代码层面执行，本项目的核心 ORM 用法集中在 better-auth 适配层，迁移评估需逐项核对

## 2. 现状盘点

| 资产 | 现状 | 评估 |
|---|---|---|
| `package.json` 锁定版本 | `typeorm@0.3.31` | ✅ 起点明确 |
| pnpm-lock.yaml 解析版本 | `typeorm@0.3.31` | ✅ 无 transitive 异常 |
| 数据库 | PostgreSQL（通过 `@aws-sdk/client-s3` + 内部 SQL 推断 + env 变量） | ✅ 1.0 主要变更集中在 MySQL / SQLite / MongoDB / MSSQL |
| ORM 使用风格 | `dataSource.getRepository()` / `manager.getRepository()` | ✅ 与 1.0 推荐写法一致 |
| 全局便利函数（`getConnection`/`getManager`/`createConnection`） | ❌ 未使用 | ✅ 0 处匹配，迁移成本极低 |
| `findOneById` / `findByIds` | ❌ 未使用 | ✅ 0 处匹配 |
| `onConflict()` | ❌ 未使用 | ✅ 0 处匹配 |
| `printSql()` | ❌ 未使用 | ✅ 0 处匹配 |
| `exist()` (1.0 改名 `exists`) | ❌ 未使用 | ✅ 0 处匹配 |
| 字符串数组 `relations: ["x"]` / `select: ["x"]` | ❌ 未使用 | ✅ 0 处匹配 |
| SQLite / MongoDB / MSSQL / Expo / Oracle / SAP HANA | ❌ 未使用 | ✅ 不受影响 |
| IoC 容器（`useContainer` / typeorm-typedi-extensions） | ❌ 未使用 | ✅ 不受影响 |
| `@nestjs/typeorm` | ❌ 未使用（项目为 Nuxt 全栈） | ✅ 不受影响 |
| `better-auth` 内部 typeorm 用法 | 通过 `server/database/typeorm-adapter.ts` 间接调用 | ⚠️ 需要在升级后跑完整端到端验证 |

### 兼容基础结论

源代码层面 **绿灯**：项目早在 0.3 阶段已采用现代写法，1.0 移除的所有 API 在项目代码中均无使用。升级阻力集中在 **运行时行为变更**（见第 3 节），不在 API 兼容。

## 3. 关键风险点（Breaking Changes 评估）

按官方 [Upgrading from 0.3 to 1.0](https://typeorm.io/docs/releases/1.0/upgrading-from-0.3/) 逐项评估对本项目的影响：

### 3.1 🔴 高风险：必须端到端验证

| 变更 | 官方描述 | 本项目影响评估 |
|---|---|---|
| `invalidWhereValuesBehavior` 默认从 `ignore` 改为 `throw` | `where: { id: undefined }` 不再 silently 返回所有行，会抛 `TypeORMError` | **必须验证**：better-auth 内部查询可能传入 undefined 字段（如 session 校验、OAuth 回调），0.3 会"宽容返回"，1.0 会"严格抛错"。**需要回归测试所有鉴权流程** |
| `nullable: false` 关系改用 INNER JOIN | 非空外键从 LEFT JOIN 改为 INNER JOIN | **数据完整性假设**：若数据库存在孤儿外键，原本能查到的数据集会缺失。需先 `SELECT COUNT(*) FROM ... WHERE fk NOT IN (...)` 验证 |
| 缓存 hash 函数变更 | SHA1 输入从 `encodeURIComponent(input)` 改为 `input` 直接 hash | **缓存全失效**：query result cache、session cache 命中率短期下降，可接受 |

### 3.2 🟡 中风险：需逐文件检查

| 变更 | 官方描述 | 本项目影响评估 |
|---|---|---|
| 移除全局便利函数（`getRepository`、`getManager`、`getConnection` 等） | 0.3 已 deprecated，1.0 移除 | ✅ 已用 `dataSource.getRepository()`，无影响 |
| `onConflict()` 移除，改用 `orIgnore()` / `orUpdate()` | 改用更类型安全的 API | ✅ 未使用 |
| `findOneById` / `findByIds` 移除 | 改用 `findOneBy` / `findBy(In())` | ✅ 未使用 |
| `exist()` → `exists()` | 简单重命名 | ✅ 未使用 |
| 字符串数组 `relations` / `select` 移除，改对象语法 | 类型更安全 | ✅ 未使用（已在用对象语法） |
| `@RelationCount` / `loadRelationCountAndMap` 移除 | 改用 `@VirtualColumn` + 子查询 | ✅ 未使用 |
| `QueryBuilder.printSql()` 移除 | 改用 `getSql()` / `getQueryAndParameters()` | ✅ 未使用 |
| `QueryBuilder.useIndex()` 不再接受 raw SQL | 改为索引名数组 | ✅ 未使用 |
| `setNativeParameters()` 移除 | 改用 `setParameters()` | ✅ 未使用 |
| Lock modes 重命名（`pessimistic_partial_write` → `pessimistic_write + setOnLocked`） | 老 lock mode 移除 | ✅ 未使用 |
| `getAllMigrations()` 移除 | 改用 `getPendingMigrations()` / `getExecutedMigrations()` | ✅ 未使用 |
| `QueryRunner.loadedTables` / `loadedViews` 异步化 | 改用 `await getTables()` / `await getViews()` | ⚠️ 项目可能用到同步版本，需 `grep` 确认 |
| `EntityMetadata.createPropertyPath()` (static) 移除 | 无替代 | ⚠️ 仅影响自定义 driver / 高级用法，本项目不使用 |

### 3.3 🟢 低风险：驱动层 / 平台层

| 变更 | 适用场景 | 本项目 |
|---|---|---|
| SQLite `sqlite3` → `better-sqlite3` | SQLite 用户 | ❌ 不使用 |
| MongoDB 驱动升级到 v7+ | MongoDB 用户 | ❌ 不使用 |
| MySQL `connectorPackage` 移除 | MySQL 用户 | ❌ 不使用（PostgreSQL） |
| MSSQL `domain` 改 `authentication: { type: 'ntlm' }` | MSSQL 用户 | ❌ 不使用 |
| Redis (cache) 升级到 v4+ | 使用 cache 的用户 | ⚠️ 若项目启用 typeorm cache，需核对 redis client 版本 |
| Node.js 20+ 硬要求 | 所有用户 | ✅ 已满足 |
| `Buffer` → `Uint8Array`（非 Node 平台） | 浏览器 / Deno / Bun | ✅ Node 平台不受影响 |

## 4. 升级策略：四阶段

### Phase 1：预演与代码扫描（预计 1 周）

- [ ] 在 `staging` 分支执行 `npx @typeorm/codemod v1 src/ --dry`，扫描代码层面影响（即使 0 匹配也要保留 audit trail）
- [ ] 重点审计 `server/database/typeorm-adapter.ts`、`server/database/index.ts`、`server/utils/admin-role-sync.ts` 三个文件
- [ ] `grep -rn "loadedTables\|loadedViews" server/ lib/` 确认无同步访问
- [ ] `grep -rn "useContainer\|InjectRepository\|InjectManager" server/ lib/` 确认无 IoC 残留
- [ ] 对 3.1 节高风险变更，编写最小复现 test case（Vitest 单测，注入 undefined 参数）

### Phase 2：依赖升级与基础验证（预计 1 周）

- [ ] 单 PR 升级 `package.json` typeorm 到 `^1.1.0`
- [ ] `pnpm install --no-frozen-lockfile` 让 lockfile 自然重写
- [ ] `pnpm run lint && pnpm run typecheck && pnpm run build` 三关必须通过
- [ ] 修复 lint / typecheck 暴露的所有调用点
- [ ] 不跑端到端，先保证编译通过

### Phase 3：运行时验证（预计 1–2 周）

- [ ] **staging 环境**完整跑以下路径，每路径必须有至少 1 条 E2E 测试覆盖：
  - 邮箱 + 密码注册
  - 邮箱 + 密码登录
  - OAuth 授权回调（GitHub / Google 任一）
  - SSO 登录（如已启用）
  - session 续期与登出
  - 二次验证（如启用）
  - 第三方登录（手机号验证码）
  - OAuth 客户端管理（CRUD）
  - SSO Provider 管理（CRUD）
  - 用户管理（admin role sync）
- [ ] 监控日志中 `TypeORMError: ... where: { ...: undefined }` 异常率（如果出现，说明有 better-auth 内部调用未做参数校验）
- [ ] 若 `invalidWhereValuesBehavior` 触发异常，**可选**通过 DataSource 配置恢复旧行为作为过渡：
  ```typescript
  new DataSource({
    // ...
    invalidWhereValuesBehavior: { null: 'ignore', undefined: 'ignore' },
  })
  ```
  （仅作为热修复手段，长期应迁移到 `IsNull()`）

### Phase 4：合并与发布（预计 1 天）

- [ ] 单独 release PR，单 commit `chore(deps)!: bump typeorm from 0.3.31 to 1.1.0`
- [ ] PR body 必须包含：
  - 本文档链接
  - Phase 1–3 验证矩阵全部 ✅ 勾选
  - 已知风险点（3.1 节）与缓解措施
- [ ] 合并到 master 后观察下一个 release schedule（每周六 UTC+0 12:00）
- [ ] 下一个 release 必须在 staging 完整重跑端到端

## 5. 验证矩阵（必须 100% 通过）

| # | 测试项 | 工具 | 状态 |
|---|---|---|---|
| 1 | `pnpm run lint` | ESLint | ☐ |
| 2 | `pnpm run typecheck` | `tsc --noEmit` | ☐ |
| 3 | `pnpm run test` | Vitest | ☐ |
| 4 | `pnpm run build` | Nuxt build | ☐ |
| 5 | 邮箱密码注册 → 登录 → session 创建 | E2E | ☐ |
| 6 | OAuth 授权回调 | E2E | ☐ |
| 7 | SSO Provider CRUD + 登录流程 | E2E | ☐ |
| 8 | 手机号验证码登录 | E2E | ☐ |
| 9 | 二次验证（如启用） | E2E | ☐ |
| 10 | admin role sync | E2E | ☐ |
| 11 | 数据库无孤儿外键校验 | SQL | ☐ |
| 12 | `invalidWhereValuesBehavior` 触发监控 | 日志 | ☐ |

## 6. 回滚方案

由于本升级在 staging 分支执行，回滚成本极低：

1. **未合并到 master**：直接 revert commit，删除 staging 分支
2. **已合并到 master 但未发布**：`git revert <merge-commit>` 单次提交即可
3. **已发布（已 release）**：
   - 紧急：master revert + patch release（`typeorm@0.3.31` 仍兼容）
   - 长期：保留双线能力（在 1.x 不可用时回滚到 0.3.31）
   - **依赖**：0.3.x 上游仍维护，1.0 是 break 但不是删除上游分支，回滚路径稳定

## 7. 预估工作量

| 阶段 | 预估时间 | 主要风险 |
|---|---|---|
| Phase 1（预演扫描） | 1 周 | codemod 工具可能有未覆盖的代码路径，需人工 review |
| Phase 2（依赖升级） | 1 周 | lint / typecheck 可能暴露 transitive 类型问题 |
| Phase 3（运行时验证） | 1–2 周 | better-auth 内部 typeorm 调用需要逐路径测试 |
| Phase 4（合并发布） | 1 天 | 无额外风险 |
| **合计** | **3–4 周** | 不属于紧急修复，可排在正常迭代中 |

## 8. 与现有依赖治理的关系

- `.github/dependabot.yml` 已添加 `typeorm >=1.0.0` ignore（参考现有 `primevue >=5.0.0` 写法），防止 dependabot 再次自动开 PR
- ignore 段同样作用于 **安全更新**：1.x 线专属安全修复不会自动出 PR，由 Dependabot alerts + `security-alert-remediator` skill 兜底
- 升级完成后，需要：
  1. 删除 `typeorm >=1.0.0` ignore 段
  2. 重新评估 `primevue` 段的依赖治理策略是否仍合理

## 9. 参考资料

- 官方升级指南：<https://typeorm.io/docs/releases/1.0/upgrading-from-0.3/>
- 官方 1.0 发布说明：<https://typeorm.io/docs/releases/1.0/release-notes>
- 官方 codemod 仓库：<https://github.com/typeorm/typeorm/tree/master/packages/codemod>
- 项目 PR 历史：[#564](https://github.com/CaoMeiYouRen/caomei-auth/pull/564) — 已关闭
- dependabot 配置：`.github/dependabot.yml`
- 项目 ORM 适配层：`server/database/typeorm-adapter.ts`

## 10. 变更记录

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-08-30 | 初始登记；dependabot #564 已关闭，ignore 已配置 | full-stack-master |