# Discord 登录配置指南

Discord 是游戏社区用户最喜欢的平台，为游戏相关应用提供了很好的用户基础。

## 前置要求

-   拥有 Discord 账户
-   需要在 Discord Developer Portal 中创建应用程序

## 配置步骤

### 1. 访问 Discord Developer Portal

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 使用您的 Discord 账户登录

### 2. 创建新应用程序

1. 点击 **New Application** 按钮
2. 输入应用程序名称: `草梅Auth`
3. 阅读并同意 Discord 开发者条款
4. 点击 **Create**

### 3. 配置基本信息

在 **General Information** 页面：

1. **Name**: `草梅Auth` (应用名称)
2. **Description**: 填写应用描述(可选)
3. **App Icon**: 上传应用图标(可选)
4. **Tags**: 添加相关标签(可选)

### 4. 配置 OAuth2

1. 在左侧菜单中选择 **OAuth2**
2. 在 **General** 标签页：
    - 复制 **Client ID** (稍后需要)
    - 复制 **Client Secret** (点击 Reset Secret 生成新密钥)

### 5. 配置重定向 URI

在 **OAuth2** > **General** 页面：

1. 在 **Redirects** 部分点击 **Add Redirect**
2. 添加重定向 URI:
    - 生产环境: `https://yourdomain.com/api/auth/callback/discord`
    - 本地开发: `http://localhost:3000/api/auth/callback/discord`
3. 点击 **Save Changes**

### 6. 配置权限范围

在 **OAuth2** > **URL Generator** 页面：

1. 在 **Scopes** 部分选择：
    - `identify`: 获取用户基本信息
    - `email`: 获取用户邮箱地址
2. 在 **Bot Permissions** 部分(如果需要机器人功能)选择相应权限
3. 复制生成的授权 URL 用于测试

### 7. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Discord 登录配置
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 8. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Discord 登录可以获取的用户信息：

### 基础权限 (identify)

-   用户 ID
-   用户名
-   头像
-   标识符(#后的数字)
-   账户创建时间

### 邮箱权限 (email)

-   邮箱地址
-   邮箱验证状态

### 其他可选权限

-   `guilds`: 用户加入的服务器列表
-   `guilds.join`: 代表用户加入服务器
-   `gdm.join`: 加入群组私信
-   `connections`: 用户的第三方账户连接

## 测试登录

1. 访问登录页面
2. 点击 Discord 登录按钮
3. 在 Discord 授权页面点击 **授权**
4. 成功登录后会跳转回应用

## 应用验证和发布

### 开发状态

默认情况下，Discord 应用处于开发模式，有以下限制：

-   最多 100 个用户可以授权
-   不需要验证过程

### 申请验证

当用户数量接近 100 时，需要申请验证：

1. 在 Discord Developer Portal 中选择您的应用
2. 前往 **App Verification** 页面
3. 填写验证申请表
4. 提交应用进行审核

### 验证要求

Discord 验证需要满足：

-   应用有清晰的用途说明
-   遵循 Discord 社区准则
-   有完整的隐私政策和服务条款
-   用户体验良好

## 安全注意事项

### 生产环境

1. **HTTPS 要求**: 生产环境必须使用 HTTPS
2. **密钥安全**: 保护 Client Secret，不要提交到代码仓库
3. **权限最小化**: 只请求必要的权限范围
4. **定期轮换**: 定期更新 Client Secret

### 开发环境

1. **本地测试**: 可以使用 `http://localhost` 进行本地测试
2. **沙盒环境**: Discord 没有单独的沙盒环境
3. **调试模式**: 使用 Discord 开发者模式进行调试

## 常见问题

### 1. invalid_request: Invalid redirect_uri

**原因**: 重定向 URI 不匹配

**解决方案**:

-   检查 Discord Developer Portal 中配置的重定向 URI
-   确保 URI 完全匹配(区分大小写)
-   检查协议(http/https)是否正确

### 2. unauthorized_client: Invalid client_id

**原因**: 客户端 ID 错误

**解决方案**:

-   检查环境变量 `DISCORD_CLIENT_ID` 是否正确
-   确认客户端 ID 没有额外空格
-   在 Discord Developer Portal 中重新复制 Client ID

### 3. invalid_client: Invalid client_secret

**原因**: 客户端密钥错误

**解决方案**:

-   检查环境变量 `DISCORD_CLIENT_SECRET` 是否正确
-   在 Discord Developer Portal 中重新生成 Client Secret
-   确保复制完整的密钥

### 4. access_denied: User denied authorization

**原因**: 用户拒绝授权

**解决方案**:

-   这是正常行为，用户有权拒绝授权
-   确保权限请求合理，不要请求不必要的权限
-   提供清晰的权限说明

## Discord 品牌指南

使用 Discord 登录按钮时的建议：

-   **颜色**: 使用 Discord 官方紫色 `#7289da`
-   **图标**: 使用 Discord 官方图标
-   **文案**: "使用 Discord 登录" 或 "继续使用 Discord"
-   **按钮设计**: 遵循 Discord 品牌指南

## 高级配置

### 机器人功能

如果您的应用需要机器人功能：

1. 在左侧菜单中选择 **Bot**
2. 点击 **Add Bot** 创建机器人
3. 配置机器人权限和意图
4. 获取机器人令牌用于 API 调用

### Webhook 配置

Discord 支持 Webhook 用于接收事件通知：

1. 在应用设置中配置 Webhook URL
2. 设置需要接收的事件类型
3. 处理 Webhook 请求验证

### 富文本活动

Discord 支持富文本活动显示：

```javascript
// 设置用户活动状态
await discordClient.setActivity({
    details: "正在使用草梅Auth",
    state: "已登录",
    startTimestamp: Date.now(),
});
```

## Discord API 使用

### 获取用户信息

```javascript
// 使用访问令牌调用 Discord API
const userInfo = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
        Authorization: `Bearer ${accessToken}`,
    },
});

const userData = await userInfo.json();
```

### 获取用户服务器

```javascript
// 获取用户加入的服务器
const guilds = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: {
        Authorization: `Bearer ${accessToken}`,
    },
});
```

## 速率限制

Discord API 有严格的速率限制：

-   全局速率限制: 每秒 50 次请求
-   端点特定限制: 根据端点不同
-   429 响应: 超过限制时返回重试时间

### 处理速率限制

```javascript
// 实现重试逻辑
async function apiCall(url, options, retries = 3) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            if (retries > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, retryAfter * 1000)
                );
                return apiCall(url, options, retries - 1);
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
}
```

## 社区和支持

### Discord 开发者社区

-   [Discord Developers](https://discord.gg/discord-developers): 官方开发者服务器
-   [Discord API 文档](https://discord.com/developers/docs): 完整的 API 文档
-   [Discord Developer Portal](https://discord.com/developers/applications): 应用管理

### 最佳实践

1. **用户体验**: 提供清晰的权限说明
2. **错误处理**: 优雅处理授权错误
3. **数据安全**: 安全存储用户数据
4. **社区规则**: 遵循 Discord 社区准则

## 相关链接

-   [Discord Developer Documentation](https://discord.com/developers/docs)
-   [Discord Developer Portal](https://discord.com/developers/applications)
-   [Discord API 库](https://discord.com/developers/docs/topics/community-resources#libraries)
-   [Discord 品牌资源](https://discord.com/branding)
