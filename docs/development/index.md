# 开发文档

欢迎使用草梅 Auth 开发文档。本文档主要面向开发者，介绍系统架构、开发指南和扩展方法。

## 项目概览

草梅 Auth 是基于 Nuxt.js 全栈框架构建的统一登录平台，采用现代化的技术栈：

-   **前端**: Nuxt.js 3 + Vue 3 + TypeScript
-   **后端**: Nitro + H3 + TypeORM
-   **数据库**: 支持 PostgreSQL、MySQL、SQLite
-   **认证**: Better-Auth + OAuth2.0
-   **样式**: SCSS + 响应式设计

## 开发指南

### [项目架构](../design/architecture)

了解项目的整体架构设计和技术选型。

### [项目规范](../standards/development)

详细了解开发、测试及文档编写的统一规范。

### [数据库关系](../design/database)

详细介绍数据库表结构和实体关系。

详细介绍数据库表结构和实体关系。

### [管理员角色同步](./admin-role-sync)

了解管理员权限机制和同步逻辑。

### [最佳实践](./best-practices)

开发过程中的最佳实践和代码规范。

## 技术栈详解

### 前端技术栈

```typescript
// Nuxt 3 配置示例
export default defineNuxtConfig({
    modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@vueuse/nuxt"],
    css: ["~/styles/main.scss"],
    typescript: {
        strict: true,
    },
});
```

### 后端技术栈

```typescript
// 数据库配置示例
export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User, Session, Account /* ... */],
    migrations: ["server/migrations/*.ts"],
    synchronize: false,
};
```

### 认证系统

```typescript
// Better-Auth 配置示例
export const auth = betterAuth({
    database: typeormAdapter(AppDataSource),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
});
```

## 开发环境搭建

### 1. 克隆项目

```bash
git clone https://github.com/CaoMeiYouRen/caomei-auth.git
cd caomei-auth
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

### 4. 初始化数据库

```bash
# 创建数据库
createdb caomei_auth

# 运行迁移
pnpm build
```

### 5. 启动开发服务器

```bash
pnpm dev
```

## 项目结构

```
caomei-auth/
├── components/          # Vue 组件
├── composables/         # 组合式函数
├── layouts/            # 布局文件
├── pages/              # 页面文件
├── server/             # 服务端代码
│   ├── api/           # API 路由
│   ├── entities/      # 数据库实体
│   ├── middleware/    # 中间件
│   └── utils/         # 工具函数
├── styles/            # 样式文件
├── types/             # 类型定义
└── utils/             # 通用工具
```

## 核心概念

### 实体关系

-   **User**: 用户实体，存储用户基本信息
-   **Account**: 账户实体，关联第三方登录
-   **Session**: 会话实体，管理用户登录状态
-   **OAuthApplication**: OAuth 应用管理
-   **TwoFactor**: 双因子认证（计划中）

### 中间件系统

```typescript
// 认证中间件示例
export default defineEventHandler(async (event) => {
    // 限流检查
    await rateLimitMiddleware(event);

    // 身份验证
    await authMiddleware(event);

    // 权限检查
    await permissionMiddleware(event);
});
```

### API 设计

遵循 RESTful 设计原则：

-   `GET /api/auth/session` - 获取当前会话
-   `POST /api/auth/sign-in` - 用户登录
-   `POST /api/auth/sign-up` - 用户注册
-   `DELETE /api/auth/sign-out` - 用户登出

## 开发工具

### 推荐 VS Code 插件

-   **Vue Language Features (Volar)**: Vue 3 支持
-   **TypeScript Vue Plugin**: TypeScript 集成
-   **Prettier**: 代码格式化
-   **ESLint**: 代码检查

### 调试工具

```bash
# 启用调试模式
DEBUG=* pnpm dev

# 查看数据库查询
DEBUG=typeorm:query pnpm dev
```

## 贡献指南

### 代码规范

1. 使用 TypeScript 严格模式
2. 遵循 ESLint 和 Prettier 配置
3. 编写单元测试
4. 更新相关文档

### 提交规范

```bash
# 提交格式
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复 bug"
git commit -m "docs: 更新文档"
```

### Pull Request

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 创建 Pull Request

## 性能优化

### 前端优化

-   使用 Nuxt 3 的 SSR 和 SSG
-   按需加载组件
-   图片懒加载
-   CDN 资源优化

### 后端优化

-   数据库查询优化
-   Redis 缓存
-   API 响应压缩
-   连接池管理

## 监控和日志

### 错误监控

集成 Sentry 进行错误追踪：

```typescript
// 错误处理示例
export default defineNitroErrorHandler((error, event) => {
    console.error("Server error:", error);

    // 发送到 Sentry
    if (process.env.NUXT_PUBLIC_SENTRY_DSN) {
        captureException(error);
    }
});
```

### 性能监控

使用 Microsoft Clarity 进行用户行为分析。

## 下一步

-   查看 [项目架构](./architecture) 了解系统设计
-   阅读 [API 文档](/docs/api/) 了解接口规范
-   参考 [最佳实践](./best-practices) 进行开发
