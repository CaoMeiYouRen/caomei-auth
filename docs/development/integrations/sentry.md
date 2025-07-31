# Sentry 错误监控集成使用说明

本项目已集成 Sentry 错误监控工具，提供实时错误跟踪、性能监控和错误报告功能。

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加您的 Sentry DSN：

```bash
# Sentry DSN，用于错误跟踪和监控
NUXT_PUBLIC_SENTRY_DSN=https://your_dsn@sentry.io/project_id
```

### 2. 获取 Sentry DSN

1. 访问 [Sentry](https://sentry.io/)
2. 登录并创建新项目或选择现有项目
3. 选择平台为 "Vue" 或 "JavaScript"
4. 复制提供的 DSN

## 功能特性

### 自动错误捕获

Sentry 会自动捕获以下类型的错误：

-   **JavaScript 运行时错误**：未捕获的异常和错误
-   **Promise 拒绝**：未处理的 Promise 错误
-   **Vue 组件错误**：Vue 组件生命周期和渲染错误
-   **网络请求错误**：API 请求失败和网络问题

### 性能监控

-   **页面加载性能**：自动监控页面加载时间
-   **API 请求性能**：跟踪 API 请求的响应时间
-   **组件渲染性能**：监控 Vue 组件的渲染时间

### 错误上下文信息

每个错误报告都包含丰富的上下文信息：

-   **用户信息**：用户 ID、邮箱等（如果已登录）
-   **设备信息**：浏览器、操作系统、设备类型
-   **页面信息**：当前页面 URL、referrer
-   **自定义标签**：环境标签、版本信息等

## 使用方法

### 手动报告错误

```javascript
// 在组件中手动报告错误
import * as Sentry from "@sentry/vue";

// 报告简单错误
Sentry.captureException(new Error("自定义错误"));

// 报告带上下文的错误
Sentry.withScope((scope) => {
    scope.setTag("section", "user-profile");
    scope.setLevel("warning");
    scope.captureException(new Error("用户资料更新失败"));
});
```

### 添加自定义标签和上下文

```javascript
// 设置用户信息
Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
});

// 设置自定义标签
Sentry.setTag("page", "login");
Sentry.setTag("feature", "social-auth");

// 设置额外上下文
Sentry.setContext("auth_provider", {
    provider: "github",
    login_method: "oauth",
});
```

### 在 Vue 组件中使用

```vue
<template>
    <div>
        <button @click="handleSafeOperation">安全操作</button>
        <button @click="handleRiskyOperation">风险操作</button>
    </div>
</template>

<script setup lang="ts">
import * as Sentry from "@sentry/vue";

const handleSafeOperation = () => {
    try {
        // 执行操作
        performOperation();
    } catch (error) {
        // 手动报告错误
        Sentry.captureException(error);
        // 显示用户友好的错误消息
        console.error("操作失败，请稍后重试");
    }
};

const handleRiskyOperation = () => {
    // 添加面包屑记录
    Sentry.addBreadcrumb({
        message: "用户点击了风险操作按钮",
        level: "info",
        category: "user-action",
    });

    // 执行风险操作
    performRiskyOperation();
};
</script>
```

## 配置选项

### 环境配置

项目会根据不同环境自动配置 Sentry：

-   **开发环境**：错误仅在控制台显示，不上报到 Sentry
-   **生产环境**：自动上报所有错误到 Sentry
-   **预览环境**：可选择性上报错误

### 过滤规则

以下错误类型会被自动过滤，不会上报到 Sentry：

-   **网络错误**：临时网络连接问题
-   **脚本加载错误**：第三方脚本加载失败
-   **权限错误**：跨域访问错误
-   **重复错误**：短时间内的重复错误

### 采样率配置

-   **错误采样**：生产环境中 100% 采样所有错误
-   **性能采样**：10% 采样性能数据，减少带宽占用
-   **会话回放**：5% 采样用户会话，用于错误重现

## 最佳实践

### 1. 错误分类

使用标签对错误进行分类：

```javascript
// 按功能模块分类
Sentry.setTag("module", "authentication");
Sentry.setTag("module", "user-management");
Sentry.setTag("module", "oauth");

// 按严重程度分类
Sentry.setLevel("error"); // 严重错误
Sentry.setLevel("warning"); // 警告
Sentry.setLevel("info"); // 信息
```

### 2. 添加业务上下文

```javascript
// 登录相关错误
Sentry.setContext("login_attempt", {
    provider: "github",
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString(),
});

// OAuth 相关错误
Sentry.setContext("oauth_flow", {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: requestedScope,
});
```

### 3. 敏感信息保护

确保不会上报敏感信息：

```javascript
// ✅ 正确：不包含敏感信息
Sentry.setContext("user_action", {
    action: "password_change",
    success: false,
    error_code: "WEAK_PASSWORD",
});

// ❌ 错误：包含敏感信息
Sentry.setContext("user_data", {
    password: "user_password", // 不要上报密码
    token: "access_token", // 不要上报令牌
});
```

## 故障排除

### 常见问题

#### 1. 错误未上报到 Sentry

**可能原因**：

-   DSN 配置错误
-   网络连接问题
-   错误被过滤规则过滤

**解决方案**：

```javascript
// 检查 Sentry 初始化状态
console.log("Sentry DSN:", process.env.NUXT_PUBLIC_SENTRY_DSN);

// 手动测试错误上报
Sentry.captureException(new Error("测试错误"));
```

#### 2. 性能数据缺失

**可能原因**：

-   采样率设置过低
-   页面加载时间过短

**解决方案**：

```javascript
// 手动发送性能数据
Sentry.startTransaction({
    name: "用户登录",
    op: "user-action",
});
```

#### 3. 过多噪音错误

**解决方案**：

```javascript
// 添加错误过滤
Sentry.init({
    beforeSend(event) {
        // 过滤特定错误
        if (event.exception) {
            const error = event.exception.values[0];
            if (error.type === "NetworkError") {
                return null; // 不上报网络错误
            }
        }
        return event;
    },
});
```

## 相关资源

-   [Sentry Vue 官方文档](https://docs.sentry.io/platforms/javascript/guides/vue/)
-   [Sentry Nuxt 集成指南](https://docs.sentry.io/platforms/javascript/guides/nuxt/)
-   [错误监控最佳实践](https://docs.sentry.io/product/best-practices/)

## 注意事项

1. **隐私合规**：确保错误报告符合 GDPR 等隐私法规要求
2. **数据保护**：不要在错误报告中包含用户密码、令牌等敏感信息
3. **性能影响**：Sentry 对应用性能的影响很小，但建议监控首次加载时间
4. **配额管理**：根据项目规模选择合适的 Sentry 套餐，避免超出配额限制

---

如果您在集成过程中遇到问题，请查阅 [故障排除指南](../troubleshooting.md) 或提交 [Issue](https://github.com/CaoMeiYouRen/caomei-auth/issues)。
