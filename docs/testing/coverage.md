# 测试覆盖率提升计划

## 当前状态 (2025-12-14)

-   **总体覆盖率**: ~17.65% (Lines)
-   **目标**: ≥ 60%

### 覆盖率分布

| 模块           | 覆盖率 (Lines) | 状态                               |
| :------------- | :------------- | :--------------------------------- |
| `utils/shared` | ~80%           | ✅ 良好                            |
| `server/utils` | ~48%           | ⚠️ 需提升 (Email, Logger)          |
| `composables`  | ~5%            | ❌ 严重不足                        |
| `server/api`   | ~1%            | ⚠️ 启动中 (`sync-admin-role` 100%) |
| `components`   | ~26%           | ❌ 严重不足                        |
| `pages`        | 0%             | ❌ 严重不足                        |

## 提升策略

### 1. Server API 测试进度清单 (P0)

Server API 是系统的核心业务逻辑入口。

| 模块              | 文件路径                                             | 方法   | 状态      | 备注                           |
| :---------------- | :--------------------------------------------------- | :----- | :-------- | :----------------------------- |
| **Admin / Role**  | `server/api/admin/sync-admin-role.post.ts`           | POST   | ✅ 已完成 | 权限同步                       |
| **Admin / Logs**  | `server/api/admin/logs/stats.get.ts`                 | GET    | ✅ 已完成 | 统计概览                       |
|                   | `server/api/admin/logs/sessions.get.ts`              | GET    | ✅ 已完成 | 会话列表                       |
| **Admin / OAuth** | `server/api/admin/oauth/applications/index.get.ts`   | GET    | ✅ 已完成 | 应用列表                       |
|                   | `server/api/admin/oauth/applications/index.post.ts`  | POST   | ✅ 已完成 | 创建应用                       |
|                   | `server/api/admin/oauth/applications/[id].put.ts`    | PUT    | ✅ 已完成 | 更新应用                       |
|                   | `server/api/admin/oauth/applications/[id].delete.ts` | DELETE | ✅ 已完成 | 删除应用                       |
| **Admin / SSO**   | `server/api/admin/sso/providers/index.get.ts`        | GET    | ✅ 已完成 | 提供商列表                     |
|                   | `server/api/admin/sso/providers/index.post.ts`       | POST   | ✅ 已完成 | 创建提供商                     |
|                   | `server/api/admin/sso/providers/[id].get.ts`         | GET    | ✅ 已完成 | 提供商详情                     |
|                   | `server/api/admin/sso/providers/[id].put.ts`         | PUT    | ✅ 已完成 | 更新提供商                     |
|                   | `server/api/admin/sso/providers/[id].delete.ts`      | DELETE | ✅ 已完成 | 删除提供商                     |
| **Auth**          | `server/api/auth/[...all].ts`                        | ALL    | 🔴 未开始 | **核心认证流程** (Better-Auth) |
| **File**          | `server/api/file/upload.post.ts`                     | POST   | 🔴 未开始 | 文件上传                       |
| **OAuth**         | `server/api/oauth/consents.get.ts`                   | GET    | 🔴 未开始 | 获取授权信息                   |
|                   | `server/api/oauth/revoke-consent.post.ts`            | POST   | 🔴 未开始 | 撤销授权                       |
|                   | `server/api/oauth/client/[id].get.ts`                | GET    | 🔴 未开始 | 获取客户端公开信息             |
| **Social**        | `server/api/social/providers.get.ts`                 | GET    | 🔴 未开始 | 获取可用社交登录               |
| **SSO**           | `server/api/sso/providers/available.ts`              | GET    | 🔴 未开始 | 获取可用 SSO 提供商            |
| **System**        | `server/api/index.ts`                                | GET    | 🔴 未开始 | 健康检查/首页                  |

### 2. 完善 Composables 测试 (P1)

随着重构将逻辑从 Vue 组件移至 Composables，Composables 的测试变得至关重要。

-   **策略**: 使用 `vi.mock` 模拟 `useFetch`, `navigateTo`, `useRuntimeConfig` 等 Nuxt 内置组合式函数。
-   **重点目标**:
    -   `useLoginFlow`, `useRegisterFlow`
    -   `useDataTable`
    -   `useForm` (已部分完成)

### 3. 补充 Server Utils 测试 (P2)

-   **重点目标**:
    -   `server/utils/email` (完善边界情况)
    -   `server/utils/logger` (确保日志逻辑正确)
    -   `server/utils/sms/providers` (Mock 外部 API 调用)

### 4. 组件测试 (P3)

-   **策略**: 优先测试 `components/base` 基础组件，确保 UI 交互逻辑正确。业务组件主要依赖 Composables 测试。

## 测试规范

### 单元测试 (Unit Tests)

-   **路径**: `tests/unit/**/*.spec.ts`
-   **原则**:
    -   隔离外部依赖 (Database, API, Third-party services)。
    -   专注于单一函数或类的逻辑。
    -   覆盖所有分支 (Branches)。

### 集成测试 (Integration Tests)

-   **路径**: `tests/integration/**/*.spec.ts` (或 `tests/e2e`)
-   **原则**:
    -   测试模块间的协作。
    -   可以使用内存数据库 (SQLite :memory:) 或 Docker 容器。

## 运行测试

```bash
# 运行所有测试
pnpm test

# 运行带覆盖率报告的测试
pnpm test:coverage
```

## 覆盖率配置

在 `vitest.config.ts` 中配置：

```typescript
export default defineVitestConfig({
    test: {
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "**/node_modules/**",
                "**/dist/**",
                "**/.nuxt/**",
                "**/*.d.ts",
                "**/*.config.ts",
                "tests/**",
                "coverage/**",
                "public/**",
                "assets/**",
                "scripts/**",
                "virtual:**",
                "**/*.mjs",
                ".output/**",
                ".vercel/**",
                ".vitepress/**",
            ],
        },
    },
});
```
