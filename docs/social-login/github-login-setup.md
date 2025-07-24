# GitHub 登录配置指南

GitHub 是开发者首选的社交登录提供商，配置简单，用户基数大。

## 前置要求

-   拥有 GitHub 账户
-   需要创建 GitHub OAuth App

## 配置步骤

### 1. 创建 GitHub OAuth App

1. 登录 [GitHub](https://github.com)
2. 点击右上角头像，选择 **Settings**
3. 在左侧菜单中选择 **Developer settings**
4. 选择 **OAuth Apps**
5. 点击 **New OAuth App** 按钮

### 2. 填写应用信息

在创建应用页面填写以下信息：

-   **Application name**: `草梅Auth` (或您的应用名称)
-   **Homepage URL**: `https://yourdomain.com` (您的应用主页)
-   **Application description**: 应用描述(可选)
-   **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`

> **本地开发时**: 回调 URL 使用 `http://localhost:3000/api/auth/callback/github`

### 3. 获取客户端凭据

创建应用后，您将获得：

-   **Client ID**: 公开的应用标识符
-   **Client Secret**: 保密的应用密钥(点击 Generate a new client secret 生成)

### 4. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# GitHub 登录配置
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 5. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

GitHub 登录默认获取以下用户信息：

-   基本个人信息(用户名、头像等)
-   邮箱地址(如果公开)
-   用户 ID

## 测试登录

1. 访问登录页面
2. 点击 GitHub 登录按钮
3. 在 GitHub 授权页面点击 **Authorize**
4. 成功登录后会跳转回应用

## 安全注意事项

### 生产环境

1. **使用 HTTPS**: GitHub 要求生产环境必须使用 HTTPS
2. **保护密钥**: 确保 Client Secret 安全存储，不要提交到代码仓库
3. **回调 URL**: 确保回调 URL 精确匹配，避免重定向攻击

### 开发环境

1. **本地回调**: 开发时可以使用 `http://localhost:3000`
2. **多环境**: 可以为不同环境创建不同的 OAuth App

## 常见问题

### 1. redirect_uri_mismatch 错误

**原因**: 回调 URL 不匹配

**解决方案**:

-   检查 GitHub OAuth App 中配置的回调 URL
-   确保 URL 完全匹配(包括协议、域名、端口、路径)

### 2. invalid_client_id 错误

**原因**: Client ID 错误或未设置

**解决方案**:

-   检查环境变量 `GITHUB_CLIENT_ID` 是否正确
-   确保没有多余的空格或特殊字符

### 3. invalid_client_secret 错误

**原因**: Client Secret 错误

**解决方案**:

-   检查环境变量 `GITHUB_CLIENT_SECRET` 是否正确
-   在 GitHub OAuth App 设置中重新生成 Client Secret

### 4. 无法获取邮箱地址

**原因**: 用户的邮箱设置为私有

**解决方案**:

-   GitHub 用户可以在设置中将邮箱设为公开
-   应用需要处理没有邮箱的情况，自动生成临时邮箱

## GitHub OAuth App 管理

### 查看应用统计

在 GitHub OAuth App 设置页面可以查看：

-   用户授权数量
-   授权用户列表
-   API 使用统计

### 撤销用户授权

用户可以在 GitHub 设置中撤销对应用的授权：

1. 进入 GitHub **Settings**
2. 选择 **Applications**
3. 在 **Authorized OAuth Apps** 中找到应用
4. 点击 **Revoke** 撤销授权

### 更新应用设置

可以随时在 GitHub OAuth App 设置中更新：

-   应用名称和描述
-   主页 URL
-   回调 URL
-   重新生成 Client Secret

## 品牌指南

使用 GitHub 登录按钮时的建议：

-   **颜色**: 使用 GitHub 官方黑色 `#24292e`
-   **图标**: 使用 GitHub 官方图标
-   **文案**: "继续使用 GitHub" 或 "GitHub 登录"
-   **样式**: 遵循 GitHub 的品牌规范

## 高级配置

### 请求额外权限

如果需要访问用户的仓库、组织等信息，可以请求额外的权限范围：

```javascript
// 在前端请求时指定额外权限
await authClient.signIn.social({
    provider: "github",
    scope: "user:email repo",
});
```

常用权限范围：

-   `user:email`: 访问私有邮箱地址
-   `read:user`: 读取用户配置信息
-   `repo`: 访问公开和私有仓库
-   `read:org`: 读取组织信息

### Webhook 配置

GitHub OAuth App 支持 Webhook，可以接收用户授权变更通知：

1. 在 OAuth App 设置中添加 Webhook URL
2. 配置需要接收的事件类型
3. 处理 Webhook 请求验证和事件

## 相关链接

-   [GitHub OAuth App 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
-   [GitHub API 文档](https://docs.github.com/en/rest)
-   [GitHub OAuth 权限范围](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
