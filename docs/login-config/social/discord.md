# Discord 登录配置指南

Discord 是流行的游戏和社区聊天平台，适合游戏和社区类应用。

## 前置要求

- 拥有 Discord 账户
- 需要在 Discord Developer Portal 创建应用

## 配置步骤

### 1. 访问 Discord Developer Portal

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 使用您的 Discord 账户登录

### 2. 创建新应用

1. 点击 **New Application** 按钮
2. 输入应用名称：`草梅Auth`
3. 阅读并同意开发者服务条款
4. 点击 **Create**

### 3. 配置应用信息

在 **General Information** 页面：

1. 上传应用图标（可选）
2. 添加应用描述
3. 设置应用标签（可选）

### 4. 配置 OAuth2 设置

1. 在左侧菜单选择 **OAuth2** > **General**
2. 在 **Redirects** 部分添加重定向 URI：
   - 生产环境：`https://yourdomain.com/api/auth/callback/discord`
   - 开发环境：`http://localhost:3000/api/auth/callback/discord`
3. 点击 **Save Changes**

### 5. 获取客户端凭据

在 **OAuth2** > **General** 页面获取：

- **Client ID**: 应用的客户端 ID
- **Client Secret**: 点击 **Reset Secret** 生成新密钥

### 6. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Discord 登录配置
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 7. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Discord 登录默认获取以下用户信息：

- 用户 ID 和用户名
- 用户头像
- 邮箱地址（如果用户选择分享）
- Discord 标签（如 User#1234）

## 可用的权限范围

```javascript
// 可以请求的权限范围
const scopes = [
    'identify',          // 基本用户信息
    'email',            // 邮箱地址
    'guilds',           // 用户所在的服务器
    'guilds.join',      // 让用户加入服务器
    'connections',      // 用户的第三方连接
    'bot'              // 添加机器人到服务器
];
```

## 测试登录

1. 访问登录页面
2. 点击 Discord 登录按钮
3. 在 Discord 授权页面登录并授权
4. 成功登录后会跳转回应用

## 常见问题

### 1. Invalid OAuth2 redirect_uri

**原因**: 重定向 URI 不匹配

**解决方案**:
- 检查 Discord Developer Portal 中的重定向 URI 配置
- 确保 URI 完全匹配

### 2. Invalid client credentials

**原因**: 客户端 ID 或密钥错误

**解决方案**:
- 检查环境变量是否正确设置
- 重新生成客户端密钥

## 品牌指南

使用 Discord 登录时的建议：

- **颜色**: 使用 Discord 官方颜色 `#5865F2`
- **图标**: 使用 Discord 官方图标
- **文案**: "使用 Discord 登录" 或 "继续使用 Discord"

## 相关链接

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord OAuth2 文档](https://discord.com/developers/docs/topics/oauth2)
