# Google 登录配置指南

Google 拥有全球最大的用户群体，是最重要的社交登录提供商之一。

## 前置要求

- 拥有 Google 账户
- 需要在 Google Cloud Console 中创建项目和 OAuth 2.0 客户端

## 配置步骤

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 登录您的 Google 账户
3. 点击顶部的项目选择器
4. 点击 **新建项目**
5. 输入项目名称(如 `caomei-auth`)
6. 选择组织(如果有)
7. 点击 **创建**

### 2. 启用 Google+ API

1. 在 Google Cloud Console 中选择您的项目
2. 在左侧菜单中选择 **API 和服务** > **库**
3. 搜索 "Google+ API" 或 "People API"
4. 点击进入，然后点击 **启用**

### 3. 配置 OAuth 同意屏幕

1. 在左侧菜单中选择 **API 和服务** > **OAuth 同意屏幕**
2. 选择用户类型：
    - **内部**: 仅供 Google Workspace 组织内用户使用
    - **外部**: 供所有 Google 用户使用
3. 填写应用信息：
    - **应用名称**: `草梅Auth`
    - **用户支持电子邮件**: 您的邮箱地址
    - **应用徽标**: 可选，上传应用图标
    - **应用主页链接**: `https://yourdomain.com`
    - **应用隐私政策链接**: `https://yourdomain.com/privacy`
    - **应用服务条款链接**: `https://yourdomain.com/terms`
    - **已获授权的域名**: 添加您的域名(如 `yourdomain.com`)
4. 在 **范围** 部分，添加以下范围：
    - `../auth/userinfo.email`
    - `../auth/userinfo.profile`
    - `openid`
5. 保存并继续

### 4. 创建 OAuth 2.0 客户端 ID

1. 在左侧菜单中选择 **API 和服务** > **凭据**
2. 点击 **创建凭据** > **OAuth 客户端 ID**
3. 选择应用类型：**Web 应用**
4. 输入名称：`草梅Auth Web客户端`
5. 配置重定向 URI：
    - **已获授权的重定向 URI**: `https://yourdomain.com/api/auth/callback/google`
    - 本地开发时添加: `http://localhost:3000/api/auth/callback/google`
6. 点击 **创建**

### 5. 获取客户端凭据

创建成功后，您将获得：

- **客户端 ID**: 以 `.apps.googleusercontent.com` 结尾
- **客户端密钥**: 一个随机生成的字符串

### 6. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Google 登录配置
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 7. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Google 登录默认获取以下用户信息：

- 基本个人信息(姓名、头像等)
- 邮箱地址
- 用户 ID
- 个人资料信息

## 测试登录

1. 访问登录页面
2. 点击 Google 登录按钮
3. 在 Google 授权页面选择账户并点击 **允许**
4. 成功登录后会跳转回应用

## 发布到生产环境

### 验证状态

Google OAuth 应用有以下状态：

1. **测试**: 只有添加到测试用户列表中的用户可以登录
2. **发布**: 任何 Google 用户都可以登录

### 发布流程

1. 确保 OAuth 同意屏幕信息完整
2. 在 **OAuth 同意屏幕** 页面点击 **发布应用**
3. 如果应用需要敏感权限，可能需要 Google 审核
4. 审核通过后，应用将对所有用户开放

### 添加测试用户

在发布前，可以添加测试用户：

1. 在 **OAuth 同意屏幕** 页面
2. 滚动到 **测试用户** 部分
3. 点击 **添加用户**
4. 输入测试用户的 Google 邮箱地址

## 安全注意事项

### 生产环境

1. **域名验证**: 确保在 Google Cloud Console 中添加了正确的授权域名
2. **HTTPS 要求**: 生产环境必须使用 HTTPS
3. **保护密钥**: 确保 Client Secret 安全存储
4. **定期更新**: 定期更新客户端密钥

### 监控和日志

1. 在 Google Cloud Console 中监控 API 使用情况
2. 查看登录统计和错误日志
3. 设置配额和限制

## 常见问题

### 1. redirect_uri_mismatch 错误

**原因**: 重定向 URI 不匹配

**解决方案**:
- 检查 Google Cloud Console 中配置的重定向 URI
- 确保 URI 完全匹配(包括协议、域名、端口、路径)
- 本地开发时确保使用 `http://localhost:3000`

### 2. invalid_client_id 错误

**原因**: 客户端 ID 错误或未启用 API

**解决方案**:
- 检查环境变量 `GOOGLE_CLIENT_ID` 是否正确
- 确保已启用 Google+ API 或 People API
- 检查项目是否正确选择

### 3. access_denied 错误

**原因**: 用户拒绝授权或应用未发布

**解决方案**:
- 确保应用已发布或用户在测试用户列表中
- 检查 OAuth 同意屏幕配置是否完整
- 确保请求的权限范围正确

### 4. 应用需要验证

**原因**: 应用请求了敏感权限需要 Google 审核

**解决方案**:
- 减少不必要的权限请求
- 提交应用给 Google 审核
- 在审核期间使用测试用户

## Google 品牌指南

使用 Google 登录按钮时的要求：

- **颜色**: 使用 Google 官方蓝色 `#4285f4`
- **图标**: 使用 Google "G" 图标
- **文案**: "使用 Google 帐户登录" 或 "继续使用 Google"
- **按钮样式**: 遵循 Google 登录按钮设计指南

## 高级配置

### 请求额外权限

如果需要访问用户的 Gmail、Drive 等服务，可以请求额外权限：

```javascript
// 请求额外权限
await authClient.signIn.social({
    provider: "google",
    scope: "openid profile email https://www.googleapis.com/auth/drive.readonly",
});
```

常用权限范围：
- `https://www.googleapis.com/auth/drive.readonly`: 只读访问 Google Drive
- `https://www.googleapis.com/auth/gmail.readonly`: 只读访问 Gmail
- `https://www.googleapis.com/auth/calendar.readonly`: 只读访问 Google Calendar

### 获取刷新令牌

如果需要长期访问用户数据，需要配置刷新令牌：

```javascript
await authClient.signIn.social({
    provider: "google",
    accessType: "offline", // 获取刷新令牌
    prompt: "consent", // 强制显示同意屏幕
});
```

## API 配额和限制

### 默认配额

Google API 有默认的请求配额：
- 每天 10,000 次请求
- 每 100 秒 100 次请求
- 每用户每 100 秒 50 次请求

### 增加配额

如果需要更高配额：
1. 在 Google Cloud Console 中申请配额增加
2. 或者启用计费账户获得更高配额

## 相关链接

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google 登录按钮指南](https://developers.google.com/identity/branding-guidelines)
- [Google API 权限范围](https://developers.google.com/identity/protocols/oauth2/scopes)
