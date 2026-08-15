# GitHub Copilot Workspace Instructions

本文件为 GitHub Copilot / Copilot Workspace 的适配入口，只提供最小执行门禁与平台差异说明，完整项目级规则以 [AGENTS.md](../AGENTS.md) 与 `docs/standards/` 规范文档为准。

## 使用边界

1.  先读取 [AGENTS.md](../AGENTS.md)：项目级 AI 行为准则、PDTFC 循环、角色边界与安全红线均以该文件为准。
2.  本文件只包含 Copilot 平台的最小执行门禁，不重复编写 `AGENTS.md`、[开发规范](../docs/standards/development.md)、[API 规范](../docs/standards/api.md)、[测试规范](../docs/standards/testing.md) 中已定义的内容。
3.  若本文件与 [AGENTS.md](../AGENTS.md) 冲突，以 [AGENTS.md](../AGENTS.md) 为准。

## 最小执行门禁

1.  规划准入：先读 [docs/plan/todo.md](../docs/plan/todo.md)、[docs/plan/roadmap.md](../docs/plan/roadmap.md)，确认任务归属与验收标准。
2.  代码实现：再读 [docs/standards/development.md](../docs/standards/development.md)、[docs/standards/api.md](../docs/standards/api.md)、[docs/standards/testing.md](../docs/standards/testing.md)；UI 文本必须遵循 [国际化实施方案](../docs/standards/i18n.md)。
3.  文档同步：涉及 README / Standards / Plan / Design 变更时，先读 [docs/standards/documentation.md](../docs/standards/documentation.md)。
4.  默认开发路径：代码实现默认由 `@full-stack-master` 统一负责；涉及 CI/CD、Docker 与环境配置时，遵循 [开发规范 - 技术栈指南](../docs/standards/development.md)。
5.  提交前检查：`pnpm lint`、`pnpm lint:css`、`pnpm typecheck` 与必要的定向测试必须通过；提交消息符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范且使用中文描述。

## 目录约定

1.  `.github/agents/` 与 `.github/skills/` 是 agent / skill 主定义目录。
2.  `.claude/agents/`、`.claude/skills/`、`.opencode/agents/`、`.opencode/skills/` 与 `.agents/` 均为平台兼容镜像（以链接形式指向 `.github/` 主定义，由 `scripts/setup-ai.mjs` 维护），不得独立扩展职责边界。
3.  如需要 GitHub Copilot 专属补充能力，只写平台差异说明与加载回退，不重复项目级规范。
