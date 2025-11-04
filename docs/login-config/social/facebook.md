# Facebook 登录配置指南

Facebook 覆盖全球用户，是常见的第三方登录选择。本文介绍如何在草梅 Auth 中完成 Facebook 登录集成。

## 前置要求

-   拥有 Facebook 开发者账号
-   已在 [Facebook for Developers](https://developers.facebook.com/) 创建应用
-   应用处于开发或正式发布状态

## 配置步骤

### 1. 创建或选择 Facebook 应用

1. 登录 [Facebook Developer Portal](https://developers.facebook.com/apps/)
2. 点击 **Create App** 创建新应用，或选择已有应用
3. 选择 **Consumer** 应用类型并完成基础信息填写
4. 在应用面板中启用 **Facebook Login** 产品

### 2. 配置 OAuth 回调地址

1. 在左侧菜单中选择 **Facebook Login > Settings**
2. 在 **Valid OAuth Redirect URIs** 字段中添加：
    - 本地开发：`http://localhost:3000/api/auth/callback/facebook`
    - 生产环境：`https://your-domain.com/api/auth/callback/facebook`
3. 如果修改了项目中的 Better Auth 基础路由，请同步更新上述回调地址

> ⚠️ **提醒**：回调地址必须完全匹配（含协议、域名、端口、路径），否则会出现 `redirect_uri_mismatch` 错误。

### 3. 获取客户端凭据

在 **App Settings > Basic** 页面获取以下信息：

-   **App ID**：对应 `FACEBOOK_CLIENT_ID`
-   **App Secret**：对应 `FACEBOOK_CLIENT_SECRET`

请妥善保管 App Secret，避免在前端代码中暴露。

### 4. 配置环境变量

在项目的 `.env` 或部署平台的环境变量中添加：

```env
# Facebook 登录配置
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# 可选配置（逗号分隔）
FACEBOOK_SCOPES=email,public_profile
FACEBOOK_FIELDS=id,name,email,picture

# Facebook Login for Business (可选)
FACEBOOK_CONFIG_ID=your_facebook_config_id
```

-   `FACEBOOK_SCOPES`：覆盖默认权限（默认为 `email,public_profile`）
-   `FACEBOOK_FIELDS`：扩展需要获取的用户字段
-   `FACEBOOK_CONFIG_ID`：用于 Facebook Login for Business 配置

更新环境变量后，请重启应用使配置生效。

## 登录流程

前端可通过 better-auth 的 `signIn.social` 方法触发 Facebook 登录：

```typescript
const data = await authClient.signIn.social({
    provider: "facebook",
});
```

如需使用已有的 Facebook 令牌登录，可传入 ID Token 或 Access Token：

```typescript
const data = await authClient.signIn.social({
    provider: "facebook",
    idToken: {
        token: idToken,
        accessToken,
    },
});
```

当提供 `idToken` 时不会发生重定向，适合配合移动端/客户端 SDK 使用。

## 常见问题

### App 未通过审核

-   如访问权限受限，请确保应用已提交审核并获得所需权限
-   开发模式下仅测试用户可以登录，请在 Facebook 后台添加测试账号

### `redirect_uri_mismatch`

-   确保回调地址与 Facebook 后台配置完全一致
-   本地开发与生产环境需要分别配置不同的地址

### `Invalid Scopes` 或权限不足

-   检查 `FACEBOOK_SCOPES` 是否填写正确
-   确认所请求的权限已通过 Facebook 审核

## 安全建议

-   使用 HTTPS 作为生产环境回调地址
-   定期轮换 `FACEBOOK_CLIENT_SECRET`
-   不要在客户端代码或日志中泄露敏感凭据

## 相关资源

-   [Facebook Login 官方文档](https://developers.facebook.com/docs/facebook-login/)
-   [Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
-   [Better Auth - Facebook Provider](https://www.better-auth.com/docs/social/facebook)
