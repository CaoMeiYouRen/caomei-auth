# 草梅 Auth 项目规范 (Specifications)

本文档旨在统一项目的开发、测试及文档编写标准，确保代码质量和团队协作效率。

## 1. 开发规范 (Development Specifications)

### 1.1 核心原则

-   **类型安全**: 强制使用 TypeScript 进行开发。严禁使用 `any` 类型，优先使用 `unknown` 或具体的类型定义及类型收窄函数。
-   **代码结构**: 尽可能使用 `return` 提前结束函数执行，减少嵌套层级。维持逻辑的平坦性。
-   **最小变更**: 改动代码时应遵循最小变更原则，避免引入不必要的复杂性。

### 1.2 命名与格式

-   **文件命名**: 优先使用全小写字母和连字符（kebab-case），如 `my-component.vue`。
-   **目录结构**:
    -   `components/`: Vue 组件。
    -   `pages/`: Nuxt 页面。
    -   `server/`: 后端逻辑（API、数据库实体、中间件）。
    -   `utils/`: 通用工具函数。
-   **代码风格**: 遵循 `ESLint` 和 `Stylelint` 规则。提交前需运行 `pnpm lint` 检查。

### 1.3 技术栈约束

-   **框架**: Nuxt 3 (Vue 3 + Nitro)。
-   **样式**: SCSS。优先使用现有样式变量和混合宏（mixins）。图标库使用 `@mdi/font`。
-   **核心依赖**:
    -   常用工具: `lodash-es`
    -   时间日期: `dayjs`
    -   文件系统: `fs-extra`
    -   电话校验: `google-libphonenumber`
    -   日志管理: `logger` 模块
-   **数据库**: TypeORM (支持 PostgreSQL, MySQL, SQLite)。

### 1.4 API 与 数据交互

-   **页面导航**: 优先使用 `navigateTo`。
-   **数据获取**: 在 SSR 场景下优先使用 `useFetch`。
-   **请求方法**: 优先使用项目封装的 `fetch` 逻辑。

### 1.5 版本控制

-   **分支管理**: 主分支为 `master`，功能开发使用 `feature/<功能描述>` 分支。
-   **提交规范**: 符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范。推荐使用 `pnpm commit` (Commitizen)。

---

## 2. 测试规范 (Testing Specifications)

### 2.1 测试框架

-   统一使用 **Vitest** 作为测试运行器。

### 2.2 测试分类

-   **单元测试 (Unit)**: 针对独立函数、工具类。存放在 `tests/unit/`，测试文件名与源文件对应，后缀为 `.spec.ts`。
-   **集成测试 (Integration)**: 针对多个模块或 API 路由的协作。存放在 `tests/integration/`。
-   **E2E 测试 (End-to-End)**: 针对关键业务流程（登录、授权等）。存放在 `tests/e2e/`。

### 2.3 测试流程与实践

-   **隔离依赖**: 必须使用 `vi.mock` 模拟外部服务（如邮件、短信、第三方 API）。
-   **环境重置**: 使用 `beforeEach` 调用 `vi.clearAllMocks()` 和 `vi.resetModules()`（若有顶层副作用）。
-   **代码校验**: 在合并请求前，确保所有相关测试在本地并通过 `pnpm test`。

---

## 3. 文档规范 (Documentation Specifications)

### 3.1 文档类型

-   **项目规划**: `docs/PLAN.md` 记录功能特性和当前待办。
-   **API 参考**: 存放于 `docs/api/`，按功能模块划分子目录。
-   **开发与架构**: 存放于 `docs/architecture/` 和 `docs/development/`。
-   **用户手册**: `docs/usage/`。

### 3.2 编写要求

-   **格式**: 统一使用 Markdown。
-   **语言**: 优先使用中文，专业术语可保留英文。
-   **同步更新**: 代码功能改动、依赖更新或流程调整时，相关文档必须同步更新。
-   **代码示例**: 文档中的代码片段应注明语言类型，并保持与实际代码逻辑一致。
-   **流程可视化**: 复杂逻辑建议使用 Mermaid 语法绘制流程图或时序图。

---

## 4. 变更管理 (Change Management)

-   **改动评估**: 重大改动前应询问用户或团队核心成员，并评估对现有功能的影响。
-   **破坏性变更**: 若改动会破坏现有功能且不可避免，必须在文档或提交信息中明确注明。
