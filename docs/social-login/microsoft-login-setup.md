# Microsoft 登录配置指南

Microsoft 登录适合企业用户和使用 Microsoft 生态系统的用户，支持个人 Microsoft 账户和工作/学校账户。

## 前置要求

-   拥有 Microsoft 账户
-   需要在 Azure Portal 中注册应用程序

## 配置步骤

### 1. 访问 Azure Portal

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 使用您的 Microsoft 账户登录
3. 如果没有 Azure 订阅，可以创建免费账户

### 2. 注册应用程序

1. 在 Azure Portal 搜索栏中输入 "Azure Active Directory"
2. 选择 **Azure Active Directory** 服务
3. 在左侧菜单中选择 **应用注册**
4. 点击 **新注册**

### 3. 配置应用注册

填写应用程序信息：

-   **名称**: `草梅Auth`
-   **支持的帐户类型**: 选择适合您需求的选项
    -   **仅此组织目录中的帐户**: 仅限单个租户
    -   **任何组织目录中的帐户**: 多租户(仅工作/学校账户)
    -   **任何组织目录中的帐户和个人 Microsoft 帐户**: 多租户+个人账户(推荐)
    -   **仅个人 Microsoft 帐户**: 仅个人账户
-   **重定向 URI**:
    -   类型选择 **Web**
    -   URI: `https://yourdomain.com/api/auth/callback/microsoft`

点击 **注册** 完成创建。

### 4. 配置身份验证

1. 在应用注册页面，选择 **身份验证**
2. 在 **重定向 URI** 部分：
    - 生产环境: `https://yourdomain.com/api/auth/callback/microsoft`
    - 本地开发: `http://localhost:3000/api/auth/callback/microsoft`
3. 在 **隐式授权和混合流** 部分：
    - 勾选 **ID 令牌** (用于隐式流)
4. 在 **支持的帐户类型** 部分确认选择正确
5. 点击 **保存**

### 5. 创建客户端密钥

1. 在左侧菜单中选择 **证书和密码**
2. 在 **客户端密码** 部分点击 **新建客户端密码**
3. 填写描述: `草梅Auth客户端密钥`
4. 选择到期时间(建议选择较长时间或永不过期)
5. 点击 **添加**
6. **重要**: 立即复制并保存密钥值，离开页面后将无法再次查看

### 6. 获取应用程序信息

在 **概述** 页面获取以下信息：

-   **应用程序(客户端) ID**: 这是您的 Client ID
-   **目录(租户) ID**: 用于单租户配置(可选)

### 7. 配置环境变量

在项目的 `.env` 文件中添加：

```env
# Microsoft 登录配置
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 8. 重启应用

保存环境变量后，重启应用以使配置生效。

## 权限范围

Microsoft 登录默认获取以下用户信息：

-   基本个人信息(显示名称、用户名等)
-   邮箱地址
-   用户 ID
-   头像(如果有)

## 测试登录

1. 访问登录页面
2. 点击 Microsoft 登录按钮
3. 在 Microsoft 登录页面输入账户信息
4. 在权限授权页面点击 **是**
5. 成功登录后会跳转回应用

## 账户类型支持

### 个人 Microsoft 账户

-   Outlook.com、Hotmail.com、Live.com 等个人邮箱
-   Xbox Live 账户
-   Skype 账户

### 工作或学校账户

-   企业 Azure AD 账户
-   教育机构 Office 365 账户
-   政府部门账户

### 多租户配置

如果选择支持多租户，您的应用可以登录任何组织的用户。

## 安全注意事项

### 生产环境

1. **HTTPS 要求**: 生产环境必须使用 HTTPS
2. **重定向 URI**: 确保重定向 URI 精确匹配
3. **密钥管理**: 定期轮换客户端密钥
4. **租户验证**: 如果只允许特定组织，配置租户限制

### 证书认证

对于更高安全性，可以使用证书代替客户端密钥：

1. 在 **证书和密码** 页面上传证书
2. 使用证书进行应用程序身份验证

## 常见问题

### 1. AADSTS50011: 回复地址不匹配

**原因**: 重定向 URI 配置错误

**解决方案**:

-   检查 Azure Portal 中配置的重定向 URI
-   确保 URI 完全匹配(区分大小写)
-   本地开发时使用 `http://localhost:3000`

### 2. AADSTS700016: 未找到应用程序

**原因**: 客户端 ID 错误或应用程序不存在

**解决方案**:

-   检查环境变量 `MICROSOFT_CLIENT_ID` 是否正确
-   确认应用程序在正确的 Azure AD 租户中
-   检查应用程序是否已启用

### 3. AADSTS7000215: 提供了无效的客户端密码

**原因**: 客户端密钥错误或已过期

**解决方案**:

-   检查环境变量 `MICROSOFT_CLIENT_SECRET` 是否正确
-   在 Azure Portal 中检查密钥是否过期
-   创建新的客户端密钥

### 4. AADSTS50020: 用户账户不存在

**原因**: 用户尝试使用不支持的账户类型

**解决方案**:

-   检查应用程序支持的账户类型配置
-   确认用户使用的是支持的账户类型

## Microsoft 品牌指南

使用 Microsoft 登录按钮时的建议：

-   **颜色**: 使用 Microsoft 官方蓝色 `#0078d4`
-   **图标**: 使用 Microsoft 官方图标
-   **文案**: "使用 Microsoft 登录" 或 "继续使用 Microsoft"
-   **按钮样式**: 遵循 Microsoft 设计规范

## 高级配置

### 请求额外权限

如果需要访问用户的 OneDrive、Outlook 等服务：

```javascript
// 请求额外权限
await authClient.signIn.social({
    provider: "microsoft",
    scope: "openid profile email https://graph.microsoft.com/Files.Read",
});
```

常用权限范围：

-   `https://graph.microsoft.com/Files.Read`: 读取用户文件
-   `https://graph.microsoft.com/Mail.Read`: 读取用户邮件
-   `https://graph.microsoft.com/Calendars.Read`: 读取用户日历
-   `https://graph.microsoft.com/User.Read`: 读取用户配置文件

### 租户特定配置

如果只允许特定组织的用户：

```env
# 指定租户 ID
MICROSOFT_TENANT_ID=your_tenant_id
```

### 管理员同意

某些权限需要管理员同意：

1. 在 Azure Portal 中配置 **API 权限**
2. 请求管理员为组织授予同意
3. 用户登录时不再需要单独同意

## 监控和管理

### 查看登录统计

在 Azure Portal 中可以查看：

-   登录活动报告
-   应用程序使用情况
-   错误和异常报告

### 用户和组管理

可以配置哪些用户或组可以访问应用程序：

1. 在应用注册中选择 **企业应用程序**
2. 配置 **用户和组**
3. 添加或删除用户/组

### 条件访问

结合 Azure AD 条件访问策略：

-   基于位置的访问控制
-   设备合规性要求
-   多因素身份验证要求

## Microsoft Graph API

登录后可以调用 Microsoft Graph API 访问用户数据：

```javascript
// 获取用户信息
const userInfo = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
        Authorization: `Bearer ${accessToken}`,
    },
});
```

## 相关链接

-   [Microsoft 身份平台文档](https://docs.microsoft.com/zh-cn/azure/active-directory/develop/)
-   [Azure Portal](https://portal.azure.com/)
-   [Microsoft Graph API](https://docs.microsoft.com/zh-cn/graph/)
-   [Microsoft 设计指南](https://docs.microsoft.com/zh-cn/azure/active-directory/develop/howto-add-branding-in-azure-ad-apps)
