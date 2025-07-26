# 最小化 Clarity 追踪方案

基于草梅 Auth 项目的需求分析，以下是最小化、仅必要的 Clarity 用户行为追踪方案：

## 核心追踪原则

1. **隐私优先**: 只追踪必要的用户行为，不收集敏感信息
2. **业务价值**: 专注于对产品优化有价值的关键指标
3. **性能友好**: 最小化对应用性能的影响
4. **合规安全**: 遵循数据保护法规要求

## 必要追踪页面

### 1. 认证核心流程 (高优先级)

#### 登录页面 `/login`

```typescript
// 页面访问追踪
onMounted(() => {
    clarity.setTag("page_type", "login");
    clarity.setTag("initial_method", activeTab.value); // username|email|phone
});

// 关键事件追踪
const trackLogin = (method: string, success: boolean, use2FA = false) => {
    if (success) {
        clarity.event("login_success");
        clarity.setTag("login_method", method);
        if (use2FA) clarity.setTag("used_2fa", "yes");
    } else {
        clarity.event("login_failed");
        clarity.setTag("failed_method", method);
    }
};

// 社交登录追踪
const trackSocialLogin = (provider: string) => {
    clarity.event("social_login_attempt");
    clarity.setTag("social_provider", provider);
};
```

#### 注册页面 `/register`

```typescript
onMounted(() => {
    clarity.setTag("page_type", "register");
    clarity.setTag("registration_method", activeTab.value); // email|phone
});

const trackRegistration = (method: string, success: boolean) => {
    clarity.event(success ? "registration_success" : "registration_failed");
    clarity.setTag("registration_method", method);
};
```

#### 忘记密码页面 `/forgot-password`

```typescript
const trackPasswordReset = (method: string) => {
    clarity.event("password_reset_request");
    clarity.setTag("reset_method", method); // email|phone
};
```

### 2. 安全关键操作 (高优先级)

#### 个人中心 `/profile`

```typescript
// 用户身份标识 (关键用于会话关联)
onMounted(() => {
    if (user.id) {
        clarity.identify(user.id, undefined, "/profile", user.nickname);
        clarity.setTag("page_type", "profile");
        clarity.setTag("email_verified", user.emailVerified ? "yes" : "no");
        clarity.setTag("phone_verified", user.phoneVerified ? "yes" : "no");
    }
});

// 重要操作追踪
const trackProfileAction = (action: string) => {
    clarity.event(`profile_${action}`); // profile_update, avatar_change, social_link, social_unlink
};
```

#### 安全设置页 `/security`

```typescript
// 重要安全操作需要升级会话
const trackSecurityAction = (action: string) => {
    clarity.upgrade("security_action");
    clarity.event(`security_${action}`); // security_2fa_enable, security_backup_codes_generate
};
```

### 3. OAuth 授权流程 (中等优先级)

#### 授权同意页 `/oauth/consent`

```typescript
const trackOAuthConsent = (clientId: string, granted: boolean) => {
    clarity.upgrade("oauth_consent"); // 重要业务操作
    clarity.event(granted ? "oauth_consent_granted" : "oauth_consent_denied");
    clarity.setTag(
        "oauth_client_type",
        isTrustedClient.value ? "trusted" : "third_party"
    );
};
```

#### 已授权应用管理 `/oauth/clients`

```typescript
const trackAppRevoke = (appId: string) => {
    clarity.event("oauth_app_revoked");
    // 不记录具体应用ID，只记录操作类型
};
```

### 4. 管理后台 (中等优先级)

#### 用户管理 `/admin/users`

```typescript
// 管理员操作需要升级会话
const trackAdminAction = (action: string) => {
    clarity.upgrade("admin_action");
    clarity.event(`admin_${action}`); // admin_user_create, admin_user_ban, admin_user_delete
    clarity.setTag("admin_section", "users");
};
```

## 实现步骤

### 1. 在关键页面添加基础追踪

**在 `pages/login.vue` 中:**

```typescript
// 导入 useClarity
const clarity = useClarity();

onMounted(() => {
    clarity.setTag("page_type", "login");
    clarity.setTag("initial_method", activeTab.value);
});

// 在登录成功/失败处添加事件追踪
const handleLoginResult = (method: string, success: boolean) => {
    clarity.event(success ? "login_success" : "login_failed");
    clarity.setTag("login_method", method);
};
```

**在 `pages/profile.vue` 中:**

```typescript
const clarity = useClarity();

watch(
    () => session.value?.user,
    (user) => {
        if (user?.id) {
            clarity.identify(user.id, undefined, "/profile", user.name);
            clarity.setTag("page_type", "profile");
        }
    },
    { immediate: true }
);
```

### 2. 在关键操作中添加事件追踪

**安全操作示例:**

```typescript
// 双因素认证启用
const enable2FA = async () => {
    try {
        clarity.upgrade("security_action");
        // ... 执行2FA启用逻辑
        clarity.event("security_2fa_enable");
    } catch (error) {
        clarity.event("security_2fa_enable_failed");
    }
};
```

**OAuth 授权示例:**

```typescript
// 授权同意
const grantConsent = async () => {
    clarity.upgrade("oauth_consent");
    clarity.event("oauth_consent_granted");
    clarity.setTag(
        "oauth_client_type",
        isTrustedClient.value ? "trusted" : "third_party"
    );
};
```

## 数据标签规范

### 页面类型标签

-   `page_type`: login, register, profile, security, oauth_consent, admin
-   `login_method`: username, email, phone, social
-   `registration_method`: email, phone
-   `social_provider`: github, google, microsoft, discord, etc.

### 操作结果标签

-   `login_success`, `login_failed`
-   `registration_success`, `registration_failed`
-   `oauth_consent_granted`, `oauth_consent_denied`

### 用户状态标签

-   `email_verified`: yes, no
-   `phone_verified`: yes, no
-   `used_2fa`: yes, no
-   `oauth_client_type`: trusted, third_party

## 隐私保护措施

1. **数据最小化**: 只追踪业务必需的操作和状态
2. **ID 哈希化**: Clarity 自动对用户 ID 进行哈希处理
3. **敏感信息过滤**: 不记录邮箱、手机号、密码等敏感信息
4. **会话隔离**: 匿名用户和认证用户分别处理

## 业务价值分析

### 登录转化漏斗

-   追踪不同登录方式的成功率
-   识别登录流程中的痛点
-   优化双因素认证体验

### 安全操作监控

-   监控关键安全设置的使用情况
-   发现用户安全行为模式
-   优化安全功能的用户体验

### OAuth 生态分析

-   了解第三方应用授权模式
-   优化授权流程用户体验
-   监控授权撤销模式

## 注意事项

1. **性能影响**: 所有追踪代码应在用户操作完成后异步执行
2. **错误处理**: 追踪代码不应影响正常业务逻辑
3. **条件加载**: 可考虑仅在生产环境启用完整追踪
4. **用户同意**: 根据地区法规要求获取用户同意

## 监控仪表板建议

### 关键指标

-   登录成功率（按方式分类）
-   注册转化率
-   双因素认证启用率
-   OAuth 授权同意率

### 用户行为分析

-   登录方式偏好
-   安全设置使用情况
-   社交登录使用分布
-   管理操作频次（仅管理员）

这个方案确保了在隐私保护的前提下，收集到对产品优化最有价值的用户行为数据。
