# 认证 API

草梅 Auth 提供完整的认证 API，支持用户注册、登录、令牌管理等功能。

## 基础信息

- **API 基础地址**: `https://auth.example.com/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 端点概览

| 端点 | 方法 | 描述 |
|------|------|------|
| `/auth/register` | POST | 用户注册 |
| `/auth/login` | POST | 用户登录 |
| `/auth/logout` | POST | 用户退出 |
| `/auth/refresh` | POST | 刷新令牌 |
| `/auth/verify-email` | POST | 验证邮箱 |
| `/auth/send-verification` | POST | 发送验证码 |
| `/auth/reset-password` | POST | 重置密码 |

## 用户注册

### POST /auth/register

注册新用户账户。

#### 请求参数

```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "phone": "+86 13800138000",
  "verification_code": "123456",
  "verification_type": "email"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `email` | string | 否* | 邮箱地址 |
| `phone` | string | 否* | 手机号码 |
| `username` | string | 否 | 用户名 |
| `password` | string | 是 | 密码（8-32位） |
| `verification_code` | string | 是 | 验证码 |
| `verification_type` | string | 是 | 验证类型：`email` 或 `sms` |

*注：`email` 和 `phone` 至少需要提供一个

#### 响应示例

**成功响应 (201 Created)**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "123456",
      "email": "user@example.com",
      "username": "username",
      "phone": "+86 13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "created_at": "2024-01-01T00:00:00Z",
      "email_verified": true,
      "phone_verified": false
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

**错误响应 (400 Bad Request)**

```json
{
  "success": false,
  "error": "validation_error",
  "message": "验证失败",
  "details": {
    "email": ["邮箱格式不正确"],
    "password": ["密码长度至少8位"],
    "verification_code": ["验证码无效或已过期"]
  }
}
```

## 用户登录

### POST /auth/login

用户登录认证。

#### 请求参数

```json
{
  "login": "user@example.com",
  "password": "password123",
  "login_type": "email",
  "remember_me": true,
  "verification_code": "123456"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `login` | string | 是 | 登录标识（邮箱、用户名或手机号） |
| `password` | string | 否* | 密码 |
| `login_type` | string | 是 | 登录类型：`email`、`username`、`phone` |
| `verification_code` | string | 否* | 验证码（用于无密码登录） |
| `remember_me` | boolean | 否 | 是否记住登录状态 |

*注：`password` 和 `verification_code` 至少需要提供一个

#### 响应示例

**成功响应 (200 OK)**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "123456",
      "email": "user@example.com",
      "username": "username",
      "phone": "+86 13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "last_login": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

## 刷新令牌

### POST /auth/refresh

使用刷新令牌获取新的访问令牌。

#### 请求参数

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

## 用户退出

### POST /auth/logout

退出当前登录会话。

#### 请求头

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 响应示例

```json
{
  "success": true,
  "message": "退出登录成功"
}
```

## 发送验证码

### POST /auth/send-verification

发送邮箱或短信验证码。

#### 请求参数

```json
{
  "target": "user@example.com",
  "type": "email",
  "purpose": "register"
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `target` | string | 是 | 目标邮箱或手机号 |
| `type` | string | 是 | 验证类型：`email` 或 `sms` |
| `purpose` | string | 是 | 用途：`register`、`login`、`reset_password` |

#### 响应示例

```json
{
  "success": true,
  "message": "验证码发送成功",
  "data": {
    "expires_in": 300,
    "can_resend_after": 60
  }
}
```

## 邮箱验证

### POST /auth/verify-email

验证用户邮箱。

#### 请求参数

```json
{
  "email": "user@example.com",
  "verification_code": "123456"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "邮箱验证成功"
}
```

## 重置密码

### POST /auth/reset-password

使用验证码重置密码。

#### 请求参数

```json
{
  "target": "user@example.com",
  "verification_code": "123456",
  "new_password": "newpassword123",
  "type": "email"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| `validation_error` | 400 | 请求参数验证失败 |
| `invalid_credentials` | 401 | 登录凭据无效 |
| `user_not_found` | 404 | 用户不存在 |
| `email_already_exists` | 409 | 邮箱已被注册 |
| `phone_already_exists` | 409 | 手机号已被注册 |
| `verification_code_invalid` | 400 | 验证码无效或已过期 |
| `too_many_requests` | 429 | 请求过于频繁 |
| `server_error` | 500 | 服务器内部错误 |

## 安全注意事项

1. **HTTPS**: 所有API请求必须使用HTTPS
2. **令牌安全**: 妥善保管访问令牌，不要在客户端代码中硬编码
3. **验证码**: 验证码有效期为5分钟，且只能使用一次
4. **频率限制**: API有频率限制，请避免过于频繁的请求
5. **密码强度**: 密码至少8位，建议包含大小写字母、数字和特殊字符

## 示例代码

### JavaScript

```javascript
// 用户注册
async function register(userData) {
  const response = await fetch('https://auth.example.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  return await response.json();
}

// 用户登录
async function login(credentials) {
  const response = await fetch('https://auth.example.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return await response.json();
}
```

### Python

```python
import requests

def register(user_data):
    url = 'https://auth.example.com/api/auth/register'
    response = requests.post(url, json=user_data)
    return response.json()

def login(credentials):
    url = 'https://auth.example.com/api/auth/login'
    response = requests.post(url, json=credentials)
    return response.json()
```
