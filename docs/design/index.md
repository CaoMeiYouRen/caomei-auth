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
-   [caomei-ui 1.2.0 复核记录](./governance/2026-11-08-caomei-ui-1.2.0-revaluation.md): 1.1.0 / 1.2.0 能力变化、导出面差分、对 DatePicker / Toast / Form / DataTable 口径的修订与升级验证。
-   [发布链路原生多架构评估](./governance/2026-11-08-native-multiarch-docker-review.md): issue #718 的入口核验、方案比较与方案 C 复用工作流落地（已排期阶段 3 插队，待工作流验证）。
-   [i18n 评估与实施方案](./governance/2026-11-05-i18n-evaluation.md): 原 i18n 规划的复核修订、Locale Registry、模块化消息、Zod v4 错误本地化、服务端 / 邮件方案与批次。
-   [阶段 2 范围登记：安全收口与迁移预备](./governance/2026-11-05-phase2-registration.md): 阶段 2 的 5 条主线 / 11 条原子条目、验收与边界（2026-11-06 完成归档）。
-   [阶段 3 范围登记：caomei-ui P2–P3 迁移与 i18n 非组件面](./governance/2026-11-06-phase3-registration.md): 阶段 3 的 6 条主线 / 16 条原子条目 + M0 发布链路插队 4 条、两项决策裁定、验收与边界（2026-11-06 授权启动；2026-11-08 插队 M0）。
-   [CodeQL #20 复核记录](./governance/2026-11-05-codeql-20-review.md): `js/insufficient-password-hash` 误报判定依据、dismiss 处置与慢哈希迁移取舍。
-   [覆盖率基线复测与目标校准](./governance/2026-11-05-coverage-baseline.md): 2026-11-05 复测数据、按范围设下限的阶段目标与定向补测优先级。
-   [caomei-ui 迁移 P0 基线与护栏](./governance/2026-11-05-caomei-ui-p0-baseline.md): 用量快照脚本、路由白名单初值、`1.2.0` 精确锁定（2026-11-08 升级）与回退方案。
-   [caomei-ui P2 视觉基线方案](./governance/2026-11-05-caomei-ui-p2-visual-baseline-plan.md): 截图矩阵、已知预期差异与差异登记放行规则（口径已由「视觉参考态基座」替代）。
-   [视觉参考态基座](./governance/2026-11-08-visual-baseline-harness.md): 迁移前参考态 + 当前自基线两层快照、固定环境、采集 / 比对命令与差异处置纪律。
-   [阶段 4 范围登记：P4 Admin 与 P5 单库收尾](./governance/2026-11-10-phase4-registration.md): 阶段 4 的 2 条主线 / 15 条原子条目、验收、回退与视觉策略。
-   [P4-0 Admin 迁移基座决策](./governance/2026-11-10-p4-0-decisions.md): DataTable / Dialog / DatePicker 映射、Admin 暗色 token 契约、PrimeVue 暗色选择器修复、Admin 视觉矩阵与 P4-1 任务单。
-   [P4-0 Admin 迁移基座技术方案](./governance/2026-11-10-p4-admin-migration-plan.md): P4 开工前的风险验证项、执行顺序与交付物。
-   [i18n 技术验证记录](./governance/2026-11-05-i18n-verification.md): `@nuxtjs/i18n@10` 接入验证、Zod per-parse map 结果与 M2 准入结论。
-   [阶段 2 UI 视觉审查](./governance/2026-11-05-ui-visual-review.md): 语言切换、暗色主题、社交按钮与 caomei-ui 基座的视觉回归结论。
-   [SSO 历史配置排查记录](./governance/2026-11-06-sso-audit.md): 部署实例 provider 数量、可疑项判定与 M1-2 完成结论。
