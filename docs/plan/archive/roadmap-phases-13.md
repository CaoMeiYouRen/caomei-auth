# 阶段 13 里程碑：可观测性规模化与运维闭环（2026-11-23 收口）

> 索引与阶段正文见 [todo-archive-phases-13.md](./todo-archive-phases-13.md)；范围登记见 [2026-11-23-phase13-registration.md](../../design/governance/2026-11-23-phase13-registration.md)，收口记录见 [2026-11-23-phase13-closure.md](../../design/governance/2026-11-23-phase13-closure.md)。

- **目标**：把阶段 12 的登录事件推进到可持续运行——查询走索引、统计与热力图在数据库侧聚合、保留期清理支持三方言、发布门禁收敛与回归基座补齐。
- **交付**：
    - IP 索引：`login_event.ip` 改 `varchar(45)` + `(ip, created_at)` 复合索引，三方言 DDL 与升级 / 回滚指引；IP-only 查询不再要求时间窗，大跨度建议显式带窗口。
    - 方言聚合：`dailyTrend` 与热力图改为 `GROUP BY`（SQLite `strftime`、PostgreSQL `AT TIME ZONE 'UTC'`、MySQL epoch 整除），JS 只补零桶与排序，响应字段 / UTC / 窗口上限不变。
    - 运维与门禁：清理脚本支持三方言（默认 dry-run、参数化 DELETE、继承 `DATABASE_TIMEZONE` / `DATABASE_SSL`）；`docker-publish` 的 `mode=build` 前置安全告警门禁；3 条 medium 依赖告警以 override 收敛。
    - 回归基座：热力图补 1440 交互态基线（滚动位置固定 0，断言溢出 / 7 个标签 / 7 × 168 cell，可视框入基线）；管理端「用户会话」对话框补可信设备非空态局部基线（第 2 条含过期标记与吊销按钮）。
- **关键决策**：D26 IP 列类型与索引；D27 聚合位置；D28 多方言清理脚本；D29 发布门禁覆盖；D30 依赖告警收敛；D31 回归基线补充；D32 本阶段边界。
- **质量门**：`lint` / `lint:css` / `lint:md:check` / `typecheck` / `test`（214 文件 / 1512 用例）/ `test:coverage`（Statements 78.88% / Lines 79.08%）/ `i18n:check` / `ai:check` / `planning:check` / `quality:file-size` / `lint:duplicate`（3.71%）/ `migration:check-imports` / `migration:check-budget` / `build` / `docs:build` / `test:visual`（154 用例 / 151 张自基线）全绿；官方 Playwright 1.65 镜像复跑一致。
- **Review Gate**：M1.1 R1 Pass → R2 Pass；M1.2 R1 Pass；M2.1 R1 Pass；M2.2 R1 Pass；M2.3 R1 Reject → R2 Reject → R3 Pass；M3.1 R1 Reject → R2 Pass；M3.2 R1 Pass；M3.3 R1 Pass；M4.1 R1 Reject → R2 Reject → R3 Pass；M4.2 R1 Pass；M5.1 R1 Pass；M5.2 R1 Pass（门禁证据采信）；M5.3 R1 Reject → R2 Reject → R3 Pass。
- **未覆盖边界**：MySQL / PostgreSQL 无运行时实例（索引命中与方言结果仅契约断言）；`docker-publish` 运行态验证需手动 dispatch；门禁报告未上传 artifact；AGENTS.md §7.4 已补 `docker-publish.yml`（`17cbf9a`）；登录事件 IP 写入侧长度校验登记 backlog。
