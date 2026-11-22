# 2026-11-21 阶段 12 范围登记：安全可观测性与会话治理

> **状态**：2026-11-21 登记 → 2026-11-23 收口（见 [收口记录](./2026-11-23-phase12-closure.md)）。§2 的 D18–D25 为拟定口径，随登记生效；如用户改判，M1 开工前同批更新本文件、[todo.md](../../plan/todo.md) 与 [security.md](../../standards/security.md)。
> **依据**：[backlog §2.4](../../plan/backlog.md)（登录事件与热力图）、[backlog §2.12](../../plan/backlog.md)（审计检索 / 可信设备 / 会话撤销）、[阶段 11 收口记录](./2026-11-21-phase11-closure.md)（M3.3 / 撤销脚本迁入）、[安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)。
> **规划模型**：5 大条目 / 15 小条目（[规划规范](../../standards/planning.md) §4 / §7 / §8）。

## 1. 目标

- 建立可查询的登录事件数据源，覆盖成功 / 失败登录、2FA 挑战与验证、登出、社交 / SSO 回调结果，支撑管理端按事件类型、结果、IP、用户与时间筛选。
- 在 `/admin/logs` 增加「事件」视图与时间 × 事件类型热力图，补齐现有「会话」视图看不到的失败与挑战事件。
- 提供可信设备与会话治理：用户可查看 / 吊销自己的可信设备；管理员可查看 / 吊销用户的可信设备与全部会话；补多方言撤销脚本。
- 所有新增写路径保持 fail-open（事件写入失败不阻断认证），只记录必要元数据，不落密码、验证码、令牌或恢复材料。

## 2. 决策记录（拟定，2026-11-21）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D18 | 登录事件数据源 | 新建 `LoginEvent` 表；事件类型固定枚举（`sign_in_success` / `sign_in_failure` / `two_factor_challenge` / `two_factor_success` / `two_factor_failure` / `sign_out` / `session_revoked`），通道固定枚举（邮箱 / 用户名 / 手机 / 邮箱 OTP / 手机 OTP / 魔法链接 / 邮箱验证 / 社交 / SSO / 未知），结果为 `success` / `failure` | 现有 `Session` 只记录成功会话，无法覆盖失败与挑战；backlog 2.4 明确要求事件类型维度 |
| D19 | 保留期与清理 | 默认保留 90 天，`LOGIN_EVENT_RETENTION_DAYS` 可配置；管理端统计查询按进程内 1 小时节流惰性清理过期事件；另提供手动清理脚本。不新增调度器 | 项目无后台任务；避免为清理引入常驻进程或队列 |
| D20 | 写入点与失败策略 | 独立 `login-event-plugin` 在 better-auth 生命周期钩子写入；事件写入失败只写 `logger.warn`，不阻断认证；不记录密码、验证码、令牌、备份码 / 恢复码 | 与阶段 9 审计口径一致；认证可用性优先 |
| D21 | 查询与权限 | `GET /api/admin/login-events`（筛选 / 分页）与 `GET /api/admin/login-events/stats`（总量 / 按类型 / 按结果 / 独立用户与 IP）；仅管理员；不提供用户侧事件列表 | 事件含 IP / UA，属于管理侧安全数据；用户侧只暴露会话与可信设备 |
| D22 | 热力图粒度 | 时间窗 ≤ 7 天按小时聚合，≤ 30 天按天聚合；行 = 事件类型，列 = 时间桶；接口返回矩阵，前端纯展示 | 避免前端二次聚合；30 天以上不做热力图 |
| D23 | 可信设备模型 | 新建 `TrustedDevice` 表（`userId`、`identifier` 唯一、`userAgent`、`ip`、`createdAt`、`expiresAt`、`lastUsedAt`）；2FA 验证勾选信任设备成功时解析 `trust_device` cookie 的 identifier 入库；失败时不影响验证；吊销同时删除 `verification` 行与实体 | 上游 `verification` 行不含 UA / IP，无法展示设备；cookie 解析属非公开契约，需契约测试与回退 |
| D24 | 会话撤销 | 管理员可按用户撤销全部会话（复用 admin 插件能力）；新增 `scripts/security/revoke-two-factor-sessions.mjs`，默认 dry-run、`--confirm` 执行，覆盖 SQLite / MySQL / PostgreSQL；两类操作写审计。管理员仍不得重置 2FA / 备份码（D4） | 补齐阶段 11 迁入的撤销脚本；批量操作必须有 dry-run 与审计 |
| D25 | 隐私与导出 | 事件与可信设备仅管理员 / 本人可见；不提供 CSV / JSON 导出（2.8 高级审计另行评估）；保留期到期删除；Demo 模式生成确定性示例事件 | 避免把安全日志变成新的隐私面；导出需要脱敏与合规设计 |

## 3. 现状取证（2026-11-21）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 现有日志 | `/admin/logs` 以 `Session` 为数据源，支持搜索、状态、IP 精确筛选、趋势图与撤销会话 | `pages/admin/logs.vue`、`server/api/admin/logs/sessions.get.ts`、`stats.get.ts` |
| 事件缺口 | 无失败登录、2FA 挑战 / 失败、登出、社交 / SSO 失败事件；`Session` 只有成功会话 | `server/entities/session.ts`、`server/entities` 无事件表 |
| 审计通道 | `logger.audit` 写独立文件，适合取证但不适合管理端查询 / 热力图 | `server/utils/audit-log.ts`、`server/utils/audit-logger.ts` |
| 可信设备 | 上游以 `verification` 行 `trust-device-*` + `trust_device` cookie 实现；无 UA / IP 展示字段 | `node_modules/better-auth/dist/plugins/two-factor/index.mjs`；阶段 11 契约测试 |
| 会话撤销 | 管理员单会话撤销已接入；无按用户批量撤销 UI / 脚本 | `composables/admin/use-logs-management.ts`；阶段 11 收口 §5 |
| 2FA 覆盖 | 阶段 11 已覆盖 6 类通道；本阶段不改变认证行为 | [阶段 11 收口记录](./2026-11-21-phase11-closure.md) |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 登录事件基座 | 4 | 事件模型与索引、写入点接线、保留期与清理、契约测试 |
| M2 | Admin 事件查询 | 3 | 查询 API、统计 API、事件视图与测试 |
| M3 | 热力图 | 2 | 聚合接口与矩阵契约、热力图组件与视觉 |
| M4 | 可信设备与会话治理 | 3 | 可信设备实体与采集、用户安全页、管理端与撤销脚本 |
| M5 | 隐私、门禁与收口 | 3 | 权限 / 隐私审计与规范、全量门禁与视觉、归档 |

条目明细（8 要素与 4 项字段）见 [todo.md](../../plan/todo.md)。

## 5. 容量基线

- **commits 16–20 / files 50–65 / 行 2,400–3,200**（行 = diff 改动量含删除；测量方 = 规划角色，依据现有 Admin 日志页与会话实体的复用面）。
- 类型：🛠️ M1 / M2 / M4，🎨 M3 / M2，🧪 随条目内嵌，🛡️ M1 / M4 / M5。
- 小条目 15 条，每条 ≤10 文件 / 800 行新增；超出即拆。
- 说明：`TrustedDevice` 与 `LoginEvent` 都是新表，迁移与 `database/sqlite/create.sql` 同步必须与实体同提交；`lib/auth.ts` 只增加插件注册，不内联写入逻辑。

## 6. 执行顺序

M1 → M2 → M3 → M4 → M5。

先有事件数据源才能查询与热力图；可信设备依赖 2FA 验证钩子，可与 M2 / M3 并行，但按顺序减少上下文切换；隐私审计与收口必须最后做，避免口径反复。

## 7. 不做什么

- 不做风险评分、异地登录告警、异常 IP 实时通知（2.8 长期方向）。
- 不把文件审计迁移为数据库审计表，也不做审计检索 UI（阶段 11 明确未上收；本阶段只做事件表）。
- 不做 passkey / 硬件密钥、管理员重置 2FA / 备份码（D4）、管理员代设密码（D8）。
- 不做 CSV / JSON 导出、SOC2 / ISO27001 报表（2.8）。
- 不做多租户、组织 / 部门、LDAP / AD。
- 不引入 Redis 或跨实例限流；保留期清理不引入常驻调度器。
- 不改阶段 11 的 2FA 覆盖范围、逐通道开关默认值或挑战响应语义。
- 不改 `/admin/logs` 现有会话视图的筛选语义；事件视图为其并列新增。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| 事件写入放大认证延迟 | 事件写入与认证解耦；失败只 warn；单条 insert + 索引受控；压测登录路径 P95 |
| IP / UA 成为隐私面 | 仅管理员可见；保留期默认 90 天；文档写明用途；不做导出 |
| 保留期清理遗漏导致表膨胀 | 管理端统计查询 1 小时节流惰性清理 + 手动脚本；索引覆盖 `createdAt` |
| 热力图查询在大时间窗变慢 | 只支持 ≤30 天；按时间桶聚合；必要时加 `(type, createdAt)` 复合索引 |
| `TrustedDevice` 依赖 `trust_device` cookie 非公开格式 | 契约测试锁住解析；解析失败时回退到 `verification` 行只读列表（无 UA）；不影响验证 |
| 批量撤销误伤 | 默认 dry-run；`--confirm` 才执行；管理端二次确认 + 审计；按用户 / 2FA 用户范围明确 |
| Admin 事件视图与现有日志页信息过载 | 事件作为独立 Tab / 区块；保留现有会话视图与趋势图 |

## 9. 验收总则

1. 成功 / 失败登录、2FA 挑战与验证、登出、社交 / SSO 回调结果均写入 `LoginEvent`；事件写入失败不阻断认证。
2. 管理端可按事件类型、结果、用户、IP、时间筛选事件，并查看按类型 / 结果的统计；非管理员 403。
3. 热力图按小时（≤7 天）/ 天（≤30 天）展示时间 × 事件类型分布；空 / 加载 / 错误态完整。
4. 用户安全页可查看 / 吊销自己的可信设备；管理员可在用户详情查看 / 吊销可信设备与会话；吊销后对应 `verification` 行与实体同时删除。
5. 撤销脚本默认 dry-run，`--confirm` 执行，SQLite / MySQL / PostgreSQL 方言可用；执行结果写审计。
6. 事件与可信设备不含密码、验证码、令牌、备份码 / 恢复码；保留期清理生效。
7. 5 语文案键齐全；视觉基线覆盖事件视图与热力图的桌面 / 平板 / 移动与浅 / 暗色；全量门禁通过。
8. `security.md` 与 [事件 / 设备口径](./2026-11-21-phase12-registration.md) 一致；阶段按 §8 归档。

## 10. 回滚

- `LoginEvent` / `TrustedDevice` 表按条回退；删除实体与建表脚本，不修改既有 `session` / `verification` 数据。
- 事件写入插件可按条关闭（环境开关），关闭后认证行为与登记前一致。
- 可信设备列表 / 吊销按条回退；已吊销的 `verification` 行不恢复（用户重新勾选信任设备即可）。
- 批量撤销脚本只删会话，不修改用户、2FA、备份码或恢复码；执行前 dry-run 输出目标数量。

## 11. 关联

- 候选池：[backlog §2.4](../../plan/backlog.md)、[backlog §2.12](../../plan/backlog.md)、[阶段 11 收口记录](./2026-11-21-phase11-closure.md) §5
- 规范：[安全规范 §1.3](../../standards/security.md#13-2fa-覆盖边界与账号恢复等级-2fa-coverage--recovery-levels)、[规划规范](../../standards/planning.md)、[开发规范](../../standards/development.md)
- 现有实现：`server/entities/session.ts`、`server/entities/verification.ts`、`server/api/admin/logs/*`、`pages/admin/logs.vue`、`components/security/session-table.vue`
- 上游：better-auth 1.7.20 `two-factor`（`trust_device` cookie 与 `verification` 行）、admin 插件（会话列表 / 撤销）
