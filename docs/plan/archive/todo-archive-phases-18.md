# 阶段 18 归档：测试稳定性与质量门禁夯实

> 归档日期：2026-11-28；阶段正文自 [todo.md](../todo.md) 迁入，索引见 [todo-archive.md](../todo-archive.md)，里程碑见 [roadmap-phases-18](./roadmap-phases-18.md)，收口记录见 [2026-11-28-phase18-closure](../../design/governance/2026-11-28-phase18-closure.md)。

- **阶段**：阶段 18「测试稳定性与质量门禁夯实」/ 2026-11-28 登记并开工 → 2026-11-28 收口
- **大条目**：M1 时序型测试抖动治理（已闭环） / M2 覆盖率模块下限门禁（已闭环） / M3 文档站锚点一致性（已闭环） / M4 文档与阶段收口（已闭环）
- **提交清单**：M1 `ce027f8`；M2 `d3250f5`；M3 `9f87d95`；M4.1 `dbb87f8`；M4.2 收口提交（本归档与文档同步）
- **质量门**：`lint`（0 error / 27 既有 warning）/ `typecheck` / `test:coverage`（224 文件 / 1633 用例，Statements 79.02% / Branch 66.14% / Functions 72.78% / Lines 79.23%）/ `coverage:check` / `docs:anchors`（165 文件零失效）/ `lint:md` / `planning:check` / `ai:check` / `quality:file-size` / `lint:duplicate`（3.70%）/ `migration:check-imports` / `build` / `docs:build` / `test:visual`（389 用例）全绿
- **Review Gate**：M1.1 / M1.2 / M1.3 R1 Pass；M2.1 / M2.2 R1 Pass；M3.1 / M3.2 / M3.3 R1 Pass；M4.1 / M4.2 R1 Pass（本地自审，证据为提交 diff 与门禁输出）
- **未覆盖边界**：抖动只在当前容器与 5 轮定向运行内验证，未复现原始高负载条件；覆盖率门禁只读 v8 `coverage-final.json`，未接 Codecov API；锚点校验不覆盖文件级死链与站点内部自动生成的路由链接（`ignoreDeadLinks` 仍为 true）

---

## 阶段 18：测试稳定性与质量门禁夯实（2026-11-28 登记，2026-11-28 收口）

_目标：消除已观测的测试抖动，把覆盖率模块下限与文档锚点一致性变成可执行门禁。_

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 时序型测试抖动治理 | 3/3 | 已闭环 | `ce027f8` | R1 Pass（M1.1–M1.3） | 3 → 1 commit |
| M2 覆盖率模块下限门禁 | 2/2 | 已闭环 | `d3250f5` | R1 Pass（M2.1 / M2.2） | 2 → 1 commit |
| M3 文档站锚点一致性 | 3/3 | 已闭环 | `9f87d95` | R1 Pass（M3.1–M3.3） | 3 → 1 commit |
| M4 文档与阶段收口 | 2/2 | 已闭环 | `dbb87f8`、收口提交 | R1 Pass（M4.1 / M4.2） | 2 → 2 commits |

- **执行顺序**：M1 → M2 → M3 → M4。
- **不做范围**：不改生产逻辑、不做 localePath 收敛与 PKCE、不放宽既有质量门、不把 `ignoreDeadLinks` 改为 false（详见 [登记记录 §7](../design/governance/2026-11-28-phase18-registration.md#7-不做什么)）。

### M1 时序型测试抖动治理

- **目标**: 三条已观测抖动用例改成不依赖真实等待的确定性断言。
- **优先级**: P1（CI 稳定性，3/3 候选）。
- **范围**: `tests/unit/server/two-factor-coverage-factors.spec.ts`、`tests/unit/components/caomei-data-table.spec.ts`、测试 helper。
- **验收标准**: 两条 2FA 用例不再包含 `setTimeout` / `sleep`；连续 5 轮定向运行全绿；DataTable 两条用例补确定性等待与连续触发断言。
- **不做什么**: 不改生产代码、不改 TTL 语义、不引入 fake timers、不放宽超时。
- **依赖**: 无。
- **交付物**: 用例改写、helper、连续运行证据。
- **风险与缓解**: 过期判定来源判断错 → 先读 better-auth 实现再改；改写后仍失败 → 回退到「注入时钟」方案并记录理由。

#### M1.1 魔法链接过期用例去 sleep

- **目标**: 用数据改写替代 `sleep 2200ms`。
- **验收标准**: 用例无真实等待；过期后 GET 不建立会话、不下发 two_factor cookie。
- **交付物**: 用例改动 + helper 复用。
- **依赖**: 无。

#### M1.2 可信设备过期用例去 sleep

- **目标**: 同上，覆盖可信设备过期后重新挑战。
- **验收标准**: 用例无真实等待；过期后登录返回 `twoFactorRedirect` 且无会话。
- **交付物**: 用例改动。
- **依赖**: M1.1（共用 helper）。

#### M1.3 DataTable 断言确定性与连续验证

- **目标**: 受控 selection / 分页断言补 `nextTick`，并证明可重复。
- **验收标准**: 两条用例连续 5 轮全绿；断言仍校验完整行对象与 `page` 事件字段。
- **交付物**: 用例改动、连续运行证据。
- **依赖**: 无。

### M2 覆盖率模块下限门禁

- **目标**: 覆盖率模块下限与全局非回归在 CI 可阻断。
- **优先级**: P2（质量门）。
- **范围**: `scripts/quality/check-coverage.mjs`、`scripts/quality/coverage-baseline.json`、`package.json`、`.github/workflows/test.yml`。
- **验收标准**: `pnpm coverage:check` 在达标时通过、低于阈值时非零退出并打印缺口；基线文件记录当前全局值；CI 在 `test:coverage` 后执行该门禁。
- **不做什么**: 不把 `coverage.include` 扩到全站、不为达标补大量页面测试。
- **依赖**: 无。
- **交付物**: 脚本、基线、CI 接入。
- **风险与缓解**: 阈值设得过紧会卡住正常重构 → 采用「不降低」而非「必须提升」，调整需单独提交。

#### M2.1 门禁脚本与基线

- **目标**: 读 `coverage-final.json` 计算 `pages` / `plugins` / 全局四项指标并判定。
- **验收标准**: 达标 / 不达标 / 报告缺失三种路径都有断言；输出缺口清单。
- **交付物**: 脚本、基线文件、单测或自检样例。
- **依赖**: 无。

#### M2.2 接入 npm script 与 CI

- **目标**: 本地与 CI 都能一条命令跑门禁。
- **验收标准**: `package.json` 新增 `coverage:check`；`test.yml` 在覆盖率上传后执行；测试规范写明口径。
- **交付物**: `package.json`、工作流、规范条目。
- **依赖**: M2.1。

### M3 文档站锚点一致性

- **目标**: 站点锚点与仓库交叉引用同口径，引用不再静默落空。
- **优先级**: P2（文档可用性）。
- **范围**: `.vitepress/config.ts`、`scripts/quality/check-doc-anchors.mjs`、`package.json`、受影响的 md 引用。
- **验收标准**: 站点生成的 id 与 GitHub slug 一致；校验脚本能列出失效引用并在 CI 通过；30+ 既有引用全部命中。
- **不做什么**: 不改标题文本、不关闭 `ignoreDeadLinks`、不做全站死链治理。
- **依赖**: 无。
- **交付物**: slugify 配置、校验脚本、引用修正。
- **风险与缓解**: slugify 改动影响站点内其他链接 → 脚本同时校验生成 id 与引用，先跑全量再提交。

#### M3.1 VitePress slugify 对齐 GitHub

- **目标**: 数字开头标题不补 `_`，`.` / `：` 等按 GitHub 规则归一。
- **验收标准**: `## 7. 进度表` 生成 `7-进度表`；既有 GitHub 引用可直接命中。
- **交付物**: 配置改动、`docs:build` 后的 id 抽样证据。
- **依赖**: 无。

#### M3.2 锚点校验脚本

- **目标**: 扫描 md 交叉引用与标题 slug，列出失效项。
- **验收标准**: 支持同文件 `#x`、跨文件 `y.md#x`；排除外部 URL；CI 可阻断。
- **交付物**: `scripts/quality/check-doc-anchors.mjs`、npm script、CI 接入。
- **依赖**: M3.1。

#### M3.3 既有引用复核与修正

- **目标**: 仓库内 30+ 锚点引用全部命中。
- **验收标准**: 校验脚本零失效；修正只改锚点，不改语义。
- **交付物**: md 引用修正。
- **依赖**: M3.2。

### M4 文档与阶段收口

- **目标**: 口径同步并归档阶段 18。
- **优先级**: P1（收口）。
- **范围**: 测试规范、文档规范、归档分片、索引与 roadmap。
- **验收标准**: 规范与实现一致；全量门禁通过；归档与索引同步。
- **不做什么**: 不预写完成态。
- **依赖**: M1–M3。
- **交付物**: 文档、归档分片、收口记录。

#### M4.1 测试与文档规范同步

- **目标**: 抖动治理口径、覆盖率门禁、锚点校验写进规范。
- **验收标准**: 规范中不再出现「只写不拦」的表述。
- **交付物**: `docs/standards/testing.md`、`docs/standards/documentation.md`。
- **依赖**: M1–M3。

#### M4.2 阶段收口与归档

- **目标**: 阶段 18 收口归档。
- **验收标准**: 全量门禁通过；阶段正文迁入归档、索引与 roadmap 同步。
- **交付物**: 归档分片、收口记录。
- **依赖**: M4.1。
