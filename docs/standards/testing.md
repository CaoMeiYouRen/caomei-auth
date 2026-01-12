# 测试规范 (Testing Specifications)

本文档定义了项目的测试策略和规范，确保功能的正确性和系统的稳定性。

## 1. 测试框架

-   **运行器**: 统一使用 **Vitest** 作为测试运行和断言框架。
-   **环境**: 端到端测试可能涉及 Playwright。

## 2. 测试分类

-   **单元测试 (Unit Tests)**:
    -   对象: 独立函数、工具类、纯逻辑模块。
    -   位置: `tests/unit/`。
    -   规则: 测试文件名需与被测文件一一对应，并添加 `.spec.ts` 后缀。
-   **集成测试 (Integration Tests)**:
    -   对象: 多个模块的协作、API 路由逻辑、数据库交互。
    -   位置: `tests/integration/`。
-   **E2E 测试 (End-to-End Tests)**:
    -   对象: 用户的关键操作路径（如：登录流程、授权确认、注册流程）。
    -   位置: `tests/e2e/`。

## 3. 测试实践准则

-   **隔离外部依赖**:
    -   测试中严禁发起真实的外部请求（邮件发送、短信、第三方 OAuth 服务）。
    -   必须使用 `vi.mock` 进行模拟。
-   **副作用管理**:
    -   在每个测试用例前 (`beforeEach`) 必须重置 Mock 状态：`vi.clearAllMocks()`。
    -   如果涉及顶层模块残留状态，使用 `vi.resetModules()`。
-   **断言质量**:
    -   断言应具有针对性，避免过度断言。
    -   错误边界必须包含在测试覆盖范围内。

## 4. 自动化与质量指标

-   **Pre-commit**: 在提交代码或合并 PR 之前，应在本地运行 `pnpm test` 确保无回归错误。
-   **覆盖率**: 重要核心逻辑（如 Auth、Database Utils）应维持高覆盖率。

---

## 5. 测试工作流 (Testing Workflow)

编写测试用例时应遵循以下步骤：

### 5.1 分析目标代码

-   **确定类型**: 业务逻辑推荐单元测试 (`tests/unit/`)，多模块协作推荐集成测试 (`tests/integration/`)。
-   **识别依赖**: 识别外部库 (`fs`, `fetch`, `nodemailer`)、环境依赖 (`process.env`) 及副作用。

### 5.2 创建测试文件

-   **路径规范**: 与源代码路径对应。例如：`server/utils/logger.ts` 对应 `tests/unit/server/logger.spec.ts`。

### 5.3 Mock 最佳实践

-   **外部库**: 使用 `vi.mock("lib-name")`。
-   **环境配置**: 如果模块在顶层读取环境配置，需结合 `vi.resetModules()` 和动态 `import()`。
-   **文件系统**: 模拟 `fs` 时需同时处理 `default` 导出及具名导出以确保兼容性。

### 5.4 验证与重构

-   运行单个测试：`pnpm test <path-to-spec>`。
-   确保测试代码同样通过 `pnpm lint`。
