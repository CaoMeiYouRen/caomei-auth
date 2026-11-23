# 数据库关系优化说明

## 概述

本文档描述了对 `server/entities` 下实体类的外键关系优化。根据 TypeORM 最佳实践，我们为所有实体添加了适当的关系装饰器，以提供更好的类型安全性和查询能力。

## 关系图

```
User (用户)
├── OneToOne → TwoFactor (两因素认证)
├── OneToMany → Account (第三方账户)
├── OneToMany → Session (会话)
├── OneToMany → OAuthApplication (OAuth应用)
├── OneToMany → OAuthAccessToken (OAuth访问令牌)
└── OneToMany → OAuthConsent (OAuth授权同意)

OAuthApplication (OAuth应用)
├── ManyToOne → User (拥有者)
├── OneToMany → OAuthAccessToken (访问令牌)
└── OneToMany → OAuthConsent (授权同意)
```

## 详细关系说明

### 1. User ↔ TwoFactor (一对一)
- **关系**: 用户可以有一个两因素认证配置
- **外键**: `TwoFactor.userId` → `User.id`
- **级联**: `CASCADE` - 删除用户时同时删除两因素认证配置
- **装饰器**: `@OneToOne`, `@JoinColumn`

### 2. User ↔ Account (一对多)
- **关系**: 用户可以有多个第三方账户（如 Google, GitHub 等）
- **外键**: `Account.userId` → `User.id`
- **级联**: `CASCADE` - 删除用户时同时删除所有关联账户
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 3. User ↔ Session (一对多)
- **关系**: 用户可以有多个会话
- **外键**: `Session.userId` → `User.id`
- **额外关系**: `Session.impersonatedBy` → `User.id` (模拟会话的管理员)
- **级联**: `CASCADE` - 删除用户时同时删除所有会话
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 4. User ↔ OAuthApplication (一对多)
- **关系**: 用户可以创建多个 OAuth 应用
- **外键**: `OAuthApplication.userId` → `User.id`
- **级联**: `CASCADE` - 删除用户时同时删除所有 OAuth 应用
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 5. User ↔ OAuthAccessToken (一对多)
- **关系**: 用户可以有多个 OAuth 访问令牌
- **外键**: `OAuthAccessToken.userId` → `User.id`
- **级联**: `CASCADE` - 删除用户时同时删除所有访问令牌
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 6. User ↔ OAuthConsent (一对多)
- **关系**: 用户可以有多个 OAuth 授权同意记录
- **外键**: `OAuthConsent.userId` → `User.id`
- **级联**: `CASCADE` - 删除用户时同时删除所有授权记录
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 7. OAuthApplication ↔ OAuthAccessToken (一对多)
- **关系**: OAuth 应用可以有多个访问令牌
- **外键**: `OAuthAccessToken.clientId` → `OAuthApplication.id`
- **级联**: `CASCADE` - 删除应用时同时删除所有访问令牌
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

### 8. OAuthApplication ↔ OAuthConsent (一对多)
- **关系**: OAuth 应用可以有多个授权同意记录
- **外键**: `OAuthConsent.clientId` → `OAuthApplication.id`
- **级联**: `CASCADE` - 删除应用时同时删除所有授权记录
- **装饰器**: `@OneToMany`, `@ManyToOne`, `@JoinColumn`

## 优化特性

### 1. 级联操作 (Cascade)
- 所有关系都配置了适当的级联操作
- 主要使用 `CASCADE` 来确保数据一致性
- 对于可选关系使用 `SET NULL`

### 2. 外键约束
- 所有外键关系都使用 `@JoinColumn` 明确指定
- 支持数据库级别的外键约束

### 3. 类型安全
- 通过 TypeScript 类型系统提供编译时类型检查
- 支持关系导航，如 `user.accounts`, `account.user`

### 4. 查询优化
- 支持 TypeORM 的关系查询
- 可以使用 `eager` 加载或 `lazy` 加载
- 支持 QueryBuilder 的 join 操作

## 使用示例

### 查询用户及其账户
```typescript
const userWithAccounts = await userRepository.findOne({
  where: { id: userId },
  relations: ['accounts']
});
```

### 查询用户及其所有相关数据
```typescript
const userWithAllRelations = await userRepository.findOne({
  where: { id: userId },
  relations: [
    'accounts',
    'sessions', 
    'twoFactor',
    'oauthApplications',
    'oauthAccessTokens',
    'oauthConsents'
  ]
});
```

### 使用 QueryBuilder 进行复杂查询
```typescript
const usersWithTokens = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.oauthAccessTokens', 'token')
  .leftJoinAndSelect('token.client', 'client')
  .where('client.name = :clientName', { clientName: 'MyApp' })
  .getMany();
```

## 索引优化

### Verification 表
- 添加了复合索引 `['identifier', 'value']` 以提高验证码查询性能

## 迁移注意事项

1. 这些更改主要是在 TypeScript/TypeORM 层面，不会改变现有的数据库结构
2. 外键字段名保持不变，确保与现有数据兼容
3. 建议在生产环境部署前进行充分测试

## 性能考虑

1. **懒加载**: 默认情况下关系是懒加载的，只有在访问时才会查询
2. **预加载**: 可以通过 `eager: true` 或 `relations` 选项来预加载关系
3. **查询优化**: 使用 QueryBuilder 可以更精确控制查询和 JOIN 操作
4. **索引**: 所有外键字段都已添加索引以提高查询性能

## 最佳实践

1. 总是使用 `relations` 选项或 QueryBuilder 来明确指定需要加载的关系
2. 避免在循环中进行关系查询，使用预加载或批量查询
3. 对于大量数据，考虑使用分页和选择性加载
4. 定期监控查询性能，必要时添加额外索引

## 阶段 9：联系方式改绑与强制重置字段

### `user.must_reset_password`

- 类型：`BOOLEAN NOT NULL DEFAULT 0`。
- 含义：为 `true` 时拒绝创建任何新会话（密码 / 邮箱 OTP / 手机 OTP / 社交 / SSO），直到用户完成密码重置。
- 由「改绑确认」置为 `true`，由 `emailAndPassword.onPasswordReset` 清除；管理端不提供直接清除入口（运维脚本除外）。

### `channel_change_request`

| 列 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `VARCHAR(36) PK` | 雪花 ID，同时作为确认页的不透明请求 ID |
| `user_id` | `VARCHAR(36)` | 被改绑用户 |
| `channel` | `VARCHAR(16)` | `email` / `phone` |
| `new_value` | `VARCHAR(255)` | 规范化后的目标值 |
| `code_hash` | `VARCHAR(64)` | `sha256(requestId:code)`，禁止落盘明文 |
| `status` | `VARCHAR(16)` | `pending` / `confirmed` / `cancelled` / `expired` |
| `attempts` | `INTEGER` | 验证码错误次数，达到 3 次作废 |
| `requested_by` | `VARCHAR(36)` | 发起管理员（用户自助改绑为空） |
| `reason` | `TEXT` | 管理员填写的原因 |
| `expires_at` | `DATETIME` | 创建后 10 分钟 |
| `confirmed_at` | `DATETIME` | 确认时间 |

索引：`(user_id, channel, status)`，用于「同一用户同一通道只保留一条 pending」。

生产环境（`synchronize=false`）需要先执行：

```sql
ALTER TABLE caomei_auth_user ADD COLUMN must_reset_password BOOLEAN NOT NULL DEFAULT 0;
```

并创建 `caomei_auth_channel_change_request` 表（列名遵循 snake_case 命名策略，SQLite 建表语句见 `database/sqlite/create.sql`）。MySQL / PostgreSQL 按同一列定义创建，`attempts` 用 `INT`，`expires_at` / `confirmed_at` 用 `DATETIME` / `TIMESTAMP`。

## 阶段 13：登录事件 IP 列与索引

- **列定义**：`login_event.ip` 由 `TEXT` 改为 `VARCHAR(45)`（覆盖 IPv6 文本上限）。MySQL 无法对 `TEXT` 建全列索引，改定长类型后 IP 精确筛选才可走索引。
- **索引**：`IDX_login_event_ip_created_at`（`ip, created_at`），让 IP 精确筛选先按 `ip` 定位子集，避免大时间窗全表扫描；索引不含 `id`，InnoDB / PostgreSQL 下最多减少排序量、不保证完全免排序，SQLite 的 `created_at DESC, id DESC` 仍可能残留临时排序。不引入隐式时间窗。
- **新装库**：直接使用 `database/{sqlite,mysql,postgres}/create.sql`。注意 MySQL / PostgreSQL 的脚本以 `DROP TABLE IF EXISTS` 开头，**只能对空库执行**，对已有库执行会清空登录事件。
- **升级库**（`synchronize=false`）：先改列类型、后建索引；两步之间失败须手工执行回滚语句恢复（MySQL 的 DDL 隐式提交，没有可用的自动回滚）。
- **执行窗口**：MySQL 的 `TEXT → VARCHAR(45)` 走 COPY 重建、PostgreSQL 的非并发 `CREATE INDEX` 持 SHARE 锁，期间登录事件写入会阻塞并可能被 `LOGIN_EVENT_WRITE_TIMEOUT_MS` 丢事件，建议在低峰执行；PostgreSQL 大表可用下方 `CONCURRENTLY` 变体（不能包在事务里，失败会留下 INVALID 索引，需先 `DROP INDEX` 再重试）。
- **升级前预检**：`ip` 列现有值若超过 45 字符，MySQL / PostgreSQL 的 ALTER 会失败或被截断，先执行
  `SELECT COUNT(*) FROM caomei_auth_login_event WHERE CHAR_LENGTH(ip) > 45;`（PostgreSQL 用 `length(ip)`）。
- **写入侧长度契约**：当前写入路径不对 `ip` 做 `net.isIP` 校验与长度归一化，超长 / 非法头值在 MySQL / PostgreSQL 下会整行拒绝、SQLite 下照存，该缺口已登记 [backlog §3.3](../plan/backlog.md#33-基础设施)。

### 升级语句

SQLite（动态类型，列类型无需重建，只补索引）：

```sql
CREATE INDEX IF NOT EXISTS IDX_login_event_ip_created_at ON caomei_auth_login_event (ip, created_at);
```

MySQL：

```sql
ALTER TABLE caomei_auth_login_event MODIFY COLUMN ip VARCHAR(45) NULL;
CREATE INDEX IDX_login_event_ip_created_at ON caomei_auth_login_event (ip, created_at);
```

PostgreSQL（二选一：小表用普通 `CREATE INDEX`；大表用并发变体，避免阻塞写入，但**不能包在事务里**，失败会留下 INVALID 索引，需先 `DROP INDEX` 再重试）：

```sql
ALTER TABLE public.caomei_auth_login_event ALTER COLUMN ip TYPE varchar(45);
CREATE INDEX "IDX_login_event_ip_created_at" ON public.caomei_auth_login_event USING btree (ip, created_at);
```

```sql
ALTER TABLE public.caomei_auth_login_event ALTER COLUMN ip TYPE varchar(45);
CREATE INDEX CONCURRENTLY "IDX_login_event_ip_created_at" ON public.caomei_auth_login_event USING btree (ip, created_at);
```

### 回滚语句

顺序与升级相反：先删索引再回退列类型（MySQL 在 `TEXT` 列上无法保留该复合索引）。以下语句需人工执行；`ip` 列回退成 `TEXT` 不会丢失数据，前提是升级前已完成长度预检。

```sql
-- SQLite
DROP INDEX IF EXISTS IDX_login_event_ip_created_at;

-- MySQL
DROP INDEX IDX_login_event_ip_created_at ON caomei_auth_login_event;
ALTER TABLE caomei_auth_login_event MODIFY COLUMN ip TEXT NULL;

-- PostgreSQL
DROP INDEX IF EXISTS "IDX_login_event_ip_created_at";
ALTER TABLE public.caomei_auth_login_event ALTER COLUMN ip TYPE text;
```

回退列类型不改变已有数据：`VARCHAR(45)` 与 `TEXT` 之间双向转换对合法 IP 均无损。

## 跨方言注意事项

-   **实体与 DDL 同步**：新增 / 修改实体必须同批更新 `server/database/index.ts` 的 entities 与 `database/{sqlite,mysql,postgres}/create.sql`；视觉与集成夹具直接用 `create.sql` 建表，漏列会让登录链在运行时 500。
-   **聚合返回类型**：`DATE()` 在 SQLite 返回字符串、MySQL / PostgreSQL 返回 `Date`；按本地分量统一格式化，并提供可注入的 `now` 避免测试时间炸弹。
-   **布尔谓词**：PostgreSQL 的 `bool` 列不能与整数比较（`two_factor_enabled = 1` 报 42883），须按方言生成 `IS TRUE`；SQLite / MySQL 保持 `= 1`。
-   **多方言 SQL 验证**：按方言断言生成的 SQL 契约（占位符 `?` / `$n`、谓词形态），不要用单一方的本地实例结果代表三方言。
