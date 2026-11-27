# 阶段 18 里程碑：测试稳定性与质量门禁夯实（2026-11-28 收口）

> 索引与阶段正文见 [todo-archive-phases-18.md](./todo-archive-phases-18.md)；范围登记见 [2026-11-28-phase18-registration.md](../../design/governance/2026-11-28-phase18-registration.md)，收口记录见 [2026-11-28-phase18-closure.md](../../design/governance/2026-11-28-phase18-closure.md)。

- **目标**：消除已观测的测试抖动，把覆盖率模块下限与文档锚点一致性从「写在规范里」变成「CI 可阻断」。
- **交付**：
    - 去抖：两条 2FA 过期用例改用 `expireVerifications` 直接把内存库记录置为过去时间（better-auth 以 `verification.expiresAt` 判过期），删除 `sleep 2200ms`；DataTable 受控选择 / 分页断言补 `nextTick` 并断言多等一个 tick 不产生重复 emit。定向用例连续 5 轮全绿，2FA 文件耗时由十余秒降到 4 秒量级。
    - 覆盖率门禁：`scripts/quality/check-coverage.mjs` 读 `coverage-final.json`，`pages ≥ 40%` / `plugins ≥ 40%` + 全局四项不低于 `coverage-baseline.json`（容差 0.05），报告缺失 fail closed；接入 `pnpm coverage:check` 与 `test.yml`。
    - 文档锚点：`doc-slug.mjs` 实现 GitHub 口径 slugify（不补 `_` 前缀、逐个空白转连字符不折叠），站点配置与校验脚本共用；`check-doc-anchors.mjs` 扫描 165 个文件的锚点引用，复核出 11 处失效（10 处随 slug 修正恢复、1 处陈旧引用改指现有标题），现零失效并接入 CI。
    - 文档：测试规范补去抖与覆盖率门禁口径，文档规范补锚点口径。
- **关键决策**：D64 改数据不改生产代码；D65 `nextTick` 确定性；D66 覆盖率门禁口径；D67 锚点 slug 对齐；D68 不做边界。
- **质量门**：单测 1633（+13），覆盖率 79.02 / 66.14 / 72.78 / 79.23，重复 3.70%，构建与文档站通过，视觉 389 用例无回归。
- **未覆盖边界**：未复现原始高负载条件；覆盖率门禁只读 v8 报告；锚点校验不覆盖文件级死链（`ignoreDeadLinks` 仍为 true）。
