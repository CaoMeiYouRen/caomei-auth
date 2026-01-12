---
name: conventional-committer
description: 暂存更改并生成符合 Conventional Commits 规范的提交消息。
version: 1.0.0
author: GitHub Copilot
tools: ["terminal"]
---

# Conventional Committer Skill (规范提交技能)

## 能力 (Capabilities)

-   **暂存 (Staging)**: 将修改后的文件添加到 git 暂存区。
-   **消息生成**: 创建遵循 `type(scope): description` 格式的提交消息 (例如: `feat(auth): add login page`)。
-   **提交 (Committing)**: 执行 `git commit`。

## 指令 (Instructions)

1.  **提交前检查**: 在执行任何 git 提交操作前，确认 `@quality-guardian` 已经通过了 `pnpm typecheck` 和 `pnpm lint`。如果尚未执行，应提示 Agent 或用户先完成质量核查。
2.  **验证状态**: 检查 `git status` 查看哪些内容需要暂存。
3.  **生成消息**: 分析更改以确定 `type` (feat, fix, docs, style, refactor, test, perf, build, ci, chore, revert), `scope` (可选, 例如: 组件名, 模块) 和 `description`。
4.  **提交**: 运行 `git commit -m "..."`。
5.  **验证**: 确保消息符合 `commitlint.config.ts`。

## 使用示例 (Usage Example)

输入: "提交新的用户资料功能。"
动作: `git add .`, 分析变更, 生成消息 `feat(user): 实现带有头像上传功能的用户个人资料页面`, `git commit`。
