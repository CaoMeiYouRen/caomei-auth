# 新增测试用例流程

本文档总结了在 `caomei-auth` 项目中新增测试用例的通用流程，旨在帮助开发者快速上手并编写高质量的测试代码。

## 1. 分析目标代码

在编写测试之前，首先需要深入理解目标代码的逻辑和依赖关系。

-   **确定测试类型**：
    -   **单元测试 (Unit)**：针对单个函数、类或模块，隔离外部依赖。通常位于 `tests/unit/`。
    -   **集成测试 (Integration)**：测试多个模块间的协作。通常位于 `tests/integration/`。
-   **识别依赖**：
    -   **外部库**：如 `winston`, `nodemailer`, `twilio` 等。需要使用 `vi.mock` 进行模拟。
    -   **内部模块**：如 `utils/shared/env`。可能需要模拟导出值。
    -   **环境依赖**：如 `process.env`。需要使用 `vi.stubEnv` 或 `vi.resetModules`。
    -   **副作用**：如文件 I/O (`fs`)、网络请求 (`fetch`)、全局变量修改。必须在测试中进行拦截和模拟。

## 2. 创建测试文件

-   **路径规范**：测试文件应与源代码文件路径对应。
    -   源代码：`server/utils/logger.ts`
    -   测试代码：`tests/unit/server/logger.spec.ts`
-   **命名规范**：使用 `.spec.ts` 后缀。

## 3. 编写测试代码

### 3.1 基础结构

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 1. 模拟外部依赖 (必须在 import 目标模块之前)
vi.mock("fs", () => ({
    default: {
        existsSync: vi.fn(),
        // ...
    },
}));

describe("模块名称", () => {
    beforeEach(() => {
        // 每个测试用例前的重置工作
        vi.resetModules(); // 如果测试涉及模块级别的副作用（如顶层代码执行），必须重置
        vi.clearAllMocks();
    });

    it("应该完成某个功能", () => {
        // ...
    });
});
```

### 3.2 常用 Mock 技巧

-   **模拟第三方库**：

    ```typescript
    vi.mock("some-lib", () => ({
        default: {
            someMethod: vi.fn(),
        },
    }));
    ```

-   **模拟环境配置**：
    如果模块在导入时读取环境变量（顶层代码），需要结合 `vi.resetModules()` 和动态导入：

    ```typescript
    vi.mock("@/utils/shared/env", () => ({
        SOME_CONFIG: "mock-value",
    }));

    it("测试不同配置", async () => {
        vi.resetModules();
        // 重新 mock 配置
        vi.doMock("@/utils/shared/env", () => ({ SOME_CONFIG: "new-value" }));
        // 动态导入触发重新求值
        const module = await import("@/path/to/module");
        // ...
    });
    ```

-   **模拟文件系统 (fs)**：
    对于 `fs` 模块，建议模拟 `default` 导出以及具名导出，以兼容不同的导入方式：
    ```typescript
    vi.mock("fs", async (importOriginal) => {
        const actual = await importOriginal<typeof import("fs")>();
        return {
            ...actual,
            default: {
                ...actual,
                writeFileSync: vi.fn(),
            },
            writeFileSync: vi.fn(),
        };
    });
    ```

### 3.3 处理顶层副作用

如果目标模块在 `import` 时就会执行代码（例如创建目录、初始化 Logger），则需要在测试中使用 `vi.resetModules()` 并通过 `await import(...)` 动态加载模块，而不是在文件顶部静态 `import`。

## 4. 运行与调试

-   **运行单个测试文件**：
    ```bash
    pnpm test tests/unit/server/logger.spec.ts
    ```
-   **运行所有测试**：
    ```bash
    pnpm test
    ```
-   **验证代码质量**：
    测试通过后，必须确保测试代码通过 Lint 检查和类型检查：
    ```bash
    pnpm lint
    pnpm typecheck
    ```
-   **调试**：
    -   使用 `console.log` 输出中间状态。
    -   检查 Mock 函数的调用情况：`expect(fs.writeFileSync).toHaveBeenCalled()`。

## 5. 更新文档

测试通过后，请务必更新相关文档：

1.  **覆盖率文档**：更新 `docs/testing/coverage.md`，标记对应模块的状态为 `✅ 已完成` 或更新覆盖率数据。
2.  **路线图**：如果完成了 `docs/testing/roadmap.md` 中的规划项，请勾选对应任务。

## 6. 常见问题排查

-   **"No export named..."**：检查 Mock 的结构是否与实际模块导出匹配（注意 `default` 导出和具名导出的区别）。
-   **Mock 不生效**：检查 `vi.mock` 是否被提升（hoisted），或者是否在 `import` 之前执行。对于顶层副作用，确保使用了 `vi.resetModules()`。
-   **类型错误**：在 Mock 定义中使用 `vi.fn()` 时，TypeScript 可能无法推断类型。可以使用 `as unknown as Mock` 进行断言，或者完善 Mock 的类型定义。
