# Twitter (X) 登录配置指南

本指南将帮助您在草梅 Auth 中配置 Twitter 登录功能。

## 前置要求

-   有效的 Twitter Developer 账户
-   通过 Twitter Developer Portal 的申请审核

## 配置步骤

### 1. 申请 Twitter Developer 账户

1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 使用您的 Twitter 账户登录
3. 申请开发者权限（可能需要等待审核）

### 2. 创建 Twitter 应用

1. 登录 Twitter Developer Portal 后，进入 [Apps](https://developer.twitter.com/en/portal/projects-and-apps) 页面
2. 点击 "Create App" 按钮
3. 填写应用信息：
    - **App name**: 您的应用名称（如 "草梅 Auth"）
    - **App description**: 应用描述
    - **Website URL**: 您的应用网站地址
    - **Callback URL**: 设置回调地址
        - 本地开发：`http://localhost:3000/api/auth/callback/twitter`
        - 生产环境：`https://yourdomain.com/api/auth/callback/twitter`

### 3. 获取 API 凭据

1. 在应用详情页面，进入 "Keys and tokens" 选项卡
2. 找到 "Consumer Keys" 部分
3. 记录以下信息：
    - **API Key** (Client ID)
    - **API Key Secret** (Client Secret)

### 4. 配置应用权限

1. 在应用设置中，确保启用了以下权限：

    - **Read** 权限（用于获取用户基本信息）
    - **Request email from users** (如果需要获取用户邮箱)

2. 在 "Authentication settings" 中：
    - 启用 "3-legged OAuth"
    - 设置正确的回调 URL
    - 启用 "Request email from users" (重要：用于获取用户邮箱地址)

### 5. 配置环境变量

在您的 `.env` 文件中添加以下配置：

```env
# Twitter 登录配置
TWITTER_CLIENT_ID=your_twitter_api_key       # Twitter API Key
TWITTER_CLIENT_SECRET=your_twitter_api_secret # Twitter API Key Secret
```

### 6. 重启应用

配置完成后，重启您的应用以使配置生效。

## 使用 Twitter 登录

### 前端使用

在登录页面，用户可以看到 Twitter 登录按钮。点击后会跳转到 Twitter 的授权页面。

```vue
<template>
    <button @click="signInWithTwitter">
        <i class="mdi mdi-twitter"></i>
        使用 Twitter 登录
    </button>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const signInWithTwitter = async () => {
    await authClient.signIn.social({
        provider: "twitter",
    });
};
</script>
```

### 服务器端 API

Twitter 登录会自动通过 Better Auth 的社交登录机制处理。用户授权后会返回到您设置的回调 URL。

## 重要说明

### Twitter API v2 特性

-   **邮箱支持**: Twitter API v2 现在支持获取用户邮箱地址
-   **必须启用邮箱权限**: 确保在应用设置中启用了 "Request email from users"
-   **作用域**: Better Auth 会自动请求必要的用户信息作用域

### 回调 URL 配置

确保在 Twitter Developer Portal 中配置的回调 URL 与您的应用完全匹配：

-   **开发环境**: `http://localhost:3000/api/auth/callback/twitter`
-   **生产环境**: `https://yourdomain.com/api/auth/callback/twitter`

如果您修改了 Better Auth 的路由基础路径，请相应更新回调 URL。

## 故障排除

### 常见错误

1. **401 Unauthorized**

    - 检查 API Key 和 Secret 是否正确
    - 确保应用已启用 OAuth 1.0a

2. **403 Forbidden**

    - 检查回调 URL 是否正确配置
    - 确保应用已获得必要的权限

3. **无法获取邮箱**
    - 确保在 Twitter 应用设置中启用了 "Request email from users"
    - 检查用户的 Twitter 账户是否验证了邮箱

### 调试步骤

1. 检查 Twitter Developer Portal 中的应用配置
2. 验证环境变量是否正确设置
3. 查看浏览器开发者工具中的网络请求
4. 检查服务器日志中的错误信息

## Twitter 品牌指南

使用 Twitter 登录时，请遵循 [Twitter 品牌指南](https://about.twitter.com/en/who-we-are/brand-toolkit)：

-   使用官方的 Twitter 颜色：#1da1f2
-   使用正确的 Twitter 图标
-   按钮文案建议使用 "Continue with Twitter" 或 "Sign in with Twitter"

## API 限制

-   Twitter API 有速率限制，请注意不要过于频繁地调用
-   免费账户有一定的请求限制
-   确保合规使用 Twitter 用户数据

## 参考资料

-   [Twitter Developer Documentation](https://developer.twitter.com/en/docs)
-   [Twitter API v2](https://developer.twitter.com/en/docs/api-reference-index)
-   [Better Auth Twitter Provider](https://better-auth.com/docs/social-providers/twitter)
-   [Twitter OAuth 1.0a](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
