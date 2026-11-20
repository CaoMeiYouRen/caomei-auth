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
