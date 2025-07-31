# Twitter 登录配置指南

Twitter 登录适合社交媒体和内容分享类应用，提供丰富的用户社交信息。

## 前置要求

- 拥有 Twitter 账户
- 需要在 Twitter Developer Portal 创建应用
- 可能需要申请开发者账户

## 配置步骤

### 1. 申请 Twitter 开发者账户

1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 点击 **Apply for a developer account**
3. 选择账户用途（个人使用、公司等）
4. 填写详细的使用说明
5. 等待审核（通常几天到几周）

### 2. 创建新应用

审核通过后：

1. 登录 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. 点击 **Create App** 或 **+ Create App**
3. 填写应用信息：
   - **App Name**: `草梅Auth`
   - **App Description**: 应用描述
   - **Website URL**: `https://yourdomain.com`
   - **Tell us how this app will be used**: 详细说明应用用途

### 3. 配置应用设置

创建应用后：

1. 进入应用详情页面
2. 点击 **App Settings** 或齿轮图标
3. 在 **Authentication settings** 部分：
   - 勾选 **Enable 3-legged OAuth**
   - 在 **Callback URLs** 添加：
     - 生产环境：`https://yourdomain.com/api/auth/callback/twitter`
     - 开发环境：`http://localhost:3000/api/auth/callback/twitter`
   - 在 **Website URL** 填入：`https://yourdomain.com`
   - 在 **Terms of Service URL** 填入：`https://yourdomain.com/terms`
   - 在 **Privacy Policy URL** 填入：`https://yourdomain.com/privacy`
4. 点击 **Save**

### 4. 获取 API 密钥

1. 在应用详情页面，选择 **Keys and Tokens** 标签
2. 在 **Consumer Keys** 部分获取：
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
3. 如果需要，可以重新生成密钥

### 5. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Twitter 登录配置
TWITTER_CLIENT_ID=your_twitter_api_key
TWITTER_CLIENT_SECRET=your_twitter_api_secret
```

### 6. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Twitter 登录可以获取以下用户信息：

- 用户 ID 和用户名
- 显示名称
- 用户头像
- 个人简介
- 关注者数量
- 推文数量
- 账户创建时间

## API 版本说明

### Twitter API v1.1

传统的 OAuth 1.0a 认证：

- 需要 Consumer Key 和 Consumer Secret
- 复杂的签名机制
- 较为稳定但功能有限

### Twitter API v2

新的 OAuth 2.0 认证：

- 支持 PKCE
- 更简单的实现
- 更细粒度的权限控制

## 测试登录

1. 访问登录页面
2. 点击 Twitter 登录按钮
3. 在 Twitter 授权页面登录并授权
4. 成功登录后会跳转回应用

## 常见问题

### 1. Callback URL mismatch

**原因**: 回调 URL 不匹配

**解决方案**:
- 检查 Twitter Developer Portal 中的回调 URL 设置
- 确保 URL 完全匹配

### 2. Invalid consumer key

**原因**: API 密钥错误

**解决方案**:
- 检查环境变量是否正确设置
- 确认 API 密钥未过期或被撤销

### 3. App suspended

**原因**: 应用被暂停

**解决方案**:
- 检查是否违反了 Twitter 开发者政策
- 联系 Twitter 支持团队
- 确保应用符合使用条款

### 4. Rate limit exceeded

**原因**: API 调用频率超限

**解决方案**:
- 实现适当的缓存机制
- 减少 API 调用频率
- 考虑升级到更高级别的 API 访问

## 高级功能

### 获取推文权限

如果需要代表用户发推文：

```javascript
// 请求写入权限
const authUrl = await authClient.getAuthorizationUrl('twitter', {
  scope: 'read write'
});
```

### 访问用户推文

读取用户的推文和时间线：

```javascript
// 获取用户推文
const tweets = await twitterAPI.getUserTweets(userId);
```

### Webhook 集成

设置 Webhook 接收用户活动：

1. 在 Twitter Developer Portal 配置 Webhook URL
2. 处理各种事件（关注、推文等）
3. 验证 Webhook 签名

## 权限等级

### Essential Access

免费级别，包括：

- 基本用户信息
- 有限的 API 调用
- 基础功能

### Elevated Access

需要申请，包括：

- 更高的 API 限制
- 更多功能权限
- 历史数据访问

### Academic Research

学术研究专用：

- 大量历史数据
- 特殊的研究 API
- 需要学术机构验证

## 品牌指南

使用 Twitter 登录时的要求：

- **颜色**: 使用 Twitter 官方蓝色 `#1DA1F2`
- **图标**: 使用 Twitter 鸟类图标
- **文案**: "使用 Twitter 登录" 或 "Continue with Twitter"
- **按钮样式**: 遵循 Twitter 品牌指南

## 合规性考虑

### 数据使用政策

遵循 Twitter 的数据使用政策：

- 不得存储推文内容超过 30 天
- 尊重用户的删除请求
- 不得用于大规模数据挖掘

### 用户隐私

保护用户隐私：

- 明确告知数据用途
- 提供数据删除选项
- 符合 GDPR 等法规要求

## 监控和分析

### API 使用统计

在 Twitter Developer Portal 查看：

- API 调用次数
- 成功率和错误率
- 限制使用情况

### 用户分析

分析用户数据：

- 登录频率
- 用户地理分布
- 账户活跃度

## 相关链接

- [Twitter Developer Portal](https://developer.twitter.com/)
- [Twitter API 文档](https://developer.twitter.com/en/docs)
- [Twitter 开发者政策](https://developer.twitter.com/en/developer-terms)
- [Twitter 品牌指南](https://about.twitter.com/en/who-we-are/brand-toolkit)
