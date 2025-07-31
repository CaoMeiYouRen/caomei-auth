# Apple 登录配置指南

Apple 登录为 iOS 生态用户提供隐私友好的登录方式，支持隐藏真实邮箱地址。

## 前置要求

- 拥有 Apple Developer 账户（需要付费订阅）
- 需要在 Apple Developer Portal 创建应用 ID 和服务

## 配置步骤

### 1. 访问 Apple Developer Portal

1. 访问 [Apple Developer Portal](https://developer.apple.com/account/)
2. 使用您的 Apple Developer 账户登录

### 2. 创建 App ID

1. 在左侧菜单选择 **Certificates, Identifiers & Profiles**
2. 选择 **Identifiers**
3. 点击 **+** 按钮创建新标识符
4. 选择 **App IDs** 并点击 **Continue**
5. 选择 **App** 类型并点击 **Continue**
6. 填写信息：
   - **Description**: `草梅Auth`
   - **Bundle ID**: `com.yourcompany.caomeiauth`
7. 在 **Capabilities** 中勾选 **Sign In with Apple**
8. 点击 **Continue** 然后 **Register**

### 3. 创建 Services ID

1. 在 **Identifiers** 页面点击 **+** 按钮
2. 选择 **Services IDs** 并点击 **Continue**
3. 填写信息：
   - **Description**: `草梅Auth Web Service`
   - **Identifier**: `com.yourcompany.caomeiauth.service`
4. 勾选 **Sign In with Apple**
5. 点击 **Configure**
6. 在配置页面：
   - **Primary App ID**: 选择之前创建的 App ID
   - **Website URLs**: 添加您的域名
   - **Return URLs**: 添加 `https://yourdomain.com/api/auth/callback/apple`
7. 点击 **Save** 然后 **Continue** 再点击 **Register**

### 4. 创建私钥

1. 在左侧菜单选择 **Keys**
2. 点击 **+** 按钮
3. 填写 **Key Name**: `草梅Auth Apple Key`
4. 勾选 **Sign in with Apple**
5. 点击 **Configure**
6. 选择之前创建的 Primary App ID
7. 点击 **Save** 然后 **Continue**
8. 点击 **Register**
9. **重要**: 下载私钥文件（.p8），只能下载一次

### 5. 获取必要信息

收集以下信息：

- **Client ID**: Services ID 的 Identifier
- **Team ID**: 在 Apple Developer Portal 右上角可以找到
- **Key ID**: 私钥的 ID
- **Private Key**: 下载的 .p8 文件内容

### 6. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Apple 登录配置
APPLE_CLIENT_ID=com.yourcompany.caomeiauth.service
APPLE_CLIENT_SECRET=your_generated_jwt_token
APPLE_APP_BUNDLE_IDENTIFIER=com.yourcompany.caomeiauth
```

注意：`APPLE_CLIENT_SECRET` 需要使用私钥生成 JWT 令牌。

### 7. 生成客户端密钥

Apple 使用 JWT 作为客户端密钥，需要使用私钥生成：

```javascript
// 示例：生成 Apple 客户端密钥
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('path/to/AuthKey_XXXXXXXXXX.p8', 'utf8');

const clientSecret = jwt.sign(
  {
    iss: 'YOUR_TEAM_ID',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 6 months
    aud: 'https://appleid.apple.com',
    sub: 'com.yourcompany.caomeiauth.service',
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      kid: 'YOUR_KEY_ID',
    },
  }
);
```

### 8. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Apple 登录获取以下用户信息：

- 用户唯一标识符
- 邮箱地址（可能是代理邮箱）
- 姓名（首次登录时）
- 真实用户状态

## 隐私保护功能

### Hide My Email

Apple 可以为用户生成代理邮箱地址：

- 格式：`xxxxx@privaterelay.appleid.com`
- 自动转发到用户真实邮箱
- 用户可以随时停用

### 真实用户检测

Apple 提供真实用户状态：

- `unsupported`: 不支持
- `unknown`: 未知
- `likelyReal`: 可能是真实用户

## 测试登录

1. 访问登录页面
2. 点击 Apple 登录按钮
3. 在 Apple 授权页面登录
4. 选择是否分享邮箱地址
5. 成功登录后会跳转回应用

## 常见问题

### 1. Invalid client

**原因**: Services ID 配置错误

**解决方案**:
- 检查 Services ID 是否正确配置
- 确认 Return URLs 设置正确

### 2. Invalid client secret

**原因**: JWT 令牌生成错误

**解决方案**:
- 检查私钥文件是否正确
- 验证 Team ID 和 Key ID
- 确认 JWT 令牌未过期

### 3. Domain not verified

**原因**: 域名未验证

**解决方案**:
- 在 Services ID 配置中添加正确的域名
- 确保域名可以访问

## 移动端集成

### iOS 应用

如果同时有 iOS 应用，需要：

1. 在 iOS 应用中集成 Sign in with Apple
2. 使用相同的 Team ID 和 Bundle Identifier
3. 共享用户身份标识

### 跨平台一致性

确保 Web 和 iOS 应用：

- 使用相同的用户标识符
- 一致的用户体验
- 数据同步

## 品牌指南

使用 Apple 登录时的要求：

- **按钮样式**: 使用 Apple 官方设计
- **颜色**: 黑色或白色主题
- **文案**: "使用 Apple 登录" 或 "Continue with Apple"
- **图标**: 使用 Apple 官方图标

## 审核要求

### App Store 审核

如果您的 iOS 应用支持第三方登录，必须同时提供 Apple 登录选项。

### 用户体验要求

- Apple 登录按钮必须显眼
- 不能强制用户选择 Apple 登录
- 保护用户隐私选择

## 相关链接

- [Apple Developer Portal](https://developer.apple.com/account/)
- [Sign in with Apple 文档](https://developer.apple.com/documentation/sign_in_with_apple)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/overview/)
