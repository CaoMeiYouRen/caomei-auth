# 认证 API

草梅 Auth 基于 [better-auth](https://www.better-auth.com/) 构建，提供完整的认证解决方案。

## 基础信息

-   **API 基础地址**: `https://auth.example.com/api/auth`
-   **认证框架**: [better-auth](https://www.better-auth.com/)
-   **认证方式**: Session Cookie / Bearer Token
-   **数据格式**: JSON
-   **字符编码**: UTF-8

## 官方文档

完整的认证 API 文档请参考 better-auth 官方文档：

📖 **[better-auth 官方文档](https://www.better-auth.com/docs)**

### 核心功能文档链接

| 功能          | 官方文档链接                                                                      |
| ------------- | --------------------------------------------------------------------------------- |
| 用户注册/登录 | [Authentication](https://www.better-auth.com/docs/concepts/users-accounts)        |
| 会话管理      | [Sessions](https://www.better-auth.com/docs/concepts/sessions)                    |
| 邮箱验证      | [Email Verification](https://www.better-auth.com/docs/plugins/email-verification) |
| 用户名登录    | [Username Plugin](https://www.better-auth.com/docs/plugins/username)              |
| 手机号验证    | [Phone Number Plugin](https://www.better-auth.com/docs/plugins/phone-number)      |
| 邮箱 OTP      | [Email OTP Plugin](https://www.better-auth.com/docs/plugins/email-otp)            |
| 魔术链接      | [Magic Link Plugin](https://www.better-auth.com/docs/plugins/magic-link)          |
| 匿名登录      | [Anonymous Plugin](https://www.better-auth.com/docs/plugins/anonymous)            |
| 双因子认证    | [Two Factor Plugin](https://www.better-auth.com/docs/plugins/two-factor)          |
| 社交登录      | [Social Providers](https://www.better-auth.com/docs/concepts/social-providers)    |
| 管理员功能    | [Admin Plugin](https://www.better-auth.com/docs/plugins/admin)                    |

## 草梅 Auth 特定配置

### 支持的登录方式

草梅 Auth 配置了以下登录方式：

1. **邮箱 + 密码**
2. **用户名 + 密码**
3. **手机号 + 验证码**
4. **邮箱验证码（OTP）**
5. **魔术链接**
6. **匿名登录**
7. **社交媒体登录**：
    - GitHub
    - Google
    - Microsoft
    - Discord
    - Facebook
    - Apple
    - Twitter
    - 微博
    - QQ
    - 微信
    - 抖音

### API 端点示例

所有认证 API 都以 `/api/auth` 为前缀：

```javascript
// 邮箱注册
POST /api/auth/sign-up/email

// 邮箱登录
POST /api/auth/sign-in/email

// 用户名登录
POST /api/auth/sign-in/username

// 手机号登录
POST /api/auth/phone-number/sign-in

// 获取会话
GET /api/auth/get-session

// 退出登录
POST /api/auth/sign-out
```

### 客户端集成

建议使用 better-auth 的客户端库进行集成：

```typescript
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
    baseURL: "https://auth.example.com",
});

// 邮箱注册
const { data, error } = await authClient.signUp.email({
    email: "user@example.com",
    password: "password123",
    name: "用户名",
});

// 邮箱登录
const { data, error } = await authClient.signIn.email({
    email: "user@example.com",
    password: "password123",
});

// 获取会话
const { data: session } = await authClient.getSession();
```

详细的客户端使用方法请参考：[better-auth Client Documentation](https://www.better-auth.com/docs/concepts/client)

## 环境配置

### 必需的环境变量

```env
# 认证密钥
AUTH_SECRET=your-secret-key-here

# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/caomei_auth

# 邮件服务（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 社交登录（可选）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

```

### 可选的环境变量

```env
# 短信服务
SMS_PROVIDER=aliyun
ALIYUN_ACCESS_KEY_ID=your-access-key
ALIYUN_ACCESS_KEY_SECRET=your-secret-key

# Redis 缓存
REDIS_URL=redis://localhost:6379

# 管理员用户ID列表
ADMIN_USER_IDS=user1,user2,user3
```

## 错误处理

better-auth 使用标准的 HTTP 状态码和错误格式。常见错误：

```json
{
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
}
```

详细的错误处理请参考：[better-auth Error Handling](https://www.better-auth.com/docs/concepts/error-handling)

## 安全特性

草梅 Auth 启用了以下安全特性：

-   ✅ **密码哈希**: 使用 bcrypt 加密存储
-   ✅ **会话管理**: 安全的会话令牌
-   ✅ **CSRF 保护**: 内置 CSRF 防护
-   ✅ **限流保护**: API 请求频率限制
-   ✅ **邮箱验证**: 可配置的邮箱验证
-   ✅ **双因子认证**: TOTP 和备用码
-   ✅ **安全头**: 设置安全相关的 HTTP 头

## 快速开始

1. **创建认证客户端**：

```typescript
import { createAuthClient } from "better-auth/client";

const auth = createAuthClient({
    baseURL: "https://your-auth-domain.com",
});
```

2. **实现登录流程**：

```typescript
// 注册用户
const signUp = async () => {
    const { data, error } = await auth.signUp.email({
        email: "user@example.com",
        password: "password123",
        name: "用户名",
    });

    if (error) {
        console.error("注册失败:", error);
        return;
    }

    console.log("注册成功:", data);
};

// 登录用户
const signIn = async () => {
    const { data, error } = await auth.signIn.email({
        email: "user@example.com",
        password: "password123",
    });

    if (error) {
        console.error("登录失败:", error);
        return;
    }

    console.log("登录成功:", data);
};
```

3. **获取用户信息**：

```typescript
const { data: session } = await auth.getSession();

if (session) {
    console.log("当前用户:", session.user);
} else {
    console.log("用户未登录");
}
```

## 更多资源

-   📖 [better-auth 完整文档](https://www.better-auth.com/docs)
-   🎯 [better-auth 示例项目](https://github.com/better-auth/better-auth/tree/main/examples)
-   🚀 [快速开始指南](../getting-started)
-   🛠️ [最佳实践](../guides/best-practices)
-   🔧 [故障排除](../guides/troubleshooting)

如果您需要了解草梅 Auth 的其他 API（如管理员功能、文件上传等），请查看相应的文档页面。
