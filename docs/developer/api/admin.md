# 管理员 API

草梅 Auth 提供了完整的管理员 API，用于管理用户、查看统计信息、管理 OAuth 应用等。所有管理员 API 都需要管理员权限。

## 基础信息

-   **API 基础地址**: `https://auth.example.com/api`
-   **认证方式**: Bearer Token
-   **权限要求**: 管理员权限
-   **数据格式**: JSON
-   **字符编码**: UTF-8

## 权限验证

所有管理员 API 调用都需要在请求头中包含有效的访问令牌：

```http
Authorization: Bearer <access_token>
```

## 用户管理 API

### 获取用户列表

#### POST /auth/admin/list-users

获取系统中所有用户的列表，支持分页、搜索和筛选。

**请求体:**

```json
{
    "query": {
        "limit": 20,
        "offset": 0,
        "searchField": "email",
        "searchOperator": "contains",
        "searchValue": "user@example.com",
        "filterField": "role",
        "filterOperator": "eq",
        "filterValue": "admin"
    }
}
```

**响应示例:**

```json
{
    "data": {
        "users": [
            {
                "id": "123456789",
                "name": "用户名",
                "email": "user@example.com",
                "username": "username",
                "phoneNumber": "+86 13800138000",
                "phoneNumberVerified": true,
                "emailVerified": true,
                "image": "https://example.com/avatar.jpg",
                "role": "user",
                "banned": false,
                "banReason": null,
                "banExpires": null,
                "twoFactorEnabled": false,
                "isAnonymous": false,
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        ],
        "total": 100
    }
}
```

### 创建用户

#### POST /auth/admin/create-user

创建新的用户账户。

**请求体:**

```json
{
    "email": "newuser@example.com",
    "password": "securePassword123",
    "name": "新用户",
    "username": "newuser",
    "role": "user",
    "emailVerified": true
}
```

**响应示例:**

```json
{
    "data": {
        "user": {
            "id": "987654321",
            "email": "newuser@example.com",
            "name": "新用户",
            "username": "newuser",
            "role": "user",
            "emailVerified": true,
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 删除用户

#### POST /auth/admin/remove-user

删除指定用户账户。

**请求体:**

```json
{
    "userId": "123456789"
}
```

**响应示例:**

```json
{
    "data": {
        "success": true,
        "message": "用户已成功删除"
    }
}
```

### 禁用用户

#### POST /auth/admin/ban-user

禁用指定用户账户。

**请求体:**

```json
{
    "userId": "123456789",
    "banReason": "违规行为",
    "banExpires": "2024-12-31T23:59:59Z"
}
```

**响应示例:**

```json
{
    "data": {
        "success": true,
        "message": "用户已被禁用"
    }
}
```

### 解禁用户

#### POST /auth/admin/unban-user

解除用户账户的禁用状态。

**请求体:**

```json
{
    "userId": "123456789"
}
```

**响应示例:**

```json
{
    "data": {
        "success": true,
        "message": "用户已解除禁用"
    }
}
```

## 会话管理 API

### 获取用户会话

#### POST /auth/admin/list-user-sessions

获取指定用户的所有活跃会话。

**请求体:**

```json
{
    "userId": "123456789"
}
```

**响应示例:**

```json
{
    "data": {
        "sessions": [
            {
                "id": "session_123",
                "userId": "123456789",
                "token": "***",
                "ipAddress": "192.168.1.100",
                "userAgent": "Mozilla/5.0...",
                "expiresAt": "2024-02-01T00:00:00Z",
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 撤销用户会话

#### POST /auth/admin/revoke-user-session

撤销指定用户的单个会话。

**请求体:**

```json
{
    "sessionId": "session_123"
}
```

### 撤销用户所有会话

#### POST /auth/admin/revoke-user-sessions

撤销指定用户的所有会话。

**请求体:**

```json
{
    "userId": "123456789"
}
```

## 统计和日志 API

### 获取登录统计

#### GET /api/admin/logs/stats

获取登录统计信息，包括活跃用户数、登录次数等。

**查询参数:**

-   `period`: 统计周期，可选值：`day`、`week`、`month`、`year`
-   `startDate`: 开始日期 (ISO 8601 格式)
-   `endDate`: 结束日期 (ISO 8601 格式)

**示例请求:**

```http
GET /api/admin/logs/stats?period=week&startDate=2024-01-01T00:00:00Z&endDate=2024-01-07T23:59:59Z
```

**响应示例:**

```json
{
    "data": {
        "totalUsers": 1000,
        "activeUsers": 250,
        "totalLogins": 1500,
        "successfulLogins": 1450,
        "failedLogins": 50,
        "loginsByDay": [
            { "date": "2024-01-01", "count": 200 },
            { "date": "2024-01-02", "count": 180 },
            { "date": "2024-01-03", "count": 220 }
        ],
        "topCountries": [
            { "country": "CN", "count": 800 },
            { "country": "US", "count": 200 },
            { "country": "JP", "count": 100 }
        ],
        "deviceTypes": {
            "desktop": 60,
            "mobile": 35,
            "tablet": 5
        }
    }
}
```

### 获取会话日志

#### GET /api/admin/logs/sessions

获取详细的会话日志，支持分页和筛选。

**查询参数:**

-   `page`: 页码，默认为 1
-   `limit`: 每页条数，默认为 20
-   `userId`: 用户 ID 筛选
-   `startDate`: 开始日期
-   `endDate`: 结束日期
-   `status`: 会话状态，可选值：`active`、`expired`、`all`
-   `search`: 搜索关键词（用户名、邮箱、IP 地址）

**示例请求:**

```http
GET /api/admin/logs/sessions?page=1&limit=20&status=active&search=192.168
```

**响应示例:**

```json
{
    "data": {
        "sessions": [
            {
                "id": "session_123",
                "user": {
                    "id": "123456789",
                    "name": "用户名",
                    "email": "user@example.com"
                },
                "ipAddress": "192.168.1.100",
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "browser": "Chrome",
                "os": "Windows",
                "device": "Desktop",
                "country": "中国",
                "city": "北京",
                "status": "active",
                "lastActiveAt": "2024-01-01T12:00:00Z",
                "expiresAt": "2024-02-01T00:00:00Z",
                "createdAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 500,
            "pages": 25
        }
    }
}
```

## OAuth 应用管理 API

### 获取应用列表

#### GET /api/oauth/applications

获取所有已注册的 OAuth 应用。

**查询参数:**

-   `page`: 页码，默认为 1
-   `limit`: 每页条数，默认为 20

**响应示例:**

```json
{
    "data": {
        "applications": [
            {
                "id": "app_123",
                "clientId": "client_123",
                "name": "我的应用",
                "description": "应用描述",
                "redirectUris": ["https://myapp.com/callback"],
                "scopes": ["openid", "profile", "email"],
                "disabled": false,
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 10,
            "pages": 1
        }
    }
}
```

### 创建 OAuth 应用

#### POST /api/oauth/applications

创建新的 OAuth 应用。

**请求体:**

```json
{
    "name": "新应用",
    "description": "应用描述",
    "redirectUris": ["https://newapp.com/callback"],
    "scopes": ["openid", "profile", "email"]
}
```

**响应示例:**

```json
{
    "data": {
        "application": {
            "id": "app_456",
            "clientId": "client_456",
            "clientSecret": "secret_456",
            "name": "新应用",
            "description": "应用描述",
            "redirectUris": ["https://newapp.com/callback"],
            "scopes": ["openid", "profile", "email"],
            "disabled": false,
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

### 更新 OAuth 应用

#### PUT /api/oauth/applications/`{id}`

更新指定的 OAuth 应用。

**请求体:**

```json
{
    "name": "更新后的应用名",
    "description": "更新后的描述",
    "redirectUris": ["https://updatedapp.com/callback"],
    "scopes": ["openid", "profile", "email", "offline_access"]
}
```

### 删除 OAuth 应用

#### DELETE /api/oauth/applications/`{id}`

删除指定的 OAuth 应用。

**响应示例:**

```json
{
    "data": {
        "success": true,
        "message": "应用已成功删除"
    }
}
```

## 系统管理 API

### 同步管理员角色

#### POST /api/admin/sync-admin-role

将指定用户设置为管理员角色，或移除管理员角色。

**请求体:**

```json
{
    "userId": "123456789",
    "isAdmin": true
}
```

**响应示例:**

```json
{
    "data": {
        "success": true,
        "message": "管理员角色已同步",
        "user": {
            "id": "123456789",
            "email": "admin@example.com",
            "role": "admin"
        }
    }
}
```

## 错误处理

所有管理员 API 都遵循统一的错误响应格式：

```json
{
    "error": {
        "code": "PERMISSION_DENIED",
        "message": "您没有权限执行此操作",
        "details": {
            "requiredRole": "admin",
            "userRole": "user"
        }
    }
}
```

### 常见错误代码

-   `UNAUTHORIZED`: 未认证或令牌无效
-   `PERMISSION_DENIED`: 权限不足
-   `USER_NOT_FOUND`: 用户不存在
-   `INVALID_INPUT`: 输入参数无效
-   `OPERATION_FAILED`: 操作失败

## 安全注意事项

1. **权限验证**: 每个 API 调用都会验证用户的管理员权限
2. **操作日志**: 所有管理员操作都会被记录到审计日志中
3. **敏感信息**: 响应中不包含密码等敏感信息
4. **限流**: 管理员 API 有独立的限流设置

## 使用示例

### JavaScript SDK

```javascript
import { authClient } from "@/lib/auth-client";

// 获取用户列表
const users = await authClient.admin.listUsers({
    query: {
        limit: 10,
        searchField: "email",
        searchValue: "@example.com",
    },
});

// 禁用用户
await authClient.admin.banUser({
    userId: "user123",
    banReason: "违规行为",
});

// 获取统计信息
const stats = await authClient.admin.getStats({
    period: "week",
});
```

### cURL 示例

```bash
# 获取用户列表
curl -X POST https://auth.example.com/api/auth/admin/list-users \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"query": {"limit": 10}}'

# 创建OAuth应用
curl -X POST https://auth.example.com/api/oauth/applications \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新应用",
    "redirectUris": ["https://myapp.com/callback"],
    "scopes": ["openid", "profile", "email"]
  }'
```

通过这些管理员 API，您可以完全控制草梅 Auth 系统的用户、应用和设置。如需更多帮助，请查看 [最佳实践](./best-practices.md) 或 [故障排除指南](./troubleshooting.md)。
