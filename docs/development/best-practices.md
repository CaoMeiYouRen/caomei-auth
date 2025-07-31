# 最佳实践

本文档提供了使用草梅 Auth 的最佳实践和安全建议，帮助您构建安全、高效的认证系统。

## 安全最佳实践

### 1. 客户端密钥管理

#### ✅ 正确做法

-   **保护客户端密钥**：将 `client_secret` 存储在服务器端，绝不在客户端代码中暴露
-   **使用环境变量**：将敏感信息存储在环境变量中
-   **定期轮换密钥**：建议每 6-12 个月更换一次客户端密钥

```env
# .env 文件
CLIENT_ID=your_client_id
CLIENT_SECRET=your_secret_key_here
```

#### ❌ 错误做法

```javascript
// 错误：在前端代码中暴露密钥
const clientSecret = "your_secret_key_here"; // 危险！
```

### 2. 状态参数 (State) 防护

始终使用 `state` 参数防止 CSRF 攻击：

```javascript
// 生成随机状态值
const state = generateRandomString(32);
sessionStorage.setItem("oauth_state", state);

// 授权URL中包含state
const authUrl =
    `https://auth.example.com/api/auth/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}&` +
    `scope=openid profile email`;
```

### 3. 重定向 URI 验证

-   **精确匹配**：注册时使用完整的重定向 URI，避免使用通配符
-   **HTTPS Only**：生产环境必须使用 HTTPS 协议
-   **域名验证**：只允许可信域名作为重定向目标

### 4. 令牌处理

#### Access Token

-   安全存储在内存中，避免存储在 localStorage
-   设置合理的过期时间（推荐 1-24 小时）
-   使用 HTTPS 传输

#### Refresh Token

-   存储在 httpOnly cookie 中
-   设置较长的过期时间（推荐 30 天）
-   支持令牌轮换 (Token Rotation)

```javascript
// 推荐的令牌存储方式
class TokenManager {
    constructor() {
        this.accessToken = null; // 存储在内存中
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    getAccessToken() {
        return this.accessToken;
    }

    clearTokens() {
        this.accessToken = null;
        // Refresh token 通过API清除
    }
}
```

## 性能优化建议

### 1. 令牌缓存

合理使用令牌缓存减少 API 调用：

```javascript
class AuthService {
    constructor() {
        this.tokenCache = new Map();
        this.userInfoCache = null;
        this.cacheExpiry = null;
    }

    async getUserInfo() {
        // 检查缓存是否有效
        if (this.userInfoCache && Date.now() < this.cacheExpiry) {
            return this.userInfoCache;
        }

        // 重新获取用户信息
        const userInfo = await this.fetchUserInfo();
        this.userInfoCache = userInfo;
        this.cacheExpiry = Date.now() + 5 * 60 * 1000; // 5分钟缓存

        return userInfo;
    }
}
```

### 2. 批量操作

对于管理员功能，使用批量 API 减少请求次数：

```javascript
// 推荐：批量操作
await authClient.admin.banUsers({
    userIds: ["user1", "user2", "user3"],
    reason: "违规行为",
});

// 避免：单个操作
// for (const userId of userIds) {
//   await authClient.admin.banUser({ userId, reason: '违规行为' })
// }
```

### 3. 连接池配置

合理配置数据库连接池：

```javascript
// 数据库配置建议
const dbConfig = {
    host: "localhost",
    port: 5432,
    database: "caomei_auth",
    username: "auth_user",
    password: process.env.DB_PASSWORD,
    synchronize: false, // 生产环境设为 false
    logging: process.env.NODE_ENV === "development",
    maxQueryExecutionTime: 1000, // 1秒查询超时
    extra: {
        connectionLimit: 10, // 连接池大小
        acquireTimeout: 60000, // 获取连接超时
        timeout: 60000, // 查询超时
    },
};
```

## 错误处理

### 1. 统一错误处理

```javascript
class AuthError extends Error {
    constructor(message, code, status = 400) {
        super(message);
        this.name = "AuthError";
        this.code = code;
        this.status = status;
    }
}

// 错误处理中间件
function errorHandler(error, req, res, next) {
    if (error instanceof AuthError) {
        return res.status(error.status).json({
            error: error.code,
            message: error.message,
        });
    }

    // 其他错误
    console.error("Unexpected error:", error);
    res.status(500).json({
        error: "internal_server_error",
        message: "服务器内部错误",
    });
}
```

### 2. 客户端错误处理

```javascript
async function handleAuthRequest(requestFn) {
    try {
        return await requestFn();
    } catch (error) {
        if (error.status === 401) {
            // 令牌过期或无效
            await refreshToken();
            return await requestFn(); // 重试
        } else if (error.status === 403) {
            // 权限不足
            showPermissionError();
        } else if (error.status >= 500) {
            // 服务器错误
            showServerError();
        } else {
            // 其他客户端错误
            showError(error.message);
        }
        throw error;
    }
}
```

## 监控与日志

### 1. 关键指标监控

建议监控以下指标：

-   登录成功率
-   登录响应时间
-   令牌刷新频率
-   API 错误率
-   用户活跃度

### 2. 安全日志

记录重要的安全事件：

```javascript
const securityLogger = {
    loginAttempt: (userId, ip, userAgent, success) => {
        console.log(
            JSON.stringify({
                event: "login_attempt",
                userId,
                ip,
                userAgent,
                success,
                timestamp: new Date().toISOString(),
            })
        );
    },

    passwordReset: (userId, ip) => {
        console.log(
            JSON.stringify({
                event: "password_reset",
                userId,
                ip,
                timestamp: new Date().toISOString(),
            })
        );
    },

    permissionDenied: (userId, resource, action) => {
        console.log(
            JSON.stringify({
                event: "permission_denied",
                userId,
                resource,
                action,
                timestamp: new Date().toISOString(),
            })
        );
    },
};
```

## 部署建议

### 1. 环境配置

不同环境使用不同的配置：

```javascript
// config/production.js
module.exports = {
    database: {
        ssl: true,
        logging: false,
        synchronize: false,
    },
    session: {
        secure: true, // HTTPS only
        sameSite: "strict",
    },
    rateLimit: {
        max: 100, // 更严格的限制
        windowMs: 15 * 60 * 1000,
    },
};

// config/development.js
module.exports = {
    database: {
        ssl: false,
        logging: true,
        synchronize: true,
    },
    session: {
        secure: false,
        sameSite: "lax",
    },
    rateLimit: {
        max: 1000, // 宽松的限制
        windowMs: 15 * 60 * 1000,
    },
};
```

### 2. 健康检查

实现健康检查端点：

```javascript
// /api/health
export default defineEventHandler(async (event) => {
    try {
        // 检查数据库连接
        await dataSource.query("SELECT 1");

        // 检查Redis连接（如果使用）
        if (redis) {
            await redis.ping();
        }

        return {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version,
        };
    } catch (error) {
        throw createError({
            statusCode: 503,
            statusMessage: "Service Unavailable",
        });
    }
});
```

### 3. 备份策略

-   **数据库备份**：每日自动备份，保留 30 天
-   **配置备份**：版本控制环境配置模板
-   **密钥备份**：安全存储密钥备份，支持快速恢复

## 扩展性考虑

### 1. 微服务架构

随着业务增长，考虑拆分为微服务：

-   认证服务（Auth Service）
-   用户管理服务（User Service）
-   通知服务（Notification Service）
-   审计服务（Audit Service）

### 2. 缓存策略

实现多层缓存：

```javascript
// 缓存层次
const cacheManager = {
    // L1: 内存缓存（最快，容量小）
    memory: new LRUCache({ max: 1000, ttl: 5 * 60 * 1000 }),

    // L2: Redis缓存（快，容量大）
    redis: redisClient,

    // L3: 数据库（慢，持久化）
    database: dataSource,
};
```

### 3. 国际化支持

为多语言用户提供支持：

```javascript
// i18n配置
const messages = {
    "zh-CN": {
        "auth.login.title": "登录",
        "auth.login.email": "邮箱",
        "auth.login.password": "密码",
    },
    "en-US": {
        "auth.login.title": "Login",
        "auth.login.email": "Email",
        "auth.login.password": "Password",
    },
};
```

## 常见陷阱

### 1. 时区问题

始终使用 UTC 时间戳：

```javascript
// ✅ 正确
const createdAt = new Date().toISOString();

// ❌ 错误
const createdAt = new Date().toString();
```

### 2. 密码复杂度

实现合理的密码策略：

```javascript
const passwordPolicy = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // 根据业务需求
    preventCommonPasswords: true,
};
```

### 3. 会话管理

正确处理会话生命周期：

```javascript
// 登出时清理所有相关资源
async function logout(sessionId) {
    // 1. 撤销访问令牌
    await revokeAccessToken(sessionId);

    // 2. 清除服务器会话
    await clearSession(sessionId);

    // 3. 清除客户端存储
    localStorage.clear();
    sessionStorage.clear();

    // 4. 通知其他标签页
    broadcastChannel.postMessage({ type: "logout" });
}
```

通过遵循这些最佳实践，您可以构建一个安全、可靠、高性能的认证系统。如果您有任何疑问，请查看 [故障排除指南](./troubleshooting.md) 或联系技术支持。
