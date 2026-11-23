# 2026-11-23 阶段 13 收口记录：可观测性规模化与运维闭环

> 范围与决策见 [阶段 13 范围登记](./2026-11-23-phase13-registration.md)；阶段正文见 [todo-archive-phases-13](../plan/archive/todo-archive-phases-13.md)，里程碑见 [roadmap-phases-13](../plan/archive/roadmap-phases-13.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 登录事件 IP 索引 | `ip` 改 `varchar(45)` + `(ip, created_at)` 索引（实体与三方言 DDL）；`database.md` 升级预检 / ALTER 顺序 / 锁影响 / 回滚；IP-only 查询不追加隐式时间窗，单测锁定谓词与分页契约 | `7264e25`、`681d274` |
| M2 统计与热力图方言聚合 | 方言分桶表达式（`dialect.ts`）；`dailyTrend` 与热力图 `GROUP BY` 下推；三方言契约 + 无 `find` 回归断言；聚合口径文档 | `62aa4ef`、`dd7ab6c`、`92466cc` |
| M3 运维脚本与发布门禁 | 清理脚本三方言（dry-run / 参数化 DELETE / 时区与 SSL 继承）；`docker-publish` `mode=build` 前置门禁；`glob` / `minimatch` / `@nuxt/schema` override 收敛 3 条 medium 告警（`commitizen>glob` 钉回 7.x） | `398d45e`、`9a5eee5`、`97524f7` |
| M4 回归基线补充 | 热力图 1440 交互态基线（断言内滚动 + 截完整矩阵）；可信设备非空态基线（2 条设备含过期标记与吊销按钮） | `c808bf6`、`0cf8040` |
| M5 文档与阶段收口 | 口径同步与候选闭合；全量门禁；归档分片与索引 | `49d351e` 与收口提交 |

## 2. 终态指标

- 测试：214 文件 / **1512** 用例全通过；覆盖率 Statements 78.88% / Branch 65.79% / Functions 72.6% / Lines 79.08%。
- 视觉：**154** 张基线通过（新增 3 张：热力图 1440 浅 / 暗、可信设备非空态）。
- 重复代码 3.71%（阈值 5%）；入口 CSS 405,342 B（+1.40%，上限 +10%）；`docs:build` 无死链。
- 依赖告警：Dependabot `open` 归零（3 条 medium 推送后自动关闭），无 critical / high。
- 提交：10 个条目提交 + 1 个文档同步提交（`49d351e`）+ 收口提交。

## 3. Review Gate 轮次

- M1.1 R1 Pass → R2 Pass；M1.2 R1 Pass。
- M2.1 R1 Pass；M2.2 R1 Pass；M2.3 R1 Reject → R2 Reject → R3 Pass。
- M3.1 R1 Reject → R2 Pass；M3.2 R1 Pass；M3.3 R1 Pass。
- M4.1 R1 Pass、M4.2 R1 Pass、M5.1 R1 Pass：subagent 额度用尽（provider 月度上限），按 `code-reviewer` skill 自查并留存 `artifacts/review-gate/`，独立复审待额度恢复补。

## 4. 偏差

- 容量：计划 commits 13–18 / files 40–55 / 行 1,500–2,200；实际 12 个提交（10 条目 + 1 文档 + 1 收口），files 与行数在区间内；M3.3 因 commitizen 兼容问题多一次嵌套 override 修复（含在 `97524f7` 内）。
- M4.1 期间发现 1440 宽度下热力图确有内部横向滚动（溢出 144px），因此基线口径从「整块热力图」改为「断言内滚动 + 截 `.heatmap-grid` 完整矩阵」，与登记时的两种备选口径一致。

## 5. 未覆盖边界

- MySQL / PostgreSQL 无运行时实例：索引命中、`ALTER` 行为与方言分桶结果由表达式 / SQL 契约与 SQLite 实跑覆盖，未做 EXPLAIN。
- `docker-publish` 的运行态验证需手动 `workflow_dispatch`（`tag=<最新 tag>` + `rebuild=true`）确认 gate 通过后 `docker` 执行、门禁失败时阻断；门禁报告产物未上传 artifact。
- AGENTS.md §7.4 的门禁执行者清单尚未补 `docker-publish.yml`（修改 AGENTS.md 需用户授权，已登记 backlog）。
- 登录事件写入侧 IP 长度契约（`net.isIP` 校验 / 超长回落）未在本阶段实施，保留在 backlog §3.3 并写明触发条件。

## 6. 后续建议

- 阶段 14 候选建议（不自行启动）：审计检索 / 导出、风险评分与异地告警、登录事件写入侧 IP 归一化、门禁报告 artifact 归档、AGENTS 治理条目补齐；正式范围须经需求评估与用户决策后登记。
