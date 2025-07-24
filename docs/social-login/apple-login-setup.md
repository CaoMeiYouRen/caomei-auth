# Apple 登录配置指南

本指南将帮助您在草梅 Auth 中配置 Apple 登录功能。

## 前置要求

-   有效的 Apple Developer 账户
-   访问 Apple Developer Portal 的权限

## 配置步骤

### 1. 在 Apple Developer Portal 中创建应用和服务

#### 创建 App ID

1. 登录 [Apple Developer Portal](https://developer.apple.com/)
2. 进入 "Certificates, Identifiers & Profiles" 部分
3. 在 Identifiers 选项卡中，点击 + 图标
4. 选择 "App IDs"，然后点击 Continue
5. 选择 "App" 作为类型，然后点击 Continue
6. 填写以下信息：
    - **Description**: 输入应用名称（如 "草梅 Auth"）
    - **Bundle ID**: 设置 Bundle ID，推荐格式为反向域名（如 `com.yourcompany.caomei-auth`）
7. 在 Capabilities 部分，勾选 "Sign In with Apple"
8. 点击 Continue，然后 Register

#### 创建 Service ID

1. 回到 Identifiers 选项卡，点击 + 图标
2. 选择 "Service IDs"，然后点击 Continue
3. 填写以下信息：
    - **Description**: 输入服务描述（如 "草梅 Auth Web Service"）
    - **Identifier**: 设置唯一标识符（如 `com.yourcompany.caomei-auth.web`）
4. 点击 Continue，然后 Register

#### 配置 Service ID

1. 在 Identifiers 列表中找到刚创建的 Service ID 并点击
2. 勾选 "Sign In with Apple" 功能，然后点击 Configure
3. 在 Primary App ID 下，选择之前创建的 App ID
4. 在 "Domains and Subdomains" 中，添加您的域名（如 `yourdomain.com`）
5. 在 "Return URLs" 中，添加回调 URL：`https://yourdomain.com/api/auth/callback/apple`
6. 点击 Next，然后 Done
7. 点击 Continue，然后 Save

#### 创建私钥

1. 进入 Keys 选项卡
2. 点击 + 图标创建新密钥
3. 设置 Key Name（如 "Sign In with Apple Key"）
4. 勾选 "Sign In with Apple"
5. 点击 Sign In with Apple 旁边的 Configure 按钮
6. 选择之前创建的 Primary App ID
7. 点击 Save，然后 Continue，最后 Register
8. **立即下载 .p8 密钥文件**（只能下载一次）
9. 记录 Key ID（在 Keys 页面创建后可见）和 Team ID（在开发者账户设置中可见）

### 2. 生成客户端密钥 JWT

Apple 要求使用 JWT 作为客户端密钥。您可以使用以下方法之一生成：

#### 方法一：使用在线工具

访问 [jwt.io](https://jwt.io/) 或 Better Auth 官方文档提供的生成器。

#### 方法二：使用 Node.js 脚本

```javascript
const jwt = require("jsonwebtoken");
const fs = require("fs");

// 从 .p8 文件读取私钥
const privateKey = fs.readFileSync(
    "path/to/your/AuthKey_XXXXXXXXXX.p8",
    "utf8"
);

const payload = {
    iss: "YOUR_TEAM_ID", // Apple Developer Team ID
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6个月过期
    aud: "https://appleid.apple.com",
    sub: "YOUR_SERVICE_ID", // Apple Service ID
};

const header = {
    alg: "ES256",
    kid: "YOUR_KEY_ID", // Apple Key ID
};

const clientSecret = jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    header,
});

console.log("Apple Client Secret:", clientSecret);
```

### 3. 配置环境变量

在您的 `.env` 文件中添加以下配置：

```env
# Apple 登录配置
APPLE_CLIENT_ID=com.yourcompany.caomei-auth.web    # Service ID
APPLE_CLIENT_SECRET=your_generated_jwt_token        # 生成的 JWT 令牌
APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.caomei-auth  # Bundle ID（可选）
```

### 4. 重启应用

配置完成后，重启您的应用以使配置生效。

## 使用 Apple 登录

### 前端使用

在登录页面，用户可以看到 Apple 登录按钮。点击后会跳转到 Apple 的授权页面。

```vue
<template>
    <button @click="signInWithApple">使用 Apple 登录</button>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const signInWithApple = async () => {
    await authClient.signIn.social({
        provider: "apple",
    });
};
</script>
```

### 使用 ID Token 登录（可选）

如果您已经有 Apple ID Token，可以直接使用：

```javascript
await authClient.signIn.social({
    provider: "apple",
    idToken: {
        token: "apple_id_token",
        nonce: "optional_nonce",
        accessToken: "optional_access_token",
    },
});
```

## 注意事项

1. **域名配置**：确保在 Apple Developer Portal 中配置的域名与实际部署的域名一致
2. **HTTPS 要求**：Apple 登录要求使用 HTTPS，本地开发可以使用 `localhost`
3. **JWT 过期**：客户端密钥 JWT 建议设置较长的过期时间（最长 6 个月）
4. **Bundle ID**：只有在使用 ID Token 登录时才需要配置 `APPLE_APP_BUNDLE_IDENTIFIER`
5. **隐私政策**：使用 Apple 登录需要提供隐私政策链接

## 故障排除

### 常见错误

1. **invalid_client**：检查 Service ID 和 JWT 配置是否正确
2. **invalid_redirect_uri**：确保回调 URL 在 Apple Developer Portal 中已正确配置
3. **invalid_grant**：检查 JWT 是否过期或签名是否正确

### 调试建议

1. 使用浏览器开发者工具查看网络请求
2. 检查 Apple Developer Portal 中的配置是否与环境变量一致
3. 验证 JWT payload 中的参数是否正确

## 参考资料

-   [Apple Developer Documentation - Sign In with Apple](https://developer.apple.com/documentation/sign_in_with_apple)
-   [Better Auth Apple Provider Documentation](https://better-auth.com/docs/social-providers/apple)
-   [JWT.io](https://jwt.io/) - JWT 调试工具
