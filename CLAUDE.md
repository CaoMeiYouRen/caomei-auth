# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供平台适配指导。
项目级规则以 [AGENTS.md](./AGENTS.md) 为唯一权威事实源，本文件不重复定义，仅作平台适配与快速入口。

## 平台适配说明

### Claude 目录发现与回退

- **主定义目录**: 治理上以 `.github/agents/` 与 `.github/skills/` 为主定义
- **优先目录**: Claude Code 应优先读取 `.claude/agents/` 与 `.claude/skills/`
- **回退目录**: 若对应定义不存在，回退读取 `.github/agents/` 与 `.github/skills/`
- **镜像约束**: `.claude/` 中的文件名、职责边界和推荐路径必须与 `.github/` 主定义保持一致（由 `scripts/setup-ai.mjs` 维护链接）

### 冲突处理

- `AGENTS.md` 是唯一权威事实源
- 若本文件与 `AGENTS.md` 存在冲突，一律以 `AGENTS.md` 为准
- 本文件只允许补充：目录发现顺序、工具能力差异、加载回退与降级策略

## 常用命令（快速参考）

| 分类 | 命令 | 说明 |
|------|------|------|
| 开发 | `pnpm dev` | 启动开发服务器 |
| 开发 | `pnpm build` | 构建生产版本 |
| 测试 | `pnpm test` | 运行所有测试 |
| 质量 | `pnpm lint` | ESLint 检查与修复 |
| 质量 | `pnpm lint:css` | Stylelint 检查与修复 |
| 质量 | `pnpm typecheck` | TypeScript 类型检查 |
| 文档 | `pnpm docs:dev` | 启动文档开发服务器 |

完整命令与规范请阅读 [AGENTS.md](./AGENTS.md)。

## Git Commit Rules

- **严禁**在提交信息中添加任何表明信息由 AI 生成的内容（例如 "Written by Claude", "AI-generated" 等）。
- **不要**添加 "Signed-off-by" 或 "Co-authored-by" 页脚，除非明确要求。
- **直接输出**提交信息，不要包含任何介绍性文字。
- **禁止擅自推送**: `git commit` 后不得自动执行 `git push`，除非用户明确要求。提交后应止步于本地 commit 并告知用户。
- 提交必须符合 Conventional Commits 规范，使用 `conventional-committer` skill 执行。

## 相关文档

| 文档 | 用途 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 唯一权威事实源：角色矩阵、PDTFC 循环、安全红线、提交规范 |
| [开发规范](./docs/standards/development.md) | 开发规范、技术栈指南、代码生成准则 |
| [测试规范](./docs/standards/testing.md) | 测试规范 |
| [国际化实施方案](./docs/standards/i18n.md) | i18n 规划 |
| [AI 基建优化规划](./docs/design/governance/ai-infrastructure-optimization.md) | Skills / Agents / 规范体系演进规划 |
