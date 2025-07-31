# 登录配置

草梅 Auth 支持多种登录方式，您可以根据需要启用和配置不同的登录选项。

## 支持的登录方式

### 基础登录方式

#### [邮箱登录配置](./email-login)
- 邮箱 + 密码登录
- 邮箱验证码登录
- 邮件服务配置

#### [短信登录配置](./sms-login)  
- 手机号 + 密码登录
- 短信验证码登录
- 短信服务配置

#### [匿名登录配置](./anonymous-login)
- 临时账号登录
- 游客模式访问

### 社交登录方式

#### 内置提供商
- [GitHub](./social/github) - 开发者友好的登录方式
- [Google](./social/google) - 最广泛使用的社交登录
- [Microsoft](./social/microsoft) - 企业级应用集成
- [Discord](./social/discord) - 游戏和社区应用
- [Apple](./social/apple) - iOS 生态集成
- [Twitter](./social/twitter) - 社交媒体集成

#### 自定义提供商
- [微博](./social/weibo) - 中国主流社交平台
- [QQ](./social/qq) - 腾讯生态集成
- [微信](./social/wechat) - 微信生态集成
- [抖音](./social/douyin) - 字节跳动生态

## 配置优先级

登录方式的配置和显示遵循以下优先级：

1. **管理员设置** - 系统管理员可以全局启用/禁用登录方式
2. **环境变量** - 通过环境变量控制功能开关
3. **默认配置** - 系统默认启用的登录方式

## 环境变量概览

### 基础配置

```env
# 邮箱登录
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 短信登录
NUXT_PUBLIC_PHONE_ENABLED=true
PHONE_CHANNEL=spug
PHONE_SPUG_TEMPLATE_ID=your-template-id

# 匿名登录
ANONYMOUS_LOGIN_ENABLED=true
```

### 社交登录配置

```env
# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# 更多社交登录配置...
```

## 安全考虑

### 客户端密钥安全
- 永远不要在客户端代码中暴露客户端密钥
- 定期轮换客户端密钥
- 使用环境变量存储敏感信息

### 回调 URL 配置
- 确保回调 URL 使用 HTTPS
- 限制回调 URL 的域名白名单
- 避免使用通配符回调 URL

### 权限范围控制
- 只请求必要的用户权限
- 向用户明确说明权限用途
- 支持权限的增量授权

## 测试配置

### 开发环境测试

```bash
# 启动开发服务器
pnpm dev

# 测试邮件发送
curl -X POST http://localhost:3000/api/auth/send-email-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 测试短信发送  
curl -X POST http://localhost:3000/api/auth/send-phone-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+86138****8888"}'
```

### 社交登录测试

1. 配置测试应用的客户端 ID 和密钥
2. 设置正确的回调 URL
3. 在浏览器中访问登录页面测试

## 常见问题

### 邮件发送失败
- 检查 SMTP 服务器配置
- 验证邮箱密码或应用密码
- 确认邮箱服务商的安全设置

### 短信发送失败
- 验证短信服务商的 API 配置
- 检查短信模板是否审核通过
- 确认手机号格式是否正确

### 社交登录失败
- 检查客户端 ID 和密钥是否正确
- 验证回调 URL 配置
- 确认应用是否通过审核

## 最佳实践

### 1. 多登录方式组合
建议同时启用多种登录方式，为用户提供选择：
- 邮箱登录（基础）
- 社交登录（便捷）
- 验证码登录（安全）

### 2. 渐进式配置
建议按以下顺序配置登录方式：
1. 先配置邮箱登录
2. 再添加主流社交登录（GitHub、Google）
3. 最后根据用户群体添加其他登录方式

### 3. 用户体验优化
- 提供清晰的登录选项说明
- 支持登录方式的绑定和解绑
- 为新用户提供引导流程

## 下一步

选择您需要配置的登录方式，查看对应的详细配置指南：

- 如果您是第一次配置，建议从 [邮箱登录配置](./email-login) 开始
- 如果需要快速集成，可以查看 [社交登录配置](./social/github)
- 如果需要中国用户支持，可以配置 [微信](./social/wechat) 或 [QQ](./social/qq) 登录
