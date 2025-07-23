# 抖音登录配置指南

## 概述

抖音登录是基于 OAuth2.0 协议的社交登录方式，允许用户使用抖音账号登录您的应用。本项目已集成抖音开放平台的登录接口，支持扫码登录和手机号验证码登录。

## 实现特性

-   ✅ 支持抖音 OAuth2.0 登录协议
-   ✅ 自动获取用户基本信息（昵称、头像等）
-   ✅ 支持 union_id 和 open_id 用户标识
-   ✅ 完善的错误处理和降级机制
-   ✅ 符合抖音开放平台最新 API 规范

## API 接口说明

本实现使用了以下抖音开放平台接口：

1. **授权接口**：`https://open.douyin.com/platform/oauth/connect`
2. **获取 access_token**：`https://open.douyin.com/oauth/access_token/`
3. **获取用户信息**：`https://open.douyin.com/oauth/userinfo/`

## 前提条件

1. 拥有抖音开放平台开发者账号
2. 已通过开发者资质认证
3. 已创建网站应用并通过审核
4. 已获得「获取用户基本信息」权限

## 配置步骤

### 1. 创建抖音开放平台应用

访问 [抖音开放平台](https://developer.open-douyin.com/) 并登录：

1. 点击右上角「控制台」
2. 选择「我的应用」
3. 点击「创建应用」选择「网站应用」
4. 填写应用信息：
    - 应用名称：您的应用名称
    - 应用简介：简要描述您的应用
    - 应用图标：上传应用图标
    - 应用类型：选择「网站应用」

### 2. 获取应用凭证

在应用详情页面获取：

-   `Client Key`（客户端标识）
-   `Client Secret`（客户端密钥）

### 3. 配置授权回调地址

在「授权回调」页面添加回调地址：

**开发环境：**

```
http://localhost:3000/api/auth/oauth2/callback/douyin
```

**生产环境：**

```
https://yourdomain.com/api/auth/oauth2/callback/douyin
```

### 4. 申请权限作用域

在「权限管理」页面申请以下权限：

-   `user_info`：获取用户基本信息

### 5. 配置环境变量

在您的 `.env` 文件中添加：

```env
# 抖音登录配置
DOUYIN_CLIENT_KEY=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret
```

### 6. 重启应用

保存环境变量后，重启您的应用以使配置生效。

## 技术实现

### OAuth2.0 流程

本项目完整实现了抖音 OAuth2.0 登录流程：

1. **获取授权码**：引导用户到抖音授权页面获取临时授权码 `code`
2. **获取访问令牌**：使用授权码换取 `access_token` 和 `open_id`
3. **获取用户信息**：使用访问令牌和 `open_id` 获取用户基本信息

### 关键配置

```typescript
{
    providerId: 'douyin',
    clientId: DOUYIN_CLIENT_KEY,
    clientSecret: DOUYIN_CLIENT_SECRET,
    authorizationUrl: 'https://open.douyin.com/platform/oauth/connect',
    tokenUrl: 'https://open.douyin.com/oauth/access_token/',
    userInfoUrl: 'https://open.douyin.com/oauth/userinfo/',
    scopes: ['user_info'],
    // ... 其他配置
}
```

### 用户标识处理

-   优先使用 `union_id`（跨应用唯一标识）
-   降级使用 `open_id`（应用内唯一标识）
-   提供完善的错误处理机制

## 登录流程

1. 用户点击「使用抖音登录」按钮
2. 跳转到抖音授权页面
3. 用户扫码或手机号验证登录
4. 用户确认授权
5. 系统获取访问令牌和用户信息
6. 返回您的应用并完成登录

## 用户信息

抖音登录可以获取以下用户信息：

-   `open_id`：用户在您应用中的唯一标识
-   `union_id`：用户在同一开发者的所有应用中的唯一标识（如果可用）
-   `nickname`：用户昵称
-   `avatar`：用户头像
-   **注意**：抖音不提供用户邮箱信息

## 特殊说明

### 临时邮箱

由于抖音不提供用户邮箱信息，系统会为用户自动生成临时邮箱：

-   格式：`{snowflake_id}@example.com`
-   用户可以稍后在个人中心绑定真实邮箱

### 授权页面样式

抖音支持两种登录方式：

1. **扫码登录**：在 PC 端显示二维码，用户使用抖音 App 扫码登录
2. **手机号登录**：用户输入手机号和验证码登录

### Token 有效期

-   `access_token`：15 天
-   `refresh_token`：30 天
-   最长续期：195 天（15 + 30 + 30 \* 5）

## 常见问题

### Q: 提示"非法重定向链接"

**A:** 检查以下几点：

1. 回调地址是否在开放平台正确配置
2. 回调地址是否以 `https://` 开头（生产环境）
3. 回调地址中的域名是否与配置完全一致

### Q: 获取用户信息失败

**A:** 可能的原因：

1. `access_token` 已过期
2. 权限作用域不足
3. `open_id` 参数缺失或错误

### Q: 如何在移动端使用

**A:** 在移动端访问时，可以设置 `is_call_app=1` 参数尝试拉起抖音 App 进行授权。

### Q: 支持哪些权限作用域

**A:** 目前主要支持：

-   `user_info`：获取用户基本信息
-   其他权限需要根据具体需求申请

## 开发调试

### 测试登录流程

1. 确保开发环境回调地址已配置
2. 启动应用：`pnpm dev`
3. 访问登录页面
4. 点击抖音登录按钮进行测试

### 查看登录日志

检查服务器日志获取详细的登录信息和错误提示。

## 安全建议

1. **保护密钥**：不要在前端代码中暴露 `Client Secret`
2. **验证回调**：确保回调地址的安全性
3. **Token 管理**：及时刷新和管理访问令牌
4. **用户隐私**：遵守相关隐私政策和法规

## 相关链接

-   [抖音开放平台](https://developer.open-douyin.com/)
-   [抖音开放平台文档](https://developer.open-douyin.com/docs)
-   [OAuth2.0 规范](https://tools.ietf.org/html/rfc6749)

## 故障排除

如果遇到问题：

1. 查看应用日志获取详细错误信息
2. 检查抖音开放平台的配置
3. 确认权限作用域是否正确申请
4. 联系抖音开放平台技术支持
