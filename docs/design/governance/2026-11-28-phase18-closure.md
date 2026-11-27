# 2026-11-28 阶段 18 收口记录：测试稳定性与质量门禁夯实

> 范围与决策见 [阶段 18 范围登记](./2026-11-28-phase18-registration.md)；阶段正文见 [todo-archive-phases-18](../../plan/archive/todo-archive-phases-18.md)，里程碑见 [roadmap-phases-18](../../plan/archive/roadmap-phases-18.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 时序型测试抖动治理 | `expireVerifications` helper（把 `verification.expiresAt` 置为过去）替代两处 `sleep 2200ms`；DataTable 受控选择 / 分页补 `nextTick` 与「无重复 emit」断言；定向用例连续 5 轮全绿 | `7fe9782` |
| M2 覆盖率模块下限门禁 | `check-coverage.mjs`（模块语句覆盖率按目录前缀聚合、行覆盖按 `statementMap` 起始行聚合、全局四项与基线比较）、`coverage-baseline.json`、`pnpm coverage:check`、`test.yml` 接入、6 例单测 | `3f64093` |
| M3 文档站锚点一致性 | `doc-slug.mjs`（GitHub 口径 slugify）+ `.vitepress/config.ts` 接入；`check-doc-anchors.mjs`（165 文件扫描、内联与引用式链接、重复标题后缀）；`pnpm docs:anchors` + CI；修正 11 处失效引用（10 处由 slug 修正恢复、1 处陈旧引用改指 backlog §4.1 现标题）；7 例单测 | `c8bfef9` |
| M4.1 规范同步 | 测试规范补「时序型用例口径」「覆盖率门禁」；文档规范补「锚点口径」 | `47d090a` |
| M4.2 阶段收口 | 归档分片、索引、roadmap 指针、收口记录 | 收口提交 |

## 2. 终态指标

- 测试：**1633** 用例通过（224 文件；较阶段 17 的 1620 增加 13：覆盖率门禁 6、锚点校验 7）。
- 覆盖率：Statements 79.02%（0.00）/ Branch 66.14%（-0.02）/ Functions 72.78%（0.00）/ Lines 79.23%（0.00）——Branch 的 0.02 来自新增脚本文档分支，仍在基线容差内（`coverage:check` 通过）。
- 重复代码 3.70%（阈值 5%）；`quality:file-size` 0 错误；`build` 与 `docs:build` 通过。
- 视觉：**389** 用例通过（本阶段未改表态层与应用代码，用于确认零回归，未新增基线）。
- 新增门禁：`pnpm coverage:check`（覆盖率模块下限 + 全局非回归）、`pnpm docs:anchors`（锚点引用），均已接入 `test.yml`。
- i18n：`i18n:check` 通过；`planning:check` / `ai:check` / `migration:check-imports` 通过。
- 提交：4 个条目提交 + 1 个收口提交。

## 3. Review Gate 轮次

- M1.1 / M1.2 / M1.3 R1 Pass：先读 better-auth 实现确认过期判定来源（`verificationRecord.expiresAt`）再改写；改写后断言仍校验「无会话 / 无 two_factor cookie / `twoFactorRedirect`」，并连续 5 轮定向运行取证。
- M2.1 / M2.2 R1 Pass：门禁对「未达标 / 基线缺项 / 报告缺失」三条路径都有断言；基线只要求不降低并留 0.05 容差，避免卡住正常重构。
- M3.1 / M3.2 / M3.3 R1 Pass：slug 生成与校验共用同一实现（`doc-slug.mjs`），避免两套口径；`docs:build` 抽查 `id="7-进度表"`、`id="514-…--security-advisory"` 与 GitHub 形式一致。
- M4.1 / M4.2 R1 Pass：规范不再保留「只写不拦」表述，归档块 6 项字段齐全。

## 4. 偏差

- 计划 6–8 commits / 12–18 files；实际 5 个提交 / 13 个文件。M1 的 3 个小条目合并在 1 次提交（同一 spec + helper，拆开会产生中间不可运行状态）；M2 / M3 各 1 次实现提交；M4 拆 2 次。
- `check-coverage.mjs` 首版用语句数近似行覆盖，导致 lines 指标与 text 报告不一致（79.03 vs 79.23）；改为按 `statementMap` 起始行聚合后与官方报告一致，单测锁定该口径。
- `doc-slug.mjs` 首版把连续空白折叠成单个连字符，与 GitHub 不一致（`Coverage & Recovery` 应为 `coverage--recovery`）；改为逐个空白替换后 11 处失效降到 1 处。
- 逐条核对后确认「1 处」不是 slug 问题而是内容变更后的陈旧引用（阶段 14 收口指向 backlog §4.1「认证移动端可用性」，该节已改为「暂无独立候选组合」），改指现有标题。

## 5. 已知残留

- 抖动修复只在当前容器与 5 轮定向运行中验证，未复现 2026-11-24/25 的高负载条件（当时为全量运行叠加负载）。
- 覆盖率门禁读取 v8 的 `coverage-final.json`，不读 Codecov API；`coverage.include` 未扩大，模块覆盖率仍只统计被测试导入的文件。
- 锚点校验只覆盖「锚点」维度：文件级死链与站点自动生成的路由链接仍由 `ignoreDeadLinks: true` 放过，全站死链治理需另立候选。
- `docs:anchors` 对代码块内的 `#` 行已跳过，但不解析 HTML 注入的显式 `<a id>`；如后续引入自定义锚点需扩展脚本。
