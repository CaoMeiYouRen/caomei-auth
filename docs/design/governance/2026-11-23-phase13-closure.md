# 2026-11-23 阶段 13 收口记录：可观测性规模化与运维闭环

> 范围与决策见 [阶段 13 范围登记](./2026-11-23-phase13-registration.md)；阶段正文见 [todo-archive-phases-13](../plan/archive/todo-archive-phases-13.md)，里程碑见 [roadmap-phases-13](../plan/archive/roadmap-phases-13.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 登录事件 IP 索引 | `ip` 改 `varchar(45)` + `(ip, created_at)` 索引（实体与三方言 DDL）；`database.md` 升级预检 / ALTER 顺序 / 锁影响 / 回滚；IP-only 查询不追加隐式时间窗，单测锁定谓词与分页契约 | `7264e25`、`681d274` |
| M2 统计与热力图方言聚合 | 方言分桶表达式（`dialect.ts`）；`dailyTrend` 与热力图 `GROUP BY` 下推；三方言契约 + 无 `find` 回归断言；聚合口径文档 | `62aa4ef`、`dd7ab6c`、`92466cc` |
| M3 运维脚本与发布门禁 | 清理脚本三方言（dry-run / 参数化 DELETE / 时区与 SSL 继承）；`docker-publish` `mode=build` 前置门禁；`glob` / `minimatch` / `@nuxt/schema` override 收敛 3 条 medium 告警（`commitizen>glob` 钉回 7.x） | `398d45e`、`9a5eee5`、`97524f7` |
| M4 回归基线补充 | 热力图 1440 交互态基线（可视框 + 溢出 / 标签 / cell 计数断言，右端溢出区不入像素基线）；可信设备基线截「用户会话」对话框局部（第 2 条含过期标记与吊销按钮） | `c808bf6`、`0cf8040`、`9928c29`、`b893123`、`7fdfaa2` |
| M5 文档与阶段收口 | 口径同步与候选闭合；全量门禁；归档分片与索引 | `49d351e`（M5.2 / M5.3 并入收口提交 `8f25a85`，不计容量） |

## 2. 终态指标

- 测试：214 文件 / **1512** 用例全通过；覆盖率 Statements 78.88% / Branch 65.79% / Functions 72.6% / Lines 79.08%。
- 视觉：**154** 个用例通过，自基线 PNG **151** 张（热力图 1440 浅 / 暗、可信设备非空态为新增 / 重采）。
- 重复代码 3.71%（阈值 5%）；入口 CSS 405,342 B（+1.40%，上限 +10%）；`docs:build` 通过（VitePress 配置 `ignoreDeadLinks: true`，链接有效性另由归档分片路径核对补充）。
- 依赖告警：Dependabot `open` 归零（3 条 medium 推送后自动关闭）；`gh api .../dependabot/alerts?state=open` 于 2026-11-23 核对为 0，无 critical / high。
- 提交：14 个条目提交（M1 2 / M2 3 / M3 3 / M4 5 / M5 1）+ 1 个阶段收口提交（`8f25a85`，不计容量）；回填提交 `8d82d72`、`ecba69f`、`17cbf9a`、`d9ae320` 不归属条目。

## 3. Review Gate 轮次

- M1.1 R1 Pass → R2 Pass；M1.2 R1 Pass。
- M2.1 R1 Pass；M2.2 R1 Pass；M2.3 R1 Reject → R2 Reject → R3 Pass。
- M3.1 R1 Reject → R2 Pass；M3.2 R1 Pass；M3.3 R1 Pass。
- M4.1 R1 Reject → R2 Reject → R3 Pass；M4.2 R1 Pass；M5.1 R1 Pass；M5.2 R1 Pass（门禁证据采信）；M5.3 R1 Reject → R2 Reject → R3 Pass。
- M4 / M5 的首轮曾以 `code-reviewer` skill 自查代行；subagent 额度恢复后补做独立复审，M4.1 与 M5.3 各退回两轮（R1 / R2）并在修复后通过。

## 4. 偏差

- 容量：计划 commits 13–18 / files 40–55 / 行 1,500–2,200；实际 14 个条目提交 + 1 个阶段收口提交（收口提交不计容量），files 与行数在区间内；M3.3 因 commitizen 兼容问题多一次嵌套 override 修复（含在 `97524f7` 内）；M4 因独立复审 R1 / R2 退回多 3 次修复提交（`9928c29`、`b893123`、`7fdfaa2`），容量由计划 2 增至 5。
- M4.1 期间发现 1440 宽度下热力图确有内部横向滚动（168 个桶的最小内容宽约 1480px > 容器 1336px）；独立复审指出「完整矩阵」截图不成立，最终口径改为「页面横向滚动归零 + 溢出 / 7 个类型标签 / 7 × 168 cell 断言 + 1440×900 视口截图」，右端溢出区仅由计数断言覆盖。

## 5. 未覆盖边界

- MySQL / PostgreSQL 无运行时实例：索引命中、`ALTER` 行为与方言分桶结果由表达式 / SQL 契约与 SQLite 实跑覆盖，未做 EXPLAIN。
- `docker-publish` 运行态已用 `workflow_dispatch` 验证（`tag=v1.18.0` + `rebuild=true`，run 45195283261）：`Security alert gate` 在构建前执行成功、`Retag images` 跳过、amd64 / arm64 构建与 manifest 校验通过；门禁失败时阻断的负向路径未单独构造，门禁报告产物未上传 artifact。
- AGENTS.md §7.4 已按用户授权补 `docker-publish.yml`（`17cbf9a`），与 `security.md` §5.1.3 对齐。
- 登录事件写入侧 IP 长度契约（`net.isIP` 校验 / 超长回落）未在本阶段实施，保留在 backlog §3.3 并写明触发条件。

## 6. 后续建议

- 阶段 14 候选建议（不自行启动）：审计检索 / 导出、风险评分与异地告警、登录事件写入侧 IP 归一化、门禁报告 artifact 归档、AGENTS 治理条目补齐；正式范围须经需求评估与用户决策后登记。
