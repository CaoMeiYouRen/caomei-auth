# 开发规范 (Development Specifications)

本文档规定了项目的开发标准，旨在确保代码库的质量、可维护性和类型安全性。

## 1. 核心原则

-   **类型安全**: 强制使用 TypeScript 进行开发。
    -   严禁使用 `any` 类型。
    -   优先使用 `unknown` 或具体的类型定义。
    -   使用类型收窄函数（Type Guards）确保运行时安全。
-   **函数设计**:
    -   尽可能使用 `return` 提前结束函数执行，减少嵌套层级。
    -   维持逻辑的平坦性，提高可读性。
-   **变更管理**: 改动代码时应遵循最小变更原则，避免引入不必要的复杂性或副作用。

## 2. 命名与格式

-   **文件命名**: 优先使用全小写字母和连字符（kebab-case），如 `my-component.vue`。
-   **目录结构**:
    -   `components/`: Vue 组件。遵循 kebab-case 命名。
    -   `pages/`: Nuxt 页面。路径即路由。
    -   `server/`: 后端逻辑，包含 API、数据库实体、中间件等。
    -   `utils/`: 通用工具函数（前后端共享或前端专用）。
    -   `server/utils/`: 后端专用工具函数。
-   **代码风格**:
    -   遵循 `ESLint` 和 `Stylelint` 规则。
    -   使用项目预设的 `eslint-config-cmyr` 和 `stylelint-config-cmyr`。
    -   提交代码前必须通过 `pnpm lint` 检查。

## 3. 技术栈约束

-   **核心框架**: Nuxt 3 (Vue 3 + Nitro)。
-   **样式方案**: SCSS。
    -   优先使用 `styles/` 目录中的变量和混合宏（mixins）。
    -   图标库统一使用 `@mdi/font`。
-   **核心依赖使用指南**:
    -   常用工具: `lodash-es`
    -   时间日期: `dayjs`
    -   文件系统: `fs-extra`
    -   电话校验: `google-libphonenumber`
    -   日志记录: 内部 `logger` 模块
-   **数据库**: TypeORM。支持多种数据库（PostgreSQL, MySQL, SQLite）。

## 4. API 与 数据交互

-   **页面导航**: 优先使用 `navigateTo`，避免直接操作 `router`。
-   **数据预取**: 在 SSR 场景下优先使用 `useFetch` 或 `useAsyncData`。
-   **请求方法**: 优先使用项目封装的 `fetch` 逻辑，确保统一的错误处理和日志记录。

## 5. 版本控制与提交

-   **分支管理**:
    -   主分支: `master`
    -   功能开发: `feature/<功能描述>`
-   **提交规范**: 符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
    -   使用 `pnpm commit` (Commitizen) 引导提交。
    -   提交信息应清晰描述改动目的。
