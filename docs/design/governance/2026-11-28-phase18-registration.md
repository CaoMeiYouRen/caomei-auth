# 2026-11-28 阶段 18 范围登记：测试稳定性与质量门禁夯实

> **状态**：2026-11-28 登记并开工，2026-11-28 收口（见 [阶段 18 收口记录](./2026-11-28-phase18-closure.md)）。依据：[backlog 优先级视图](../../plan/backlog.md#0-优先级评分视图当前期)中当前最高分的「时序型测试抖动」（重要 3 / 紧急 3），以及同一质量域的两条 2/2 候选「覆盖率模块下限自动化校验」与「文档站锚点与 GitHub slug 不一致」。阶段 17 已于 2026-11-28 收口（见 [阶段 17 收口记录](./2026-11-28-phase17-closure.md)）。
> **阶段编号**：取已用最大编号（17）+ 1 = **18**。
> **规划模型**：4 大条目 / 10 小条目（[规划规范](../../standards/planning.md) §4）：大条目 4 条落在 3–8 区间；小条目 10 条达到建议下限。

## 1. 目标

- 消除 3 处已观测到的测试抖动：两条 2FA 过期用例改用「直接把校验记录置为过期」而不是真实 `sleep`，DataTable 受控选择 / 分页断言补确定性等待。
- 把测试规范里只写不拦的覆盖率模块下限变成可执行门禁（`pages ≥ 40%` / `plugins ≥ 40%` / 全局非回归），并在 CI 阻断。
- 让文档站锚点与仓库交叉引用同口径：VitePress 的 slug 规则对齐 GitHub，并补一条校验脚本，避免 30+ 引用在站点静默落空。

## 2. 决策记录（2026-11-28）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D64 | 抖动修复方式 | 不改生产代码、不放大 sleep、不引入 fake timers；两条 2FA 用例在创建链接 / 可信设备后，直接把内存库 `verification` 行的 `expiresAt` 改为过去时间 | better-auth 1.7.20 的魔法链接与可信设备都以 `verification.expiresAt` 判过期（`readSignInTwoFactorState`）；改写数据即可在真实代码路径上确定过期，无需等真实 TTL |
| D65 | DataTable 用例确定性 | `trigger('click')` 后显式 `await nextTick()` 再读 `emitted`，并补「连续两次触发」断言 | 组件在内部状态更新后才 emit，微任务顺序在高负载下会抖动 |
| D66 | 覆盖率门禁 | 新增 `scripts/quality/check-coverage.mjs`：读 `coverage/coverage-final.json`，按 `pages ≥ 40%`、`plugins ≥ 40%` 与「全局不低于 `scripts/quality/coverage-baseline.json`」判定；`pnpm coverage:check` 接入 `test.yml` | 规范已有阈值但 CI 不阻断；Vitest 4 移除 `coverage.all` 后只能统计被导入文件，基线文件提供非回归下限 |
| D67 | 文档锚点口径 | 在 `.vitepress/config.ts` 自定义 `markdown.anchor.slugify`，按 GitHub 规则生成 id（数字开头不补 `_`、点号归一为 `-`），使既有 GitHub slug 引用在站点同样可用；另补 `scripts/quality/check-doc-anchors.mjs` 校验 md 交叉引用 | 站点当前生成 `_7-进度表` 一类 id，仓库引用写 `#7-进度表`，30+ 链接落空且被 `ignoreDeadLinks: true` 掩盖 |
| D68 | 本阶段不做 | 不改生产逻辑、不做 localePath 收敛、不做 PKCE 可配置化、不新增语言、不把 `ignoreDeadLinks` 改为 false（全站死链治理另立候选） | 保持阶段聚焦「测试稳定性 + 两条质量门禁」 |

## 3. 现状取证（2026-11-28）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 2FA 抖动 | `two-factor-coverage-factors.spec.ts` 两条用例用 `magicLinkExpiresIn: 2` / `trustDeviceMaxAge: 2` + `sleep 2200ms` | 2026-11-24/25 共 5 次偶发，单文件复跑 8/8 通过 |
| DataTable 抖动 | 受控 selection / 分页两条用例在 `trigger('click')` 后立即读 `emitted` | 同类抖动 3 次 |
| 覆盖率门禁 | 规范写 `pages ≥ 40%` / `plugins ≥ 40%`，`test.yml` 只上传 Codecov | `docs/standards/testing.md` 与 `.github/workflows/test.yml` |
| 锚点 | `ignoreDeadLinks: true`；站点 id 为 `_7-进度表`、`_7-3-提交规范-commit-convention` | `.vitepress/config.ts` 与既有 dist 产物 |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 时序型测试抖动治理 | 3 | 两条 2FA 过期用例去 sleep、DataTable 断言确定性、连续多轮验证 |
| M2 | 覆盖率模块下限门禁 | 2 | 门禁脚本与基线、接入 npm script 与 CI |
| M3 | 文档站锚点一致性 | 3 | slugify 对齐、校验脚本、30+ 引用复核 |
| M4 | 文档与阶段收口 | 2 | 测试 / 文档规范同步、阶段收口归档 |

## 5. 容量基线

- **commits 6–8 / files 12–18 / 行 300–500**。
- 小条目 10 条，每条 ≤10 文件 / 800 行。

## 6. 执行顺序

M1 → M2 → M3 → M4。M1 与其余条目无依赖；M2 / M3 各自独立；M4 收口。

## 7. 不做什么

- 不改认证流程、鉴权语义、API 契约与生产逻辑（本阶段只动测试、脚本与文档站配置）。
- 不放宽任何现有质量门，也不为让测试变绿而调大超时 / 重试。
- 不做 localePath 收敛、PKCE 可配置化、依赖升级、全站死链治理。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| 改写 `expiresAt` 后用例仍在真实路径上失败（如过期判定读 cookie maxAge） | 先读 better-auth 实现确认判定来源，再改写；断言同时检查 session 与 cookie 状态 |
| 覆盖率门禁把现有 78–79% 的全局值卡死后续正常下降 | 基线文件记录当前值并允许「不降低」而非「必须提升」；阈值调整需单独提交并说明 |
| 自定义 slugify 破坏现有站点内链接 | 脚本会同时校验「站点生成的 id」与仓库引用；只改 slugify 生成规则，不改标题文本 |
| `docs:build` 时间 | 锚点校验脚本直接扫 md，不依赖构建产物 |
