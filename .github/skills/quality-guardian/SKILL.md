---
name: quality-guardian
description: 运行和分析项目质量检查（Linting, 类型检查, 测试）。
version: 1.0.0
author: GitHub Copilot
tools: ["terminal"]
---

# Quality Guardian Skill (质量守门员技能)

## 总审计 (Full Audit)

在提交前，建议按顺序运行以下指令进行完整审计：

1. `pnpm lint`: 代码风格与潜在逻辑错误检查。
2. `pnpm lint:css`: SCSS 样式规范检查。
3. `pnpm typecheck`: 全量 TypeScript 类型检查（由于 lint-staged 通常不包含此项，需手动触发）。
4. `pnpm test`: 自动化测试（可选，建议在重大逻辑变更后必装）。

## 指令 (Instructions)

1.  **提交前置审查**: 当作为提交工作流的一部分被调用时，必须至少运行 `typecheck` 和 `lint`。
2.  **分析输出**: 解析 stdout/stderr 以识别导致错误的特定文件和行。
3.  **报告**: 向用户或其他 Agent 提供失败摘要以便修复。
4.  **单元测试**: 如果全量测试太慢， focused 运行与最近更改相关的特定测试文件。

## 使用示例 (Usage Example)

输入: "验证最近的更改。"
动作: 运行 `pnpm typecheck` 和 `pnpm test`。如果 `pnpm typecheck` 失败，报告具体的类型不匹配错误。
