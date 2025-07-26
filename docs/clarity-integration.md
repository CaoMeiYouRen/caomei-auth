# Microsoft Clarity 集成使用说明

本项目已集成 Microsoft Clarity 行为分析工具，提供会话回放、热图、洞察和智能分析功能。

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加您的 Clarity 项目 ID：

```bash
# Microsoft Clarity 项目 ID
NUXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id_here
```

### 2. 获取 Clarity 项目 ID

1. 访问 [Microsoft Clarity](https://clarity.microsoft.com/)
2. 登录并创建新项目或选择现有项目
3. 进入项目 > Settings > Overview
4. 复制项目 ID

## 使用方法

### 在 Vue 组件中使用

```vue
<template>
    <div>
        <button @click="trackUserAction">点击按钮</button>
        <button @click="upgradeSession">重要操作</button>
    </div>
</template>

<script setup lang="ts">
// 使用 composable
const clarity = useClarity();

// 页面加载时标识用户
onMounted(() => {
    const user = await $fetch("/api/auth/session");
    if (user?.user?.id) {
        // 为用户设置自定义标识符
        clarity.identify(user.user.id, undefined, route.path, user.user.name);
    }
});

// 跟踪用户操作
const trackUserAction = () => {
    clarity.event("button_click");
    clarity.setTag("action_type", "user_interaction");
};

// 升级重要会话
const upgradeSession = () => {
    clarity.upgrade("important_action");
    clarity.event("important_button_click");
};
</script>
```

### 在页面中使用

```vue
<script setup lang="ts">
// 在每个页面都可以调用 identify API
const clarity = useClarity();
const route = useRoute();
const { data: session } = await $fetch("/api/auth/session");

onMounted(() => {
    if (session?.user?.id) {
        // 为获得最佳跟踪效果，建议在每个页面都调用
        clarity.identify(
            session.user.id, // 用户唯一标识符
            undefined, // 自定义会话 ID（可选）
            route.path, // 当前页面路径作为页面 ID
            session.user.name // 用户友好名称
        );
    }

    // 为页面设置标签
    clarity.setTag("page_type", "auth_page");
    clarity.setTag("user_type", session?.user ? "authenticated" : "anonymous");
});
</script>
```

## API 参考

### `identify(customId, customSessionId?, customPageId?, friendlyName?)`

为用户设置自定义标识符。建议在每个页面都调用此 API 以获得最佳跟踪效果。

-   `customId`: 用户唯一标识符（必需）- Clarity 会在客户端安全地哈希处理
-   `customSessionId`: 自定义会话标识符（可选）
-   `customPageId`: 自定义页面标识符（可选）
-   `friendlyName`: 用户友好名称（可选）

### `setTag(key, value)`

为会话应用自定义标签，用于过滤和分析数据。

-   `key`: 标签的键
-   `value`: 标签的值（字符串或字符串数组）

### `event(eventName)`

跟踪自定义事件，这些事件会出现在 Clarity 的智能事件中。

-   `eventName`: 事件名称

### `consent(consent?)`

设置 Cookie 同意状态。如果项目配置为需要 Cookie 同意，必须调用此 API。

-   `consent`: 是否同意使用 Cookie（默认为 true）

### `upgrade(reason)`

优先记录特定类型的会话，用于重要操作或特殊页面。

-   `reason`: 升级原因

## 使用场景示例

### 1. 用户认证流程跟踪

```typescript
// 登录成功
clarity.event("user_login_success");
clarity.setTag("login_method", "email");
clarity.identify(user.id, undefined, "/dashboard", user.name);

// 注册流程
clarity.event("user_registration_start");
clarity.setTag("registration_step", "email_verification");

// 登录失败
clarity.event("user_login_failed");
clarity.setTag("login_error", "invalid_credentials");
```

### 2. 重要操作跟踪

```typescript
// 密码修改
clarity.upgrade("security_action");
clarity.event("password_change");
clarity.setTag("security_level", "high");

// OAuth 授权
clarity.upgrade("oauth_consent");
clarity.event("oauth_app_authorized");
clarity.setTag("app_type", "third_party");
```

### 3. 错误和异常跟踪

```typescript
// API 错误
clarity.event("api_error");
clarity.setTag("error_code", "500");
clarity.setTag("api_endpoint", "/api/auth/login");

// 表单验证错误
clarity.event("form_validation_error");
clarity.setTag("form_type", "login");
clarity.setTag("error_fields", ["email", "password"]);
```

## 注意事项

1. **隐私保护**: Clarity 会自动对 `customId` 进行哈希处理，确保用户隐私安全。

2. **性能优化**: Clarity 只在客户端加载和运行，不会影响服务器性能。

3. **数据同意**: 如果需要 Cookie 同意，请在用户同意后调用 `clarity.consent(true)`。

4. **标签限制**: 自定义标签有数量限制，建议合理使用。

5. **事件命名**: 使用有意义的事件名称，便于后续数据分析。

## 相关链接

-   [Microsoft Clarity 官方文档](https://docs.microsoft.com/en-us/clarity/)
-   [Clarity 支持邮箱](mailto:clarityms@microsoft.com)
-   [Clarity 法律条款](https://clarity.microsoft.com/terms)
-   [Clarity 隐私政策](https://privacy.microsoft.com/privacystatement)
