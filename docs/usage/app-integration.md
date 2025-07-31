# 应用集成

本文档将指导您如何将草梅 Auth 集成到您的应用中，包括 OAuth2.0 配置、API 使用和最佳实践。

## OAuth2.0 集成

草梅 Auth 基于 better-auth 框架提供完整的 OAuth2.0 和 OpenID Connect (OIDC) 服务器实现，支持标准的授权码流程。

### 注册应用

在使用 OAuth2.0 之前，需要先注册您的应用：

#### 注册步骤
1. 登录草梅 Auth 管理后台
2. 访问"应用管理"页面 (`/admin/oauth/clients`)
3. 点击"创建新应用"
4. 填写应用信息：
   - **应用名称**: 显示给用户的应用名称
   - **应用描述**: 应用的简短描述
   - **应用图标**: 上传应用图标（可选）
   - **回调 URL**: 授权成功后的重定向地址
   - **应用类型**: Web 应用、移动应用等
   - **权限范围**: 选择应用需要的权限

#### 获取凭证
注册成功后，您会获得：
- **Client ID**: 应用的唯一标识符
- **Client Secret**: 应用的密钥（请妥善保管）

### 授权码流程

这是最常用的 OAuth2.0 流程，适用于 Web 应用和移动应用。

#### 步骤 1: 引导用户授权

将用户重定向到授权端点：

```
GET /api/auth/oauth2/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={SCOPE}&state={STATE}
```

**参数说明：**
- `response_type`: 固定为 `code`
- `client_id`: 您的应用 Client ID
- `redirect_uri`: 授权成功后的回调地址
- `scope`: 请求的权限范围，多个权限用空格分隔
- `state`: 防止 CSRF 攻击的随机字符串

**示例：**
```
https://auth.example.com/api/auth/oauth2/authorize?response_type=code&client_id=your_client_id&redirect_uri=https://yourapp.com/callback&scope=openid%20profile%20email&state=xyz123
```

#### 步骤 2: 用户同意授权

用户会看到授权确认页面，显示：
- 应用名称和图标
- 请求的权限列表
- 同意/拒绝按钮

#### 步骤 3: 获取授权码

用户同意后，系统会重定向到您的回调地址：

```
https://yourapp.com/callback?code=AUTH_CODE&state=xyz123
```

#### 步骤 4: 交换访问令牌

使用授权码获取访问令牌：

```http
POST /api/auth/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE&
redirect_uri=https://yourapp.com/callback&
client_id=your_client_id&
client_secret=your_client_secret
```

**响应示例：**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### 刷新访问令牌

当访问令牌过期时，使用刷新令牌获取新的访问令牌：

```http
POST /api/auth/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=your_refresh_token&
client_id=your_client_id&
client_secret=your_client_secret
```

**注意：** 草梅 Auth 目前只支持授权码流程 (Authorization Code Flow)，不支持客户端凭证流程 (Client Credentials Flow)。

## API 使用

### 认证方式

使用获取的访问令牌调用 API：

```http
GET /api/auth/oauth2/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 权限范围

草梅 Auth 支持以下权限范围：

#### 标准 OIDC 权限
- `openid`: 基本身份信息，启用 OpenID Connect
- `profile`: 用户基本资料（姓名、昵称、头像等）
- `email`: 用户邮箱地址
- `offline_access`: 离线访问权限，可获取刷新令牌

#### 说明
- `phone` 和 `address` 权限当前不支持
- 权限范围决定了令牌可访问的用户信息类型


### 常用 API 端点

#### 获取用户信息
```http
GET /api/auth/oauth2/userinfo
Authorization: Bearer {access_token}
```

**响应：**
```json
{
  "sub": "123456",
  "name": "用户名",
  "nickname": "昵称",
  "preferred_username": "username",
  "picture": "https://example.com/avatar.jpg",
  "email": "user@example.com",
  "email_verified": true
}
```

#### JWKS 端点（用于验证 JWT 令牌）
```http
GET /api/auth/jwks
```

#### OpenID Connect Discovery
```http
GET /.well-known/openid-configuration
```


## 最佳实践

### 安全建议

#### 1. 保护客户端密钥
- 永远不要在前端代码中暴露 Client Secret
- 使用环境变量存储敏感信息
- 定期轮换客户端密钥

#### 2. 验证状态参数
- 始终使用 state 参数防止 CSRF 攻击
- 在回调中验证 state 参数的正确性

```javascript
// 生成随机 state
const state = crypto.randomBytes(16).toString('hex');
sessionStorage.setItem('oauth_state', state);

// 验证回调中的 state
const returnedState = new URLSearchParams(window.location.search).get('state');
if (returnedState !== sessionStorage.getItem('oauth_state')) {
  throw new Error('Invalid state parameter');
}
```

#### 3. 使用 HTTPS
- 所有 OAuth2.0 通信必须使用 HTTPS
- 确保回调 URL 使用 HTTPS

#### 4. 最小权限原则
- 只请求应用实际需要的权限
- 向用户清楚说明权限用途

### 错误处理

#### 常见错误码

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `invalid_client` | 无效的客户端 ID 或密钥 | 检查凭证是否正确 |
| `invalid_grant` | 无效的授权码 | 授权码可能已过期或被使用 |
| `unsupported_grant_type` | 不支持的授权类型 | 检查 grant_type 参数 |
| `invalid_scope` | 无效的权限范围 | 检查权限是否被授权 |
| `access_denied` | 用户拒绝授权 | 重新引导用户授权 |

#### 错误处理示例

```javascript
try {
  const token = await auth.exchangeCodeForToken(code);
} catch (error) {
  if (error.code === 'invalid_grant') {
    // 重新引导用户授权
    window.location.href = auth.getAuthorizationUrl();
  } else {
    console.error('OAuth error:', error.message);
  }
}
```

### 性能优化

#### 1. 令牌缓存
- 在本地缓存访问令牌
- 使用刷新令牌自动续期
- 实现令牌过期自动重试

```javascript
class TokenManager {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async getValidToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.token;
  }

  async refreshAccessToken() {
    const newToken = await auth.refreshToken(this.refreshToken);
    this.saveToken(newToken);
    return newToken;
  }
}
```

#### 2. 并发请求处理
- 避免同时发起多个令牌刷新请求
- 实现请求队列机制

#### 3. 用户体验优化
- 提供登录状态指示器
- 实现自动登录检测
- 优雅的错误提示

## 示例应用

### 单页应用 (SPA)

```html
<!DOCTYPE html>
<html>
<head>
    <title>OAuth2.0 Demo</title>
</head>
<body>
    <div id="app">
        <div v-if="!user">
            <button @click="login">登录</button>
        </div>
        <div v-else>
            <h2>欢迎, {{ user.displayName }}!</h2>
            <p>邮箱: {{ user.email }}</p>
            <button @click="logout">登出</button>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script>
        const { createApp } = Vue;
        
        createApp({
            data() {
                return {
                    user: null,
                    clientId: 'your_client_id',
                    baseURL: 'https://auth.example.com'
                };
            },
            async mounted() {
                await this.checkAuthCallback();
                await this.loadUser();
            },
            methods: {
                login() {
                    const state = Math.random().toString(36);
                    localStorage.setItem('oauth_state', state);
                    
                    const params = new URLSearchParams({
                        response_type: 'code',
                        client_id: this.clientId,
                        redirect_uri: window.location.origin + '/callback',
                        scope: 'openid profile email',
                        state: state
                    });
                    
                    window.location.href = `${this.baseURL}/api/auth/oauth2/authorize?${params}`;
                },
                
                async checkAuthCallback() {
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('code');
                    const state = urlParams.get('state');
                    
                    if (code && state) {
                        if (state !== localStorage.getItem('oauth_state')) {
                            throw new Error('Invalid state');
                        }
                        
                        const token = await this.exchangeCodeForToken(code);
                        localStorage.setItem('access_token', token.access_token);
                        
                        // 清理 URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                },
                
                async exchangeCodeForToken(code) {
                    const response = await fetch(`${this.baseURL}/api/auth/oauth2/token`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: code,
                            redirect_uri: window.location.origin + '/callback',
                            client_id: this.clientId
                        })
                    });
                    
                    return await response.json();
                },
                
                async loadUser() {
                    const token = localStorage.getItem('access_token');
                    if (!token) return;
                    
                    try {
                        const response = await fetch(`${this.baseURL}/api/auth/oauth2/userinfo`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        
                        if (response.ok) {
                            this.user = await response.json();
                        }
                    } catch (error) {
                        console.error('Failed to load user:', error);
                    }
                },
                
                logout() {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('oauth_state');
                    this.user = null;
                }
            }
        }).mount('#app');
    </script>
</body>
</html>
```

### Node.js 服务端

```javascript
const express = require('express');
const axios = require('axios');
const session = require('express-session');

const app = express();

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: true
}));

const config = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  baseURL: process.env.AUTH_BASE_URL,
  redirectUri: process.env.REDIRECT_URI
};

// 登录路由
app.get('/login', (req, res) => {
  const state = Math.random().toString(36);
  req.session.oauthState = state;
  
  const authUrl = `${config.baseURL}/api/auth/oauth2/authorize?` + 
    `response_type=code&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=openid%20profile%20email&` +
    `state=${state}`;
  
  res.redirect(authUrl);
});

// 回调路由
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state');
  }
  
  try {
    const tokenResponse = await axios.post(`${config.baseURL}/api/auth/oauth2/token`, {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret
    });
    
    req.session.accessToken = tokenResponse.data.access_token;
    res.redirect('/profile');
  } catch (error) {
    res.status(500).send('Token exchange failed');
  }
});

// 用户信息路由
app.get('/profile', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/login');
  }
  
  try {
    const userResponse = await axios.get(`${config.baseURL}/api/auth/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`
      }
    });
    
    res.json(userResponse.data);
  } catch (error) {
    res.status(500).send('Failed to fetch user data');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 测试和调试

### 使用 OAuth2.0 调试工具

推荐使用以下工具测试 OAuth2.0 集成：

1. **Postman**: 创建 OAuth2.0 授权流程
2. **OAuth2.0 Debugger**: 在线调试工具
3. **草梅 Auth 内置工具**: 管理后台的测试功能

### 常见调试步骤

1. 验证应用配置是否正确
2. 检查回调 URL 是否匹配
3. 确认权限范围是否被授权
4. 验证令牌格式和有效期
5. 测试 API 调用

## 常见问题

### Q: 访问令牌的有效期是多长？
A: 默认为 1 小时（3600 秒），可以通过刷新令牌获取新的访问令牌。

### Q: 如何在移动应用中使用 OAuth2.0？
A: 移动应用建议使用授权码流程，草梅 Auth 暂不支持 PKCE 扩展，但仍可安全使用。

### Q: 如何撤销访问令牌？
A: 草梅 Auth 目前没有专门的令牌撤销端点，但用户可以在个人中心撤销应用授权。

### Q: 支持哪些 OAuth2.0 授权类型？
A: 目前支持授权码流程 (Authorization Code Flow) 和刷新令牌流程 (Refresh Token Flow)。

### Q: 如何处理用户拒绝授权的情况？
A: 用户拒绝授权时，会重定向到回调 URL 并带有 `error=access_denied` 参数。

## 技术支持

如需技术支持，请：
- 查看 [API 文档](/docs/api/)
- 参考 [故障排除](./troubleshooting) 指南
- 联系开发团队
- 提交 GitHub Issue
