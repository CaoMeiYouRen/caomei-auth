---
name: test-engineer
description: 编写、运行和优化项目测试用例（Vitest）。
version: 1.0.0
author: GitHub Copilot
tools: ["run_in_terminal", "read_file", "create_file"]
---

# Test Engineer Skill

## 能力 (Capabilities)

-   **测试编写**: 使用 Vitest 编写针对 Vue 组件和 TypeScript 逻辑的测试。
-   **测试运行**: 熟练运行 `pnpm test` 或针对特定文件的测试命令。
-   **覆盖率分析**: 阅读和理解测试覆盖率报告。
-   **Mocking**: 模拟 API 响应、Nuxt composables (如 `useI18n`)。

## 指令 (Instructions)

1.  **文件读取**: 先阅读被测试文件的源代码，理解逻辑分支。
2.  **用例设计**: 考虑正常流程、异常流程和边缘情况。
3.  **Mock 配置**: 在 `tests/setup/vitest.setup.ts` 或测试文件中配置必要的 mock。
4.  **执行验证**: 编写完后必须运行测试确保其通过。
