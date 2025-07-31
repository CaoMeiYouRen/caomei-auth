# API 文档

草梅 Auth 提供了完整的 RESTful API，支持用户认证、OAuth2.0、用户管理等功能。本文档介绍自定义的 API 接口，不包括 Better-Auth 框架自带的接口。

## 基础信息

- **基础 URL**: `https://your-domain.com/api`
- **认证方式**: Bearer Token / Session Cookie
- **响应格式**: JSON
- **字符编码**: UTF-8

## API 概览

### [认证 API](./authentication)
用户登录、注册、验证码等认证相关接口。

### [OAuth API](./oauth)
OAuth2.0 授权服务器相关接口，支持第三方应用集成。

### [用户管理 API](./users)
用户信息管理、资料修改、安全设置等接口。

### [管理员 API](./admin)
系统管理、用户管理、统计分析等管理员专用接口。

### [文件上传 API](./file)
头像上传、文件管理等文件处理接口。

## 通用规范

### 请求头

```http
Content-Type: application/json
Authorization: Bearer <your-token>
User-Agent: YourApp/1.0
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误",
    "details": {}
  }
}
```

### 状态码

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权 |
| 403 | Forbidden | 禁止访问 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器内部错误 |

## 认证机制

### Bearer Token

```http
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Session Cookie

```http
GET /api/user/profile
Cookie: session=abcdef123456; Path=/; HttpOnly; Secure
```

## 限流规则

### 全局限流

- **通用 API**: 每分钟 100 次请求
- **认证 API**: 每分钟 20 次请求
- **文件上传**: 每分钟 10 次请求

### 特殊限流

- **验证码发送**: 每个邮箱/手机号每分钟 1 次
- **密码重置**: 每个账户每小时 3 次
- **登录尝试**: 每个 IP 每分钟 10 次

## 错误代码

### 认证错误

| 错误代码 | 说明 |
|----------|------|
| `INVALID_CREDENTIALS` | 用户名或密码错误 |
| `EMAIL_NOT_VERIFIED` | 邮箱未验证 |
| `ACCOUNT_LOCKED` | 账户被锁定 |
| `TOKEN_EXPIRED` | 令牌已过期 |
| `INVALID_TOKEN` | 令牌无效 |

### 验证错误

| 错误代码 | 说明 |
|----------|------|
| `INVALID_EMAIL` | 邮箱格式错误 |
| `INVALID_PHONE` | 手机号格式错误 |
| `PASSWORD_TOO_WEAK` | 密码强度不足 |
| `CODE_EXPIRED` | 验证码已过期 |
| `CODE_INVALID` | 验证码错误 |

### 业务错误

| 错误代码 | 说明 |
|----------|------|
| `USER_NOT_FOUND` | 用户不存在 |
| `EMAIL_ALREADY_EXISTS` | 邮箱已存在 |
| `PHONE_ALREADY_EXISTS` | 手机号已存在 |
| `INSUFFICIENT_PERMISSIONS` | 权限不足 |
| `RESOURCE_NOT_FOUND` | 资源不存在 |

## 分页和排序

### 分页参数

```http
GET /api/admin/users?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

参数说明：
- `page`: 页码，从 1 开始
- `limit`: 每页数量，最大 100
- `sortBy`: 排序字段
- `sortOrder`: 排序方向 (`asc` 或 `desc`)

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 过滤和搜索

### 过滤参数

```http
GET /api/admin/users?filter[status]=active&filter[role]=user
```

### 搜索参数

```http
GET /api/admin/users?search=john&searchFields[]=name&searchFields[]=email
```

## Webhook

### 事件类型

- `user.created` - 用户注册
- `user.updated` - 用户信息更新
- `user.deleted` - 用户删除
- `auth.login` - 用户登录
- `auth.logout` - 用户登出
- `oauth.authorized` - OAuth 授权

### Webhook 格式

```json
{
  "id": "webhook_123456",
  "event": "user.created",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## SDK 和客户端

### JavaScript SDK

```javascript
import { CaomeiAuth } from '@caomei/auth-sdk'

const auth = new CaomeiAuth({
  baseURL: 'https://your-domain.com/api',
  clientId: 'your-client-id'
})

// 用户登录
const { user, token } = await auth.signIn({
  email: 'user@example.com',
  password: 'password'
})
```

### Python SDK

```python
from caomei_auth import CaomeiAuth

auth = CaomeiAuth(
    base_url='https://your-domain.com/api',
    client_id='your-client-id'
)

# 用户登录
user = auth.sign_in(
    email='user@example.com',
    password='password'
)
```

## 开发工具

### API 调试

推荐使用以下工具进行 API 调试：

- **Postman**: 图形化 API 测试工具
- **curl**: 命令行 API 测试
- **HTTPie**: 现代化命令行 HTTP 客户端

### 示例请求

```bash
# 使用 curl 测试登录 API
curl -X POST https://your-domain.com/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# 使用 HTTPie 测试
http POST https://your-domain.com/api/auth/sign-in \
  email=user@example.com \
  password=password
```

## 版本控制

### API 版本

当前 API 版本：`v1`

版本化 URL 格式：`/api/v1/...`

### 版本兼容性

- **向后兼容**: 新版本保持对旧版本的兼容
- **废弃通知**: 废弃的 API 会提前 6 个月通知
- **迁移指南**: 提供详细的版本迁移指南

## 最佳实践

### 客户端开发

1. **错误处理**: 优雅处理各种错误情况
2. **重试机制**: 对临时失败进行重试
3. **缓存策略**: 合理缓存 API 响应
4. **安全存储**: 安全存储认证令牌

### 性能优化

1. **批量请求**: 使用批量 API 减少请求次数
2. **条件请求**: 使用 ETag 和 Last-Modified
3. **压缩传输**: 启用 gzip 压缩
4. **连接复用**: 使用 HTTP 连接池

## 常见问题

### Q: 如何处理 401 错误？

A: 401 错误表示认证失败，需要重新登录获取新的令牌。

### Q: API 调用频率限制是多少？

A: 不同类型的 API 有不同的限制，详见 [限流规则](#限流规则) 部分。

### Q: 如何获取 API 密钥？

A: 在管理后台的应用设置中可以生成和管理 API 密钥。

### Q: 是否支持 GraphQL？

A: 当前版本只支持 REST API，GraphQL 支持在计划中。

## 更新日志

### v1.2.0 (2024-01-01)
- 新增文件上传 API
- 优化错误响应格式
- 增加 Webhook 支持

### v1.1.0 (2023-12-01)
- 新增 OAuth2.0 API
- 增加管理员 API
- 优化分页和搜索

### v1.0.0 (2023-11-01)
- 初始版本发布
- 基础认证 API
- 用户管理 API

## 技术支持

如果在使用 API 时遇到问题：

1. 查看相应的 API 文档
2. 检查错误代码和响应
3. 查看 [故障排除指南](/docs/usage/troubleshooting)
4. 在 GitHub 提交 Issue
