# 2026-11-23 阶段 13 范围登记：可观测性规模化与运维闭环

> **状态**：2026-11-23 登记，进行中（M1.1 已交付）。§2 的 D26–D32 为拟定口径，随登记生效；如用户改判，M1 开工前同批更新本文件、[todo.md](../../plan/todo.md) 与 [security-observability.md](../security-observability.md)。
> **依据**：[backlog §3.1](../../plan/backlog.md)（依赖告警 / 发布门禁）、[backlog §3.3](../../plan/backlog.md)（登录事件索引 / 聚合 / 多方言清理 / 可视化基线）、[阶段 12 收口记录](./2026-11-23-phase12-closure.md)（未覆盖边界）、[安全可观测性口径](../security-observability.md)。
> **规划模型**：5 大条目 / 13 小条目（[规划规范](../../standards/planning.md) §4 / §7 / §8）。

## 1. 目标

- 把阶段 12 交付的登录事件从「可用」推进到「可持续运行」：查询走索引、统计与热力图在数据库侧聚合、保留期清理支持三方言。
- 闭合阶段 12 登记的运维缺口：`docker-publish` 重建路径接入安全告警门禁，3 条 medium 依赖告警收敛或写入明确延期口径。
- 补齐事件可视化与可信设备管理端的回归基线，避免后续改动无声漂移。
- 不改变事件模型、权限矩阵、2FA 行为与现有 API 响应形态；本阶段只做性能、索引、运维与回归基座。

## 2. 决策记录（拟定，2026-11-23）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D26 | IP 列类型与索引 | `login_event.ip` 由 `text` 改为 `varchar(45)`，新增 `(ip, created_at)` 复合索引；同步实体、三方言 `create.sql` 与 `database.md` 的 ALTER 指引。SQLite 动态类型不受影响，MySQL / PostgreSQL 需执行 ALTER。**不新增隐式时间窗**：IP-only 查询由复合索引按 `created_at` 有序覆盖（`id` 次级排序在 SQLite 等方言仍可能走临时排序，见 `database.md`），API 筛选语义保持不变；文档建议大时间跨度时显式带时间窗 | MySQL 无法对 `TEXT` 建全列索引；45 覆盖 IPv6 文本上限；强制加窗会改变既有 API 返回集合，需推翻兼容性而不划算 |
| D27 | 统计与热力图聚合位置 | `dailyTrend` 与热力图改为方言 SQL `GROUP BY` 聚合，JS 只补零桶与排序；响应字段、时区（UTC）与窗口上限不变 | 当前两者把窗口内全部 `createdAt` / `type` 拉入内存分桶，30 天大实例下随事件量线性增长；聚合下推后内存与传输只随桶数增长 |
| D28 | 多方言清理脚本 | `scripts/maintenance/prune-login-events.mjs` 增加 MySQL / PostgreSQL 分支，复用「方言客户端 + 参数化 DELETE」模式；保留默认 dry-run 与 `--confirm`，表名前缀仍受校验 | 阶段 12 M1.3 只支持 SQLite；服务端惰性清理已覆盖三方言，手动入口不应缺方言 |
| D29 | 发布门禁覆盖 | `docker-publish.yml` 的 `mode=build` 在构建前执行 `scripts/security/check-alerts.mjs`；`mode=retag` 复用已构建镜像，不重复扫描 | 当前只有 `docker.yml` / `release.yml` / 每周回归执行门禁，重建并推送生产镜像的路径绕过检查 |
| D30 | 依赖告警收敛 | 3 条 `medium` 按「可安全升级则升、否则写明延期与条件」处理：`glob` 优先 override 到 ≥14.0.2；`minimatch` 与 `@nuxt/schema`（嵌套 3.20.1）先验证工具链兼容再升级，不兼容则保留告警并在 backlog 记录触发条件 | 均为开发 / 构建链传递依赖，不阻塞发布；大版本跨越可能破坏 lint / build，需要用实际门禁验证而不是盲升 |
| D31 | 回归基线补充 | 热力图补 1440 桌面基线（含内部横向滚动口径）；可信设备管理端补一条非空态基线（视觉夹具预置设备）。其余矩阵扩展仍留 backlog | 阶段 12 只覆盖 1800 / 768 / 390 元素截图与可信设备空态；1440 是交互态基准宽度，非空态才能验证列表与吊销按钮布局 |
| D32 | 本阶段不做的边界 | 不做审计迁库 / 检索 UI / CSV、JSON 导出（维持 D25）；不做风险评分、异地告警、实时通知；不做 Redis / 多实例限流；不改事件枚举、权限矩阵与 2FA 行为；不做移动端会话表卡片化与 i18n 工程化（另立候选） | 保持阶段聚焦运维与性能；产品面能力需要单独授权与新决策 |

## 3. 现状取证（2026-11-23）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| IP 列 | 实体与三种方言 DDL 均为 `TEXT`，无 IP 索引；IP 精确筛选目前只能与时间窗组合（补齐复合索引后 IP-only 查询可按 `created_at` 有序翻页） | `server/entities/login-event.ts`（`ip` 为 `text`）、`database/mysql/create.sql`、`database/postgres/create.sql` |
| 统计趋势 | `dailyTrend` 用 `repository.find` 拉取窗口内 `createdAt` 后在 JS 按 UTC 天分桶 | `server/utils/login-events/repository.ts`（`getLoginEventStats`） |
| 热力图 | 同样 `find` 出 `type` + `createdAt` 后在 JS 分桶，7 天 / 30 天窗口全量载入 | `server/utils/login-events/repository.ts`（`getLoginEventHeatmap`） |
| 手动清理 | `prune-login-events.mjs` 仅用 `better-sqlite3`；服务端惰性清理走 TypeORM，已覆盖三方言 | `scripts/maintenance/prune-login-events.mjs`、`server/utils/login-events/retention.ts` |
| 发布门禁 | `docker-publish.yml` 的 `mode=build` 直接调用 `docker-build.yml`，无 `check-alerts` 步骤；门禁仅存在于 `docker.yml` / `release.yml` / `regression-weekly.yml` | `.github/workflows/docker-publish.yml:212`、`docker.yml:60` |
| 依赖告警 | `glob` 10.5.0（需 ≥14.0.2）、`minimatch` 10.2.6 / 9.0.9 / 3.1.5（需 ≥11.0.1）、`@nuxt/schema` 嵌套 3.20.1（需 ≥4.6.4，根为 4.6.4） | Dependabot 2026-11-23 报告；`pnpm-lock.yaml` |
| 视觉基线 | 热力图 3 视口（1800 / 768 / 390）× 浅暗共 6 张元素截图；可信设备仅安全页空态；管理端会话对话框基线存在但可信设备为空 | `tests/visual/baseline/admin-heatmap.visual.spec.ts`、`tests/visual/helpers/auth-matrix.ts`、`scripts/testing/visual-fixtures.mjs` |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 登录事件 IP 索引 | 2 | 列类型与复合索引、筛选与时间窗口径 |
| M2 | 统计与热力图方言聚合 | 3 | 趋势聚合、热力图聚合、三方言契约测试 |
| M3 | 运维脚本与发布门禁 | 3 | 多方言清理脚本、docker 重建门禁、依赖告警收敛 |
| M4 | 回归基线补充 | 2 | 1440 热力图基线、可信设备非空态基线 |
| M5 | 文档与阶段收口 | 3 | 口径文档同步、全量门禁、归档 |

条目明细（8 要素与 4 项字段）见 [todo.md](../../plan/todo.md)。

## 5. 容量基线

- **commits 13–18 / files 40–55 / 行 1,500–2,200**（小条目默认各 1 次提交，回填 / 收口提交另计）（行 = diff 改动量含删除；测量方 = 规划角色，依据阶段 12 同类条目的实际规模）。
- 类型：🛠️ M1 / M2 / M3，🎨 M4，🧪 随条目内嵌，🛡️ M1 / M3 / M5。
- 小条目 13 条，每条 ≤10 文件 / 800 行新增；超出即拆。
- 说明：`login_event` 列类型变更必须同时更新实体、三方言 DDL 与部署指引；聚合下推必须保持响应结构与 UTC 口径不变，避免前端与既有测试重写。

## 6. 执行顺序

M1 → M2 → M3 → M4 → M5。

先补索引再做聚合改造，便于验证查询计划；M3 的依赖收敛与门禁改动相互独立，可在 M2 后并行推进；基线补充必须在行为稳定后采集，收口最后做。

## 7. 不做什么

- 不做审计文件迁库、审计检索 UI、CSV / JSON 导出（D25 维持）。
- 不做风险评分、异地登录告警、异常 IP 实时通知。
- 不引入 Redis、跨实例限流或常驻清理调度器。
- 不改登录事件枚举、通道枚举、权限矩阵、保留期默认值与响应字段。
- 不改 2FA 覆盖范围、可信设备语义与批量撤销行为。
- 不做移动端会话表卡片化（backlog §3.2）、i18n 语言门禁扩展与译文台账校验（backlog §3.2「未启用语言的语言包缺少同构门禁」「译文台账无消费方」）、DataTable 上游能力补齐（backlog §3.2）。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| MySQL / PostgreSQL 无法对现有表直接加索引（列类型 / 长度） | 先改列类型再建索引，提供 ALTER 顺序与回滚语句；SQLite 无需重建，仅新装 DDL 对齐 |
| 聚合下推后方言分桶表达式不一致，UTC 语义漂移 | 每方言单独断言 SQL 契约与分桶标签；保留 JS 补零，不依赖数据库时区表；会话 `time_zone` 需与 `DATABASE_TIMEZONE` 一致 |
| 依赖大版本升级破坏 lint / build / 测试工具链 | 一次只升一个包，完整门禁验证；不兼容立即回退并在 backlog 记录触发条件 |
| 视觉基线重采掩盖真实漂移 | 只对受影响 spec 单文件重采，再全量复核；非空态夹具使用确定性数据 |
| 门禁在 CodeQL 未完成时误报 | 门禁脚本按既有口径把「未扫描」视为未通过；发布工作流保留重跑说明 |
