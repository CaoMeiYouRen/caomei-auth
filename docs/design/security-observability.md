# 安全可观测性与会话治理口径（阶段 12）

> 状态：2026-11-23 随阶段 12 M5.1 落地；阶段 13 M1 追加查询与索引口径（§7）。
> 依据：[阶段 12 范围登记](./2026-11-21-phase12-registration.md) D18–D25、[安全规范 §1.4](../standards/security.md#14-登录事件与可信设备访问矩阵-login-events--trusted-devices)、[登录事件登记 §2](./2026-11-21-phase12-registration.md#2-决策记录拟定2026-11-21)。

## 1. 数据源

| 数据源 | 表 | 用途 | 写入路径 |
| :--- | :--- | :--- | :--- |
| 登录事件 | `login_event` | 管理端事件视图、统计、热力图 | better-auth after-hook（`loginEventPlugin`，fail-open） |
| 可信设备 | `trusted_device` | 用户 / 管理员查看与吊销免 2FA 设备 | 2FA 验证成功且勾选信任设备（`trustedDevicePlugin`） |
| 会话 | `session` | 既有个体会话视图与批量撤销 | better-auth 会话生命周期 |

## 2. 访问矩阵

| 主体 | 登录事件 | 统计 / 热力图 | 可信设备 | 会话 |
| :--- | :--- | :--- | :--- | :--- |
| 匿名 | 无 | 无 | 无 | 仅本人会话（框架内建，匿名会话同样仅本人） |
| 普通用户 | 无（不提供用户侧事件列表） | 无 | 仅本人列表 / 吊销 | 仅本人会话 |
| 管理员 | 全部事件筛选 / 分页 | 全部筛选条件 | 任意用户列表 / 吊销 | 任意用户会话 + 批量撤销 |

- 事件查询与统计端点均先 `checkAdmin`；可信设备用户端点先 `getUserSession`，查询 / 删除都带 `userId` 作用域，越权与不存在统一 404。
- 不提供 CSV / JSON 导出；不做风险评分、异地告警或实时推送（见 §5）。

## 3. 字段与脱敏

| 字段 | 说明 | 约束 |
| :--- | :--- | :--- |
| `type` / `result` / `channel` | 固定枚举 | 见 `utils/shared/login-events.ts`；未知通道回落 `unknown` |
| `userId` | 事件关联用户 | 匿名 / 未知失败为空 |
| `ip` / `userAgent` | 请求来源 | 登录事件仅管理员可见；可信设备的 IP / UA 仅本人与管理员可见 |
| `metadata` | 补充字段 | 白名单键（provider / factor / reason 等）+ 标量值 + 值级兜底脱敏；读取端再过滤一次 |
| `trusted_device.identifier` | 与 `verification.identifier` 对齐 | 不包含凭据本身；吊销时两表同时删除 |

禁止落库：密码、验证码、令牌、备份码 / 恢复码。邮箱与令牌形态由值级脱敏拦截；手机号依赖白名单键与写入方约束（自由文本尚未做值级手机号脱敏）。

## 4. 保留期与清理

- `LOGIN_EVENT_RETENTION_DAYS` 默认 90 天，范围 1–3650；非法 / 越界回落 90。
- 管理端统计查询触发进程内 1 小时节流的惰性清理；并发复用同一 in-flight 任务，失败重置节流。
- 手动脚本 `scripts/maintenance/prune-login-events.mjs` 默认 dry-run，`--confirm` 才删除，当前支持 SQLite；MySQL / PostgreSQL 由惰性清理覆盖（多方言脚本登记在 backlog）。
- 不引入常驻调度器；删除只影响早于截止时间的事件。

## 5. 审计

| 动作 | 触发 | 字段 |
| :--- | :--- | :--- |
| `twoFactor.challenge` | 2FA 挑战签发 | 通道、用户 |
| `twoFactor.verify` | 2FA 验证成功 / 失败 | 因子、trustDevice、结果 |
| `trustedDevice.create` | 勾选信任设备成功 | identifier |
| `trustedDevice.revoke` | 用户或管理员吊销 | identifier、来源 |
| `session.revokeAll` | 管理员批量撤销 | 目标用户、来源 |

审计走 `logger.audit` 文件通道，不落密码 / 令牌；`identifier` 不构成可直接使用的凭据。

## 6. 明确不做

- CSV / JSON 导出、SOC2 / ISO27001 报表；
- 风险评分、异地登录告警、异常 IP 实时通知；
- 文件审计迁库与审计检索 UI；
- 用户侧事件列表；
- 多租户、Redis 跨实例限流、常驻清理调度器。

## 7. 查询与索引口径（阶段 13 M1）

| 项 | 口径 |
| :--- | :--- |
| `login_event.ip` 列 | `varchar(45)`（覆盖 IPv6 文本上限）；升级语句与回滚见 [数据库设计](./database.md#阶段-13登录事件-ip-列与索引) |
| IP 索引 | `IDX_login_event_ip_created_at`（`ip, created_at`）；索引不含 `id`，排序在部分方言仍可能走临时排序 |
| IP 筛选语义 | 精确匹配，**不追加隐式时间窗**：只有显式传 `startDate` / `endDate` 才生成时间谓词；列表端点未传时返回全保留期命中集合（统计端点的 `total` 同样为全保留期，`dailyTrend` 仍默认 30 天） |
| 大时间跨度 | 仍建议显式带时间窗：保留期上限 3650 天，无窗口时命中集合可达全量，而列表端点每页都要执行 `COUNT(*)` 并 `OFFSET` 跳过，成本随集合线性增长；索引只减少扫描量，不消除统计与深分页开销 |
| 响应字段 | 列表 / 统计 / 热力图的字段、UTC 口径与窗口上限均不随索引改动变化 |

- 写入侧不对 `ip` 做 `net.isIP` 校验与长度归一化，超长 / 非法值在 MySQL 严格模式与 PostgreSQL 下会整行拒绝，缺口见 [backlog §3.3](../plan/backlog.md#33-基础设施)。
- 验证方式：`tests/unit/server/login-events-repository.spec.ts` 锁定「IP-only 无时间谓词」「显式窗口才生成谓词」「分页契约字段不变」。
