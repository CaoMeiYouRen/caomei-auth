# Microsoft 登录配置指南

Microsoft 登录适合企业用户和使用 Microsoft 生态系统的用户，支持个人 Microsoft 账户和工作/学校账户。

## 前置要求

- 拥有 Microsoft 账户
- 需要在 Azure Portal 中注册应用程序

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

- **名称**: `草梅Auth`
- **支持的帐户类型**: 选择适合您需求的选项
    - **仅此组织目录中的帐户**: 仅限单个租户
    - **任何组织目录中的帐户**: 多租户(仅工作/学校账户)
    - **任何组织目录中的帐户和个人 Microsoft 帐户**: 多租户+个人账户(推荐)
    - **仅个人 Microsoft 帐户**: 仅个人账户
- **重定向 URI**:
    - 类型选择 **Web**
    - URI: `https://yourdomain.com/api/auth/callback/microsoft`

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
2. 点击 **新客户端密码**
3. 添加描述: `草梅Auth 客户端密钥`
4. 选择过期时间(推荐选择较长时间，如24个月)
5. 点击 **添加**
6. **重要**: 立即复制密钥值，离开页面后将无法再次查看

### 6. 获取应用程序信息

在 **概述** 页面获取以下信息：

- **应用程序(客户端) ID**: 这是您的 Client ID
- **目录(租户) ID**: 租户 ID（可选，用于单租户应用）

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

- 基本个人信息(姓名、头像等)
- 邮箱地址
- 用户 ID
- 租户信息(对于工作/学校账户)

## 测试登录

1. 访问登录页面
2. 点击 Microsoft 登录按钮
3. 选择账户类型(个人或工作/学校)
4. 在 Microsoft 授权页面登录并授权
5. 成功登录后会跳转回应用

## 账户类型说明

### 个人 Microsoft 账户

- Outlook.com、Hotmail.com、Live.com 邮箱
- Xbox Live 账户
- Skype 账户

### 工作或学校账户

- Azure AD 组织账户
- Office 365 企业账户
- 教育机构账户

## 高级配置

### 配置 API 权限

如果需要访问 Microsoft Graph API：

1. 在应用注册页面选择 **API 权限**
2. 点击 **添加权限**
3. 选择 **Microsoft Graph**
4. 选择权限类型：
    - **委托的权限**: 代表登录用户
    - **应用程序权限**: 应用程序本身的权限
5. 添加所需权限，如：
    - `User.Read`: 读取用户基本信息
    - `Mail.Read`: 读取用户邮件
    - `Calendars.Read`: 读取用户日历

### 租户特定配置

对于单租户应用，可以指定租户 ID：

```env
MICROSOFT_TENANT_ID=your_tenant_id
```

## 常见问题

### 1. AADSTS50011: 重定向 URI 不匹配

**原因**: 重定向 URI 配置不正确

**解决方案**:
- 检查 Azure Portal 中配置的重定向 URI
- 确保 URI 完全匹配，包括协议和端口
- 本地开发时使用 `http://localhost:3000`

### 2. AADSTS65001: 用户或管理员未同意

**原因**: 用户未授权或应用需要管理员同意

**解决方案**:
- 检查请求的权限是否需要管理员同意
- 联系 Azure AD 管理员进行授权
- 减少不必要的权限请求

### 3. AADSTS70001: 应用程序未找到

**原因**: 客户端 ID 错误或应用程序被删除

**解决方案**:
- 检查环境变量 `MICROSOFT_CLIENT_ID`
- 确认应用程序在 Azure Portal 中存在
- 检查租户 ID 是否正确

### 4. 客户端密钥过期

**原因**: 客户端密钥已过期

**解决方案**:
- 在 Azure Portal 中创建新的客户端密钥
- 更新环境变量中的密钥值
- 删除过期的密钥

## 品牌指南

使用 Microsoft 登录时的建议：

- **颜色**: 使用 Microsoft 官方蓝色 `#0078d4`
- **图标**: 使用 Microsoft 官方图标
- **文案**: "使用 Microsoft 登录" 或 "继续使用 Microsoft"
- **按钮样式**: 遵循 Microsoft 设计规范

## 企业级功能

### 条件访问

Microsoft 支持条件访问策略：

- 基于位置的访问控制
- 设备合规性要求
- 多因素身份验证
- 风险评估

### 单点登录 (SSO)

配置 SSO 可以：

- 减少用户登录次数
- 提高用户体验
- 集成企业身份管理

## 监控和分析

### 登录报告

在 Azure Portal 中查看：

- 登录频率统计
- 用户地理分布
- 设备和应用程序使用情况
- 异常登录检测

### API 使用情况

监控 Microsoft Graph API 使用：

- 请求频率和延迟
- 错误率和类型
- 配额使用情况

## 成本考虑

### 免费层级

Azure AD 免费层包括：

- 基本目录服务
- 用户和组管理
- 基本报告
- OAuth 2.0 认证

### 付费功能

Premium 功能包括：

- 条件访问
- 高级威胁检测
- 特权身份管理
- 详细审计日志

## 相关链接

- [Microsoft 身份平台文档](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure Portal](https://portal.azure.com/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Azure AD 定价](https://azure.microsoft.com/en-us/pricing/details/active-directory/)
