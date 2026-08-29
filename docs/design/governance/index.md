# 治理与规划 (Governance)

本目录存放草梅 Auth 项目的治理决策与规划文档，包括 AI 基建、架构演进、依赖治理等跨模块的评估与计划。

## 文档列表

-   [AI 基建优化规划](./ai-infrastructure-optimization.md): Skills / Agents / 项目规范 / i18n 规划的评估与分批复核清单。
-   [TypeORM 0.3 → 1.0 升级规划](./typeorm-1.0-upgrade.md): typeorm major 跨级升级的风险评估、四阶段执行路径、验证矩阵与回滚方案。dependabot 已配置 ignore（参考 `.github/dependabot.yml`）。
-   [better-auth 1.7 升级规划](./better-auth-1.7-upgrade.md): better-auth 1.6 → 1.7 minor 跨级升级的风险评估、四阶段执行路径、验证矩阵与回滚方案。`package.json` 已锁定 `~1.6.30`，dependabot 已配置 ignore。
