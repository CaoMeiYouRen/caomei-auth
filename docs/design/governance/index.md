# 治理与规划 (Governance)

本目录存放草梅 Auth 项目的治理决策与规划文档，包括 AI 基建、架构演进、依赖治理等跨模块的评估与计划。

## 文档列表

-   [AI 基建优化规划](./ai-infrastructure-optimization.md): Skills / Agents / 项目规范 / i18n 规划的评估与分批复核清单。
-   [PrimeVue → caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md): 组件库迁移的现状盘点、逐组件映射、主题 / 测试耦合、分阶段计划与风险。
-   [i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md): 基于原 i18n 规划的复核修订、Locale Registry、模块化消息、Zod v4 错误本地化、服务端 / 邮件方案与批次。
-   [阶段 2 范围登记：安全收口与迁移预备](./2026-11-05-phase2-registration.md): 阶段 2 的 5 条主线 / 11 条原子条目、验收、依赖与不做范围（2026-11-06 完成归档）。
-   [阶段 3 收口记录：caomei-ui P2–P3 与 i18n 非组件面](./2026-11-09-phase3-closure.md): 九条路由白名单、包体 / 用量复测、视觉 50/50、i18n 交付、回退证据与遗留项（2026-11-09 收口，M0-3 待定时验证）。
-   [阶段 4 范围登记：caomei-ui P4 Admin 与 P5 单库收尾](./2026-11-10-phase4-registration.md): P4 Admin 数据页、P5 卸载 PrimeVue 的 15 条原子条目、验收、依赖与回退策略（2026-11-14 收口）。
-   [阶段 4 收口记录：P5 单库收尾与阶段归档](./2026-11-14-phase4-closure.md): 最终包体、视觉、护栏终态、验证、回退与遗留（2026-11-14）。
-   [P4-0 技术方案：Admin 数据页迁移基座](./2026-11-10-p4-admin-migration-plan.md): DataTable / Dialog / DatePicker / 暗色主题 / 视觉夹具 / 白名单的验证项与退出条件。
-   [P4-0 决策记录：Admin 迁移基座](./2026-11-10-p4-0-decisions.md): DataTable / Dialog / DatePicker / Toast 映射、Admin token 契约、视觉矩阵与白名单判定点。
-   [视觉参考态基座](./2026-11-08-visual-baseline-harness.md): 自基线与参考态两层的边界、矩阵、命令、差异处置与已知限制。
-   [P4 交付摘要与收口](./2026-11-14-p4-closure.md): P4 交付范围、最终白名单、剩余 PrimeVue 清单、包体 / 视觉 / 回退与遗留项。
-   [TypeORM 0.3 → 1.0 升级规划](./typeorm-1.0-upgrade.md): typeorm major 跨级升级的风险评估、四阶段执行路径、验证矩阵与回滚方案。dependabot 已配置 ignore（参考 `.github/dependabot.yml`）。
-   [better-auth 1.7 升级规划](./better-auth-1.7-upgrade.md): better-auth 1.6 → 1.7 minor 跨级升级的风险评估、四阶段执行路径、验证矩阵与回滚方案。`package.json` 已锁定 `~1.6.30`，dependabot 已配置 ignore。
