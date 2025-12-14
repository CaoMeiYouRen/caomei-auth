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

### 1. 优先填补 Server API 测试 (P0)

Server API 是系统的核心业务逻辑入口，目前覆盖率为 0。

-   **策略**: 使用 `@nuxt/test-utils` 的 `server` 测试能力或直接模拟 `H3Event` 进行单元测试。
-   **重点目标**:
    -   ✅ `server/api/admin/sync-admin-role.post.ts` (100% 覆盖，作为 Pilot)
    -   [ ] `server/api/admin/logs/stats.get.ts` (统计接口)
    -   [ ] `server/api/admin/oauth/applications/index.get.ts` (OAuth 应用列表)
    -   [ ] `server/api/admin/oauth/applications/index.post.ts` (创建 OAuth 应用)
    -   `server/api/auth/*` (登录、注册、注销)
    -   `server/api/admin/*` (用户管理、配置管理)
    -   `server/api/oauth/*` (OAuth 流程)

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
