# 项目设计 (Design)

本文档概括了草梅 Auth 的核心设计理念，是系统架构、接口、数据库及 UI 设计的入口。

## 核心设计

### 1. [架构设计](./architecture)

详细描述了系统的分层架构、模块解耦逻辑（G1 重构）及核心流程控制。

### 2. [数据库设计](./database)

详细介绍了数据库实体关系图 (ERD)、表结构定义及关键业务字段说明。

### 3. [接口设计 (API)](../api/)

系统对外提供的 RESTful API 规范、认证请求流程及错误码定义。

### 4. [UI/UX 设计](./ui-ux)

包含项目的视觉规范、主题色方案、响应式适配策略及核心组件设计细节。

### 5. [特殊模式设计](./demo-mode)

有关演示模式 (Demo Mode) 的实现方案，包括数据拦截与仿真逻辑。

### 6. [治理与规划 (Governance)](./governance)

AI 基建、依赖治理、架构演进等决策与规划文档。

-   [AI 基建优化规划](./governance/ai-infrastructure-optimization.md): Skills / Agents / 项目规范 / i18n 规划的评估与分批复核清单。
-   [PrimeVue → caomei-ui 迁移评估](./governance/2026-11-05-caomei-ui-migration-evaluation.md): 组件库迁移的现状盘点、逐组件映射、主题 / 测试耦合、分阶段计划与风险。
-   [i18n 评估与实施方案](./governance/2026-11-05-i18n-evaluation.md): 原 i18n 规划的复核修订、Locale Registry、模块化消息、Zod v4 错误本地化、服务端 / 邮件方案与批次。
-   [阶段 2 范围登记：安全收口与迁移预备](./governance/2026-11-05-phase2-registration.md): 当前阶段的 5 条主线 / 11 条原子条目、验收与边界。
-   [CodeQL #20 复核记录](./governance/2026-11-05-codeql-20-review.md): `js/insufficient-password-hash` 误报判定依据、dismiss 处置与慢哈希迁移取舍。
-   [覆盖率基线复测与目标校准](./governance/2026-11-05-coverage-baseline.md): 2026-11-05 复测数据、按范围设下限的阶段目标与定向补测优先级。
-   [caomei-ui 迁移 P0 基线与护栏](./governance/2026-11-05-caomei-ui-p0-baseline.md): 用量快照脚本、路由白名单初值、1.0.0 精确锁定与回退方案。
-   [caomei-ui P2 视觉基线方案](./governance/2026-11-05-caomei-ui-p2-visual-baseline-plan.md): 截图矩阵、已知预期差异与差异登记放行规则（不建截图工程）。
-   [i18n 技术验证记录](./governance/2026-11-05-i18n-verification.md): `@nuxtjs/i18n@10` 接入验证、Zod per-parse map 结果与 M2 准入结论。
