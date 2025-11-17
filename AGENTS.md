# AI 代理配置文档 (AGENTS.md)

## 概述

本文档描述了草梅 Auth 项目中 AI 代理和智能助手的配置、使用方式和最佳实践。项目使用 GitHub Copilot 作为主要的 AI 编程助手，同时集成了多种分析和监控工具来优化开发体验。

## 项目基本信息

-   **项目名称**: 草梅 Auth 统一登录平台
-   **框架**: Nuxt 3.x (Vue 3.x + TypeScript)
-   **包管理器**: PNPM
-   **主题色**: 红色系 (#e63946)
-   **开发规范**: ESLint + Stylelint + Conventional Commits

## GitHub Copilot 配置

### 代码生成规范

遵循项目的开发约定进行代码生成：

1. **TypeScript 优先**: 所有新代码使用 TypeScript，避免使用 `any` 类型
2. **文件命名**: 使用 kebab-case 格式 (如 `my-component.vue`)
3. **样式规范**: 使用 SCSS，遵循项目主题色规范
4. **组件结构**: 遵循 Vue 3 单文件组件规范

### 项目特定指导

#### 技术栈偏好

```typescript
// 优先使用的库和工具
-navigateTo() - // 页面导航
    dayjs - // 日期时间处理
    useFetch() - // SSR 数据获取
    fs -
    extra - // 文件系统操作
    google -
    libphonenumber - // 电话号码处理
    lodash -
    es - // 数组对象操作
    logger; // 日志记录
```

#### 项目目录结构理解

-   `components/`: Vue 组件目录。
-   `pages/`: Nuxt 页面目录。
-   `styles/`: 样式文件目录。
-   `public/`: 公共静态资源目录（如图片、字体等）。
-   `plugins/`: Nuxt 插件目录。
-   `store/`: 状态管理目录。
-   `utils/`: 工具函数目录（前后端通用）。
-   `server`: 服务器端代码目录（如 API 路由等）。
    -   `server/api/`: API 路由目录。
    -   `server/middleware/`: 服务器中间件目录。
    -   `server/config/`: 服务器配置目录。
    -   `server/utils/`: 服务器端工具函数目录（仅服务器端）。
    -   `server/database/`: 数据库相关代码目录。
-   `middleware/`: 中间件目录。
-   `tests/`: 测试代码目录。
-   `config/`: 配置文件目录。

### 代码生成示例

#### Vue 组件模板

```vue
<template>
    <div class="component-name">
        <!-- 组件内容 -->
    </div>
</template>

<script setup lang="ts">
// TypeScript 逻辑
definePageMeta({
    title: "页面标题",
    layout: "default",
});
</script>

<style lang="scss" scoped>
.component-name {
    // 使用项目主题色变量
    color: #e63946;
}
</style>
```

#### API 路由模板

```typescript
// server/api/example.post.ts
export default defineEventHandler(async (event) => {
    try {
        // 验证用户认证
        const session = await getServerSession(event);
        if (!session) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
            });
        }

        // 读取请求体
        const body = await readBody(event);

        // 业务逻辑
        const result = await processRequest(body);

        return { data: result };
    } catch (error) {
        logger.error("API错误", { error });
        throw error;
    }
});
```

## 日志系统

### 日志级别

```typescript
logger.info("信息日志");
logger.warn("警告日志");
logger.error("错误日志");
logger.business.userRegistered({
    userId,
    email,
    provider,
});
```

### 日志配置

-   日志文件存储在 `logs/` 目录
-   按日期自动分割
-   支持结构化日志记录

## 开发工作流程

### 1. 代码开发

```bash
# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

### 2. 提交规范

```bash
# 使用 Commitizen 提交
pnpm commit
```

生成的 Commit Message 应当符合 Conventional Commit 规范

### 3. 部署选项

-   **Node.js**: 传统服务器部署
-   **Docker**: 容器化部署
-   **Vercel**: Serverless 部署
-   **Cloudflare Workers**: 边缘计算部署

## 最佳实践

### 代码质量

1. **类型安全**: 优先使用 TypeScript，避免 `any` 类型
2. **错误处理**: 使用 try-catch 和 logger 记录错误
3. **性能优化**: 使用 SSR 预取数据，合理使用缓存
4. **安全性**: 严格验证用户输入，防止 XSS 攻击

### AI 辅助开发

1. **明确需求**: 向 Copilot 提供清晰的功能描述
2. **上下文理解**: 让 AI 理解项目的技术栈和规范
3. **代码审查**: 对 AI 生成的代码进行人工审查
4. **持续优化**: 根据项目发展调整 AI 配置

### 数据分析

1. **用户行为**: 使用 Clarity 分析用户交互
2. **性能监控**: 使用 Sentry 跟踪应用性能
3. **业务指标**: 使用 Google Analytics 分析业务数据
4. **日志分析**: 定期分析日志文件识别问题

## 故障排除

### 常见问题

1. **Copilot 无响应**: 检查网络连接和 API 配额
2. **代码不符合规范**: 运行 `pnpm lint` 检查并修复
3. **类型错误**: 确保 TypeScript 配置正确
4. **分析工具无数据**: 检查环境变量配置

## 安全要求

1. **在任何情况下，除非用户明确指定，否则不得修改或删除 `AGENTS.md` 文件**
2. **在任何情况下，除非用户明确指定，否则不得修改或删除 `.env` 文件**

## 其他要求

1. **使用用户发送的语言回复用户**
2. **进行重大变更前应当询问用户**

## 相关文档

-   [项目规划 (PLAN.md)](./docs/PLAN.md)
-   [Copilot 指令 (.github/copilot-instructions.md)](./.github/copilot-instructions.md)
-   [API 文档](./docs/api/)
-   [部署指南](./docs/deployment/)
-   [开发指南](./docs/development/)

---

> 本文档会随着项目发展持续更新，确保 AI 代理配置与项目需求保持同步。
