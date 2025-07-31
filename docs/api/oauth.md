# OAuth 2.0 / OIDC API

草梅 Auth 提供标准的 OAuth 2.0 和 OpenID Connect (OIDC) API，支持应用管理、授权流程、令牌管理等功能。

## 基础信息

-   **API 基础地址**: `https://auth.example.com/api`
-   **支持协议**: OAuth 2.0、OpenID Connect 1.0
-   **支持流程**: Authorization Code Flow
-   **数据格式**: JSON / application/x-www-form-urlencoded
-   **字符编码**: UTF-8

## Discovery 端点

### GET /.well-known/openid-configuration

获取 OpenID Connect 配置信息。

#### 响应示例

```json
{
    "issuer": "https://auth.example.com",
    "authorization_endpoint": "https://auth.example.com/api/auth/oauth2/authorize",
    "token_endpoint": "https://auth.example.com/api/auth/oauth2/token",
    "userinfo_endpoint": "https://auth.example.com/api/auth/oauth2/userinfo",
    "jwks_uri": "https://auth.example.com/api/auth/jwks",
    "registration_endpoint": "https://auth.example.com/api/auth/oauth2/register",
    "response_types_supported": ["code"],
    "grant_types_supported": ["authorization_code", "refresh_token"],
    "subject_types_supported": ["public"],
    "id_token_signing_alg_values_supported": ["RS256"],
    "scopes_supported": ["openid", "profile", "email"],
    "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "none"
    ]
}
```

## OAuth 2.0 核心端点

### 授权端点

#### GET /auth/oauth2/authorize

启动 OAuth 2.0 授权流程，重定向用户到授权页面。

##### 授权请求参数

| 授权参数                | 类型   | 必需 | 描述                                |
| ----------------------- | ------ | ---- | ----------------------------------- |
| `client_id`             | string | 是   | 客户端 ID                           |
| `response_type`         | string | 是   | 响应类型，固定为 `code`             |
| `redirect_uri`          | string | 是   | 重定向 URI，必须与注册时的 URI 匹配 |
| `scope`                 | string | 否   | 请求的权限范围，多个用空格分隔      |
| `state`                 | string | 推荐 | 状态参数，用于防止 CSRF 攻击        |
| `code_challenge`        | string | 否   | PKCE 挑战码（当前版本不支持）       |
| `code_challenge_method` | string | 否   | PKCE 挑战方法（当前版本不支持）     |

##### 示例请求

```
GET /api/auth/oauth2/authorize?client_id=your_client_id&response_type=code&redirect_uri=https://yourapp.com/callback&scope=openid%20profile%20email&state=random_state_string
```

##### 成功响应

用户授权后，将重定向到指定的 `redirect_uri`：

```
https://yourapp.com/callback?code=authorization_code&state=random_state_string
```

### 令牌端点

#### POST /auth/oauth2/token

使用授权码交换访问令牌。

##### 令牌请求参数 (application/x-www-form-urlencoded)

| 令牌参数        | 类型   | 必需 | 描述                                              |
| --------------- | ------ | ---- | ------------------------------------------------- |
| `grant_type`    | string | 是   | 授权类型，`authorization_code` 或 `refresh_token` |
| `client_id`     | string | 是   | OAuth 客户端 ID                                   |
| `client_secret` | string | 否\* | 客户端密钥（依赖认证方式）                        |
| `code`          | string | 否\* | 授权码（授权码流程时必需）                        |
| `redirect_uri`  | string | 否\* | 重定向 URI（授权码流程时必需）                    |
| `refresh_token` | string | 否\* | 刷新令牌（刷新令牌流程时必需）                    |

\*根据授权类型和客户端认证方式，某些参数为必需。

##### 授权码流程示例

```bash
curl -X POST https://auth.example.com/api/auth/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=your_client_id" \
  -d "client_secret=your_client_secret" \
  -d "code=authorization_code" \
  -d "redirect_uri=https://yourapp.com/callback"
```

##### 刷新令牌流程示例

```bash
curl -X POST https://auth.example.com/api/auth/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=your_client_id" \
  -d "client_secret=your_client_secret" \
  -d "refresh_token=your_refresh_token"
```

##### 响应示例

**成功响应 (200 OK)**

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "scope": "openid profile email",
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户信息端点

#### GET /auth/oauth2/userinfo

使用访问令牌获取用户信息。

##### 请求头

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

##### 响应示例

**成功响应 (200 OK)**

```json
{
    "sub": "123456",
    "name": "用户名",
    "given_name": "名",
    "family_name": "姓",
    "nickname": "昵称",
    "preferred_username": "username",
    "profile": "https://example.com/profile",
    "picture": "https://example.com/avatar.jpg",
    "website": "https://example.com",
    "email": "user@example.com",
    "email_verified": true,
    "gender": "male",
    "birthdate": "1990-01-01",
    "zoneinfo": "Asia/Shanghai",
    "locale": "zh-CN",
    "updated_at": 1672531200
}
```

### JWKS 端点

#### GET /auth/jwks

获取用于验证 JWT 令牌的公钥集合。

##### 响应示例

```json
{
    "keys": [
        {
            "kty": "RSA",
            "use": "sig",
            "key_ops": ["verify"],
            "alg": "RS256",
            "kid": "key_id_1",
            "n": "base64_encoded_modulus",
            "e": "AQAB"
        }
    ]
}
```

## 动态客户端注册 (RFC 7591)

### POST /auth/oauth2/register

动态注册新的 OAuth 2.0 客户端。需要管理员权限。

#### 请求参数

```json
{
    "client_name": "我的应用",
    "client_uri": "https://myapp.com",
    "logo_uri": "https://myapp.com/logo.png",
    "redirect_uris": [
        "https://myapp.com/callback",
        "https://myapp.com/auth/callback"
    ],
    "token_endpoint_auth_method": "client_secret_basic",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email",
    "contacts": ["admin@myapp.com"],
    "tos_uri": "https://myapp.com/terms",
    "policy_uri": "https://myapp.com/privacy"
}
```

#### 客户端注册参数说明

| 注册参数                     | 类型   | 必需 | 描述                                          |
| ---------------------------- | ------ | ---- | --------------------------------------------- |
| `client_name`                | string | 是   | 客户端名称                                    |
| `redirect_uris`              | array  | 是   | 重定向 URI 列表                               |
| `client_uri`                 | string | 否   | 客户端主页 URI                                |
| `logo_uri`                   | string | 否   | 客户端 Logo URI                               |
| `token_endpoint_auth_method` | string | 否   | 令牌端点认证方法，默认 `client_secret_basic`  |
| `grant_types`                | array  | 否   | 支持的授权类型，默认 `["authorization_code"]` |
| `response_types`             | array  | 否   | 支持的响应类型，默认 `["code"]`               |
| `scope`                      | string | 否   | 默认授权范围                                  |
| `contacts`                   | array  | 否   | 联系邮箱列表                                  |
| `tos_uri`                    | string | 否   | 服务条款 URI                                  |
| `policy_uri`                 | string | 否   | 隐私政策 URI                                  |

#### 响应示例

**成功响应 (201 Created)**

```json
{
    "client_id": "generated_client_id",
    "client_secret": "generated_client_secret",
    "client_id_issued_at": 1672531200,
    "client_secret_expires_at": 0,
    "client_name": "我的应用",
    "redirect_uris": [
        "https://myapp.com/callback",
        "https://myapp.com/auth/callback"
    ],
    "token_endpoint_auth_method": "client_secret_basic",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email"
}
```

## 应用管理 API

### 获取应用列表

#### GET /api/oauth/applications

获取当前用户管理的所有 OAuth 应用。需要管理员权限。

##### 响应示例

```json
{
    "status": 200,
    "success": true,
    "data": [
        {
            "id": "app_123",
            "clientId": "client_123",
            "name": "我的应用",
            "description": "应用描述",
            "redirectURLs": "https://myapp.com/callback",
            "clientUri": "https://myapp.com",
            "logoUri": "https://myapp.com/logo.png",
            "scope": "openid profile email",
            "disabled": false,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 获取应用详情

#### GET /api/oauth/client/{client_id}

获取指定应用的公开信息（不包含敏感信息）。

##### 响应示例

```json
{
    "status": 200,
    "success": true,
    "data": {
        "id": "app_123",
        "clientId": "client_123",
        "name": "我的应用",
        "description": "应用描述",
        "clientUri": "https://myapp.com",
        "logoUri": "https://myapp.com/logo.png",
        "scope": "openid profile email",
        "tosUri": "https://myapp.com/terms",
        "policyUri": "https://myapp.com/privacy",
        "type": "web"
    }
}
```

### 更新应用

#### PUT /api/oauth/applications/`{id}`

更新指定的 OAuth 应用信息。需要管理员权限。

##### 请求参数

```json
{
    "client_name": "更新的应用名称",
    "description": "更新的描述",
    "redirect_uris": ["https://myapp.com/new-callback"],
    "client_uri": "https://myapp.com",
    "logo_uri": "https://myapp.com/new-logo.png",
    "scope": "openid profile email",
    "disabled": false
}
```

### 删除应用

#### DELETE /api/oauth/applications/`{id}`

删除指定的 OAuth 应用。需要管理员权限。

##### 响应示例

```json
{
    "status": 200,
    "success": true,
    "message": "删除成功",
    "data": null
}
```

## 用户授权管理

### 获取已授权应用

#### GET /api/oauth/consents

获取当前用户授权的所有应用列表。

##### 响应示例

```json
{
    "status": 200,
    "success": true,
    "data": [
        {
            "id": "consent_123",
            "clientId": "client_123",
            "consentedAt": "2024-01-01T00:00:00Z",
            "scopes": ["openid", "profile", "email"],
            "application": {
                "name": "我的应用",
                "description": "应用描述",
                "logoUri": "https://myapp.com/logo.png",
                "clientUri": "https://myapp.com",
                "tosUri": "https://myapp.com/terms",
                "policyUri": "https://myapp.com/privacy"
            }
        }
    ]
}
```

### 撤销应用授权

#### POST /api/oauth/revoke-consent

撤销对指定应用的授权。

##### 请求参数

```json
{
    "clientId": "client_123"
}
```

##### 响应示例

```json
{
    "status": 200,
    "success": true,
    "message": "成功撤销授权",
    "data": null
}
```

## 支持的权限范围 (Scopes)

| 权限范围         | 描述                               |
| ---------------- | ---------------------------------- |
| `openid`         | 基本身份信息，启用 OpenID Connect  |
| `profile`        | 用户基本资料（姓名、昵称、头像等） |
| `email`          | 用户邮箱地址                       |
| `phone`          | 用户手机号码（当前不支持）         |
| `address`        | 用户地址信息（当前不支持）         |
| `offline_access` | 离线访问权限，可获取刷新令牌       |

## 错误响应

### 授权错误

授权端点的错误会通过重定向返回：

```
https://yourapp.com/callback?error=invalid_request&error_description=Invalid%20client_id&state=random_state_string
```

### API 错误

API 端点的错误以 JSON 格式返回：

```json
{
    "error": "invalid_client",
    "error_description": "Client authentication failed"
}
```

### 常见错误代码

| 错误类型                    | 描述                   |
| --------------------------- | ---------------------- |
| `invalid_request`           | 请求参数无效           |
| `unauthorized_client`       | 客户端未被授权         |
| `access_denied`             | 用户拒绝授权           |
| `unsupported_response_type` | 不支持的响应类型       |
| `invalid_scope`             | 无效的权限范围         |
| `server_error`              | 服务器内部错误         |
| `temporarily_unavailable`   | 服务暂时不可用         |
| `invalid_client`            | 客户端认证失败         |
| `invalid_grant`             | 无效的授权码或刷新令牌 |
| `unsupported_grant_type`    | 不支持的授权类型       |

## 最佳实践

### 安全建议

1. **使用 HTTPS**: 所有生产环境必须使用 HTTPS
2. **状态参数**: 始终使用 `state` 参数防止 CSRF 攻击
3. **短期令牌**: 访问令牌应设置较短的有效期
4. **安全存储**: 客户端密钥和刷新令牌需要安全存储
5. **权限最小化**: 只请求必要的权限范围

### 性能优化

1. **令牌缓存**: 缓存访问令牌直到过期
2. **并发限制**: 避免同时发起多个令牌请求
3. **错误重试**: 实现适当的错误重试机制

## 示例集成代码

### 完整的授权流程 (JavaScript)

```javascript
class OAuthClient {
    constructor(clientId, clientSecret, redirectUri, baseUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.baseUrl = baseUrl;
    }

    // 生成授权URL
    getAuthorizationUrl(scopes = ["openid", "profile", "email"], state = null) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: "code",
            redirect_uri: this.redirectUri,
            scope: scopes.join(" "),
            state: state || this.generateRandomString(32),
        });

        return `${this.baseUrl}/api/auth/oauth2/authorize?${params.toString()}`;
    }

    // 交换访问令牌
    async exchangeCodeForTokens(code, state) {
        const response = await fetch(`${this.baseUrl}/api/auth/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`);
        }

        return await response.json();
    }

    // 刷新令牌
    async refreshTokens(refreshToken) {
        const response = await fetch(`${this.baseUrl}/api/auth/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        return await response.json();
    }

    // 获取用户信息
    async getUserInfo(accessToken) {
        const response = await fetch(
            `${this.baseUrl}/api/auth/oauth2/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Get user info failed: ${response.statusText}`);
        }

        return await response.json();
    }

    // 生成随机字符串
    generateRandomString(length) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// 使用示例
const client = new OAuthClient(
    "your_client_id",
    "your_client_secret",
    "https://yourapp.com/callback",
    "https://auth.example.com"
);

// 1. 重定向到授权页面
const authUrl = client.getAuthorizationUrl();
window.location.href = authUrl;

// 2. 在回调页面处理授权码
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");
const state = urlParams.get("state");

if (code) {
    try {
        // 交换令牌
        const tokens = await client.exchangeCodeForTokens(code, state);
        console.log("Access Token:", tokens.access_token);

        // 获取用户信息
        const userInfo = await client.getUserInfo(tokens.access_token);
        console.log("User Info:", userInfo);

        // 保存令牌（注意安全存储）
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
    } catch (error) {
        console.error("OAuth flow failed:", error);
    }
}
```
