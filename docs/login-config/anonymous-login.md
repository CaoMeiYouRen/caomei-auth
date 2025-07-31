# 匿名登录配置指南

匿名登录允许用户无需注册即可直接体验应用功能，为用户提供最低门槛的访问方式。

## 什么是匿名登录

匿名登录是一种特殊的认证方式，用户无需提供：

- 用户名
- 密码
- 邮箱地址
- 手机号码
- 第三方社交账户

系统会自动为匿名用户创建临时账户，用户可以立即开始使用应用。

## 适用场景

匿名登录适合以下场景：

### 1. 产品体验
- 让用户快速体验产品核心功能
- 降低用户注册门槛
- 提高转化率

### 2. 临时使用
- 临时访客需要短期使用
- 不需要保存用户数据的场景
- 快速原型验证

### 3. 用户引导
- 新用户引导流程
- 功能演示和教程
- A/B 测试

## 配置步骤

### 1. 启用匿名登录

在项目的 `.env` 文件中添加：

```env
# 启用匿名登录
ANONYMOUS_LOGIN_ENABLED=true

# 生成匿名用户邮箱地址的域名(可选)
ANONYMOUS_EMAIL_DOMAIN_NAME='anonymous.com'

# 生成临时邮箱地址的域名(可选)
TEMP_EMAIL_DOMAIN_NAME='example.com'
```

### 2. 重启应用

保存环境变量后，重启应用以使配置生效。

### 3. 验证配置

访问登录页面，应该能看到匿名登录按钮。

## 使用方式

### 前端使用

```vue
<template>
    <div class="anonymous-login">
        <button @click="anonymousLogin" class="btn-anonymous">
            <i class="mdi mdi-lock"></i>
            一键匿名登录
        </button>
    </div>
</template>

<script setup>
import { authClient } from "@/lib/auth-client";

const anonymousLogin = async () => {
    try {
        await authClient.signIn.anonymous();
        // 登录成功，跳转到主页
        await navigateTo("/");
    } catch (error) {
        console.error("匿名登录失败:", error);
    }
};
</script>
```

### 程序化调用

```javascript
// 匿名登录
await authClient.signIn.anonymous();

// 检查当前用户是否为匿名用户
const { data: session } = await authClient.useSession();
if (session?.user?.isAnonymous) {
    console.log("当前用户是匿名用户");
}
```

## 匿名用户特点

### 自动生成信息

系统为匿名用户自动生成：

- **用户 ID**: 使用雪花算法生成唯一 ID
- **用户名**: 格式为 `匿名用户_{random_id}`
- **邮箱**: 格式为 `{snowflake_id}@anonymous.com`
- **头像**: 使用默认头像或生成随机头像
- **创建时间**: 当前时间戳

### 权限和限制

匿名用户通常有以下限制：

- 无法修改个人信息
- 某些高级功能可能受限
- 数据可能定期清理
- 无法找回账户(如果丢失会话)

## 账户转换

### 匿名用户升级

匿名用户可以转换为正式用户：

```javascript
// 绑定邮箱转为正式用户
await authClient.linkEmail({
    email: "user@example.com",
    password: "newpassword",
});

// 绑定社交账户转为正式用户
await authClient.linkSocial({
    provider: "github",
});
```

## 安全考虑

### 数据保护

1. **敏感数据**: 避免在匿名用户账户中存储敏感信息
2. **数据隔离**: 匿名用户数据与正式用户隔离
3. **定期清理**: 定期清理不活跃的匿名账户

### 防滥用

1. **IP 限制**: 限制单个 IP 的匿名账户创建数量
2. **时间限制**: 匿名账户有效期限制
3. **功能限制**: 限制匿名用户的某些操作

## 环境变量配置

```env
# 是否启用匿名登录
ANONYMOUS_LOGIN_ENABLED=true

# 匿名用户邮箱域名
ANONYMOUS_EMAIL_DOMAIN_NAME='anonymous.com'

# 临时邮箱域名
TEMP_EMAIL_DOMAIN_NAME='example.com'

# 匿名账户有效期(秒)
ANONYMOUS_ACCOUNT_LIFETIME=86400

# 单IP每日匿名账户创建限制
ANONYMOUS_DAILY_LIMIT_PER_IP=5
```

## 常见问题

### 1. 匿名登录按钮不显示

**原因**: 环境变量未正确配置

**解决方案**:
```env
# 确保环境变量正确设置
ANONYMOUS_LOGIN_ENABLED=true
```

### 2. 匿名用户无法访问某些功能

**原因**: 功能需要认证用户权限

**解决方案**:
- 检查权限控制逻辑
- 调整匿名用户权限设置
- 引导用户注册获得完整权限

### 3. 匿名用户数据丢失

**原因**: 会话过期或浏览器数据清理

**解决方案**:
- 延长会话有效期
- 提供数据导出功能
- 引导用户及时注册
