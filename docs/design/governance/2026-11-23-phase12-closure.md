# 2026-11-23 阶段 12 收口：安全可观测性与会话治理

> **状态**：已完成（2026-11-23，M1–M5 全部闭环）。
> **阶段正文**：[todo-archive-phases-12](../../plan/archive/todo-archive-phases-12.md)｜**里程碑**：[roadmap-phases-12](../../plan/archive/roadmap-phases-12.md)｜**范围与决策**：[2026-11-21-phase12-registration](./2026-11-21-phase12-registration.md)｜**口径**：[security-observability](../security-observability.md)

## 1. 交付摘要

| 大条目 | 小条目 | 交付 |
| :--- | :--- | :--- |
| M1 登录事件基座 | 4/4 | `LoginEvent` 实体与 5 个索引、生命周期写入插件（fail-open / 2s 超时 / metadata 白名单）、90 天保留期与 1 小时节流惰性清理、事件契约矩阵 |
| M2 Admin 事件查询 | 3/3 | 列表 / 统计 API、`/admin/logs` 事件面板、用户直达、5 语文案、共享 Zod schema |
| M3 热力图 | 2/2 | 7 天小时 / 30 天日聚合、热力图组件、3 视口 × 浅暗 6 张基线 |
| M4 可信设备与会话治理 | 3/3 | `TrustedDevice` 采集与审计、用户安全页、管理员查看 / 吊销、按用户批量撤销、多方言撤销脚本 |
| M5 隐私、门禁与收口 | 3/3 | `security.md` §1.4、安全可观测性口径、全量门禁、归档与索引 |

## 2. 提交清单

- M1：`a2a1d84`、`e995561`、`8150c84`、`8fdf93b`、`f03edb4`、`a8117e8`
- M2：`53d32b2`、`2cf1606`、`6dbb318`、`a44a1ea`
- M3：`4bcc0f5`、`7582887`、`2c660cb`、`8af7e55`
- M4：`da88703`、`249bbbe`、`ab71c81`、`8291fcb`、`8e1e0dd`、`a7780fb`、`1d34506`
- M5：`231b551`、`9315e06` 与阶段收口提交

## 3. 质量门

| 门禁 | 结果 |
| :--- | :--- |
| `pnpm lint` | 0 error / 26 既有 warning |
| `pnpm lint:css` | 通过 |
| `pnpm typecheck` | 通过 |
| `pnpm test` | 213 文件 / 1493 用例通过 |
| `pnpm test:coverage` | Statements 78.76% / Branches 65.57% / Functions 72.57% / Lines 78.96% |
| `pnpm i18n:check` / `ai:check` / `lint:md:check` / `planning:check` | 通过 |
| `pnpm quality:file-size` / `lint:duplicate` | 0/0；重复率按 jscpd 单次输出 |
| `pnpm migration:check-imports` / `migration:check-budget` | 通过 |
| `pnpm build` | 通过 |
| `pnpm test:visual` | 151 passed（官方 Playwright 1.65 镜像复跑一致） |

## 4. Review Gate

M1.1 R1 Reject → R2 Pass；M1.2 R1 Reject → R2 Pass；M1.3 R1 Pass；M1.4 R1 Pass → R2 Pass；M2.1 R1 Pass；M2.2 R1 Reject → R3 Pass；M2.3 R1 Reject → R2 Pass；M3.1 R1 Reject → R2 Pass；M3.2 R1 Pass → R2 Pass；M4.1 R1 Pass → R2 Pass；M4.2 R1 Reject → R2 Pass；M4.3 R1 Reject → R2 Pass；M5.1 R1 Pass。

## 5. 偏差与未覆盖边界

- **偏差**：M3.2 桌面热力图基线采用 1800×900 元素视口（1440 下元素横向超出主内容区，属既有 Admin 布局行为）；M4.2 管理端可信设备列表仅有空态视觉基线（视觉安全页使用随机隔离账号，无法预置设备）。
- **未覆盖**：MySQL / PostgreSQL 撤销脚本无运行时实例，仅以方言 SQL 契约断言覆盖；统计 / 热力图 30 天窗口全量分桶的内存上限、IP 筛选无索引、多方言清理脚本已登记 backlog；真实社交 / 企业 IdP 回调与多实例限流不在本阶段范围。
- **后续候选**：上述 backlog 项需用户授权后进入下一阶段；本阶段不自动升级。
