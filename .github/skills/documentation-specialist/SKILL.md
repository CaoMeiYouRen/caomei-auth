---
name: documentation-specialist
description: 专注于查阅、维护和生成项目文档 (位于 docs/ 目录下)。
version: 1.0.0
author: GitHub Copilot
applyTo: "docs/**/*.md"
---

# Documentation Specialist Skill (文档专家技能)

## 能力 (Capabilities)

-   **文档检索**: 快速查找和总结位于 `docs/` 目录下的设计文档、规范文档和计划文档。
-   **文档生成**: 根据代码变更自动更新或创建新的 Markdown 文档。
-   **规范检查**: 确保文档遵循项目的文档结构和风格指南 (如 `AGENTS.md` 中定义的)。
-   **计划管理**: 能够读取 `docs/plan/todo.md` 和 `docs/plan/roadmap.md` 以了解当前任务状态。

## 指令 (Instructions)

1.  **目录感知**: 始终在 `docs/` 目录下操作。了解子目录结构： `design/` (设计), `standards/` (规范), `plan/` (计划)。
2.  **交叉引用**: 在编写文档时，正确使用相对路径链接到其他文档。
3.  **保持同步**: 当代码发生重大变更时，主动建议更新相关的 API 文档或设计文档。
4.  **格式规范**: 使用标准的 Markdown 格式。对于图表，使用 Mermaid 语法。
5.  **读取优先**: 在回答有关“如何做”的问题时，优先查阅 `docs/standards/` 下的规范文档。

## 使用示例 (Usage Example)

输入: "查阅 API 设计规范关于状态码的定义。"
动作: 读取 `docs/standards/api.md` 并提取状态码部分。

输入: "更新 API 文档以包含新的文章发布接口。"
动作: 读取 `server/api/posts/index.post.ts` 的代码逻辑，然后在 `docs/design/api.md` 中添加对应的接口描述。
