# 社交登录配置指南

草梅 Auth 支持多种社交登录提供商，本文档将详细介绍如何配置各个提供商。

## 支持的登录提供商

### 内置社交登录提供商（Better Auth 原生支持）

-   **GitHub** - 开发者首选
-   **Google** - 全球最大用户群
-   **Microsoft** - 企业用户友好
-   **Discord** - 游戏社区用户
-   **Apple** - iOS 用户必备
-   **Twitter (X)** - 社交媒体用户

### 自定义 OAuth2 提供商

-   **微博** - 中国主流社交媒体
-   **QQ** - 中国最大即时通讯平台
-   **微信** - 中国最大社交平台
-   **抖音** - 中国最大短视频平台

### 匿名登录

-   **匿名登录** - 无需注册直接体验

## 快速配置

### 1. 环境变量配置

在 `.env` 文件中添加对应提供商的配置：

```env
# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Apple
APPLE_CLIENT_ID=your_apple_service_id
APPLE_CLIENT_SECRET=your_apple_client_secret_jwt
APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.yourapp

# Twitter
TWITTER_CLIENT_ID=your_twitter_api_key
TWITTER_CLIENT_SECRET=your_twitter_api_secret

# 微博
WEIBO_CLIENT_ID=your_weibo_client_id
WEIBO_CLIENT_SECRET=your_weibo_client_secret
# 可选：邮箱权限
WEIBO_SCOPES=email

# QQ
QQ_CLIENT_ID=your_qq_client_id
QQ_CLIENT_SECRET=your_qq_client_secret
# 可选：使用 UnionID
QQ_USE_UNIONID=true

# 微信
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://localhost:3000/api/auth/oauth2/callback/wechat

# 抖音
DOUYIN_CLIENT_KEY=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret

# 匿名登录
ANONYMOUS_LOGIN_ENABLED=true
```

### 2. 重启应用

配置完环境变量后，重启应用以使配置生效。

## 详细配置指南

每个提供商都有独特的配置要求，请查看对应的详细指南：

-   [GitHub 登录配置](./github-login-setup.md)
-   [Google 登录配置](./google-login-setup.md)
-   [Microsoft 登录配置](./microsoft-login-setup.md)
-   [Discord 登录配置](./discord-login-setup.md)
-   [Apple 登录配置](./apple-login-setup.md)
-   [Twitter 登录配置](./twitter-login-setup.md)
-   [微博登录配置](./weibo-login-setup.md)
-   [QQ 登录配置](./qq-login-setup.md)
-   [微信登录配置](./wechat-login-setup.md)
-   [抖音登录配置](./douyin-login-setup.md)

## 前端使用

### 社交登录按钮

登录页面会自动显示已配置的社交登录选项：

```vue
<template>
    <div class="social-login-buttons">
        <!-- 按钮会根据配置的提供商自动显示 -->
        <button
            v-for="provider in socialProviders"
            :key="provider.provider"
            @click="signInWith(provider.provider)"
            :style="{ backgroundColor: provider.color }"
        >
            <i :class="provider.icon"></i>
            {{ provider.name }}
        </button>
    </div>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const { data: socialProviders } = await useFetch("/api/social/providers");

const signInWith = async (provider) => {
    await authClient.signIn.social({ provider });
};
</script>
```

### 程序化调用

您也可以直接调用特定的登录提供商：

```javascript
// GitHub
await authClient.signIn.social({ provider: "github" });

// Google
await authClient.signIn.social({ provider: "google" });

// 微信
await authClient.signIn.social({ provider: "wechat" });

// Apple ID Token 登录
await authClient.signIn.social({
    provider: "apple",
    idToken: {
        token: "apple_id_token",
        nonce: "optional_nonce",
    },
});

// 匿名登录
await authClient.signIn.anonymous();
```

## 回调 URL 配置

所有社交登录提供商都需要配置正确的回调 URL：

### 标准格式

```
https://yourdomain.com/api/auth/callback/{provider}
```

### 具体示例

-   GitHub: `https://yourdomain.com/api/auth/callback/github`
-   Google: `https://yourdomain.com/api/auth/callback/google`
-   Microsoft: `https://yourdomain.com/api/auth/callback/microsoft`
-   Discord: `https://yourdomain.com/api/auth/callback/discord`
-   Apple: `https://yourdomain.com/api/auth/callback/apple`
-   Twitter: `https://yourdomain.com/api/auth/callback/twitter`

### 自定义 OAuth2 提供商

-   微博: `https://yourdomain.com/api/auth/oauth2/callback/weibo`
-   QQ: `https://yourdomain.com/api/auth/oauth2/callback/qq`
-   微信: `https://yourdomain.com/api/auth/oauth2/callback/wechat`
-   抖音: `https://yourdomain.com/api/auth/oauth2/callback/douyin`

### 本地开发

本地开发时使用 `http://localhost:3000` 替换 `https://yourdomain.com`。

## 账户关联

草梅 Auth 支持将多个社交账户关联到同一个用户：

### 自动关联

-   当用户使用相同邮箱地址的不同社交账户登录时，系统会自动关联
-   支持不同邮箱地址的账户关联（需要手动确认）

### 手动关联

用户可以在个人中心页面手动关联更多的社交账户。

## 隐私和安全

### 数据获取权限

不同提供商提供不同级别的用户数据：

| 提供商    | 基本信息 | 邮箱 | 头像 | 备注                         |
| --------- | -------- | ---- | ---- | ---------------------------- |
| GitHub    | ✓        | ✓    | ✓    | -                            |
| Google    | ✓        | ✓    | ✓    | -                            |
| Microsoft | ✓        | ✓    | ✓    | -                            |
| Discord   | ✓        | ✓    | ✓    | -                            |
| Apple     | ✓        | ✓    | ✓    | 隐私保护较强                 |
| Twitter   | ✓        | ✓    | ✓    | 需要申请邮箱权限             |
| 微博      | ✓        | 可选 | ✓    | 邮箱需要额外申请             |
| QQ        | ✓        | ✗    | ✓    | 不提供邮箱信息，支持 UnionID |
| 微信      | ✓        | ✗    | ✓    | 不提供邮箱信息，支持 UnionID |
| 抖音      | ✓        | ✗    | ✓    | 不提供邮箱信息               |

### 临时邮箱处理

对于不提供邮箱的社交账户，系统会自动生成临时邮箱地址：

-   格式：`{snowflake_id}@example.com`
-   用户可以稍后在个人中心更新为真实邮箱

## 错误排除

### 常见错误

1. **invalid_client_id**: 检查客户端 ID 是否正确
2. **invalid_redirect_uri**: 检查回调 URL 是否匹配
3. **scope_error**: 检查请求的权限范围
4. **network_error**: 检查网络连接和防火墙设置

### 调试技巧

1. 查看浏览器开发者工具的网络面板
2. 检查服务器日志
3. 验证环境变量设置
4. 使用提供商的开发者工具进行测试

## 生产环境注意事项

1. **HTTPS 要求**: 大部分提供商要求生产环境使用 HTTPS
2. **域名验证**: 确保在提供商平台验证了域名
3. **速率限制**: 注意各提供商的 API 调用限制
4. **隐私政策**: 确保应用有完整的隐私政策
5. **合规性**: 遵守各地区的数据保护法规

## 品牌指南

使用社交登录时，请遵循各提供商的品牌指南：

-   使用官方提供的颜色和图标
-   遵循推荐的按钮文案
-   保持品牌一致性

## 性能优化

1. **按需加载**: 只加载已配置的提供商
2. **缓存策略**: 合理缓存用户信息
3. **异步处理**: 使用异步方式处理登录流程
4. **错误处理**: 提供友好的错误提示

## 技术支持

如果在配置过程中遇到问题：

1. 查看对应提供商的详细配置文档
2. 检查 GitHub Issues 中的相关讨论
3. 在 Discussions 中提问
4. 提交新的 Issue 报告问题
