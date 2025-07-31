# 用户管理 API

草梅 Auth 提供完整的用户管理 API，支持用户信息查询、更新、权限管理等功能。

## 基础信息

- **API 基础地址**: `https://auth.example.com/api`
- **认证方式**: Bearer Token
- **权限要求**: 管理员权限
- **数据格式**: JSON
- **字符编码**: UTF-8

## 端点概览

| 端点 | 方法 | 描述 | 权限要求 |
|------|------|------|----------|
| `/auth/admin/list-users` | POST | 获取用户列表 | 管理员 |
| `/auth/admin/create-user` | POST | 创建用户 | 管理员 |
| `/auth/admin/remove-user` | POST | 删除用户 | 管理员 |
| `/auth/admin/ban-user` | POST | 禁用用户 | 管理员 |
| `/auth/admin/unban-user` | POST | 解禁用户 | 管理员 |
| `/auth/admin/list-user-sessions` | POST | 获取用户会话 | 管理员 |
| `/auth/admin/revoke-user-session` | POST | 撤销用户会话 | 管理员 |
| `/auth/admin/revoke-user-sessions` | POST | 撤销用户所有会话 | 管理员 |
| `/admin/sync-admin-role` | POST | 同步管理员角色 | 管理员 |

## 获取用户列表

### POST /auth/admin/list-users

获取系统中所有用户的列表，支持分页、搜索和筛选。

#### 请求参数

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

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `query.limit` | number | 否 | 每页返回的用户数量，默认 20 |
| `query.offset` | number | 否 | 跳过的用户数量，用于分页 |
| `query.searchField` | string | 否 | 搜索字段，支持 `email`、`name`、`username` |
| `query.searchOperator` | string | 否 | 搜索操作符，支持 `contains`、`eq` |
| `query.searchValue` | string | 否 | 搜索值 |
| `query.filterField` | string | 否 | 筛选字段，支持 `role`、`banned` |
| `query.filterOperator` | string | 否 | 筛选操作符，支持 `eq` |
| `query.filterValue` | any | 否 | 筛选值 |

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "users": [
      {
        "id": "123456",
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

## 创建用户

### POST /auth/admin/create-user

创建新的用户账户。

#### 请求参数

```json
{
  "name": "新用户",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 用户显示名称 |
| `email` | string | 是 | 用户邮箱地址 |
| `password` | string | 是 | 用户密码（6-64位） |
| `role` | string | 否 | 用户角色，默认 `user`，可选 `admin` |

#### 响应示例

**成功响应 (201 Created)**

```json
{
  "data": {
    "user": {
      "id": "123456",
      "name": "新用户",
      "email": "newuser@example.com",
      "role": "user",
      "banned": false,
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 删除用户

### POST /auth/admin/remove-user

删除指定的用户账户。此操作不可恢复。

#### 请求参数

```json
{
  "userId": "123456"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `userId` | string | 是 | 要删除的用户ID |

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "success": true
  }
}
```

## 禁用用户

### POST /auth/admin/ban-user

禁用指定的用户账户，禁用后用户无法登录。

#### 请求参数

```json
{
  "userId": "123456",
  "banReason": "违反用户协议",
  "banDuration": 86400
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `userId` | string | 是 | 要禁用的用户ID |
| `banReason` | string | 否 | 禁用原因 |
| `banDuration` | number | 否 | 禁用时长（秒），不传则永久禁用 |

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "success": true
  }
}
```

## 解禁用户

### POST /auth/admin/unban-user

解除用户的禁用状态。

#### 请求参数

```json
{
  "userId": "123456"
}
```

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "success": true
  }
}
```

## 获取用户会话

### POST /auth/admin/list-user-sessions

获取指定用户的所有活跃会话。

#### 请求参数

```json
{
  "userId": "123456"
}
```

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "sessions": [
      {
        "id": "session_123",
        "token": "session_token_xxx",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T00:00:00Z",
        "expiresAt": "2024-01-02T00:00:00Z",
        "active": true
      }
    ]
  }
}
```

## 撤销用户会话

### POST /auth/admin/revoke-user-session

撤销指定的用户会话。

#### 请求参数

```json
{
  "sessionToken": "session_token_xxx"
}
```

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "success": true
  }
}
```

## 撤销用户所有会话

### POST /auth/admin/revoke-user-sessions

撤销指定用户的所有会话，用户需要重新登录。

#### 请求参数

```json
{
  "userId": "123456"
}
```

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "data": {
    "success": true
  }
}
```

## 管理员角色同步

### POST /admin/sync-admin-role

同步用户的管理员角色，支持自动同步、手动添加或移除管理员权限。

#### 请求参数

```json
{
  "userId": "123456",
  "action": "sync"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `userId` | string | 是 | 用户ID |
| `action` | string | 是 | 操作类型：`sync`、`add`、`remove` |

#### 操作类型说明

- **sync**: 自动同步，根据环境变量 `ADMIN_USER_IDS` 配置自动添加管理员角色
- **add**: 手动添加管理员角色
- **remove**: 手动移除管理员角色（不能移除自己的权限）

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "success": true,
  "message": "管理员角色同步成功",
  "data": {
    "userId": "123456",
    "action": "sync"
  }
}
```

## 错误代码

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未登录或令牌无效 |
| 403 | Forbidden | 权限不足，需要管理员权限 |
| 404 | Not Found | 用户不存在 |
| 409 | Conflict | 用户已存在（邮箱冲突） |
| 500 | Internal Server Error | 服务器内部错误 |

## 安全注意事项

1. **权限验证**: 所有用户管理接口都需要管理员权限
2. **操作限制**: 管理员不能删除或禁用自己的账户
3. **敏感信息**: 用户密码等敏感信息不会在响应中返回
4. **审计日志**: 所有管理操作都会记录到系统日志

## 示例代码

### JavaScript

```javascript
// 获取用户列表
async function getUsers(query = {}) {
  const response = await fetch('https://auth.example.com/api/auth/admin/list-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    },
    body: JSON.stringify({ query }),
  });
  
  return await response.json();
}

// 创建用户
async function createUser(userData) {
  const response = await fetch('https://auth.example.com/api/auth/admin/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    },
    body: JSON.stringify(userData),
  });
  
  return await response.json();
}

// 禁用用户
async function banUser(userId, banReason) {
  const response = await fetch('https://auth.example.com/api/auth/admin/ban-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    },
    body: JSON.stringify({
      userId,
      banReason,
    }),
  });
  
  return await response.json();
}
```

### Python

```python
import requests

class AuthUserAPI:
    def __init__(self, base_url, access_token):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
    
    def get_users(self, query=None):
        url = f'{self.base_url}/api/auth/admin/list-users'
        data = {'query': query} if query else {}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
    
    def create_user(self, name, email, password, role='user'):
        url = f'{self.base_url}/api/auth/admin/create-user'
        data = {
            'name': name,
            'email': email,
            'password': password,
            'role': role
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
    
    def ban_user(self, user_id, ban_reason=None, ban_duration=None):
        url = f'{self.base_url}/api/auth/admin/ban-user'
        data = {'userId': user_id}
        if ban_reason:
            data['banReason'] = ban_reason
        if ban_duration:
            data['banDuration'] = ban_duration
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
```
