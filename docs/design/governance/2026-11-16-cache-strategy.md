# 2026-11-16 缓存策略与性能回归阈值

> **范围**：阶段 6 M15（缓存策略评估与回归阈值）。基准脚本与索引见 M14；本文只记录选型结论、边界与阈值口径，不引入运行时缓存实现。

## 1. 现状

| 层 | 实现 | 说明 |
| :--- | :--- | :--- |
| 数据库连接 | `server/database/index.ts` | SQLite / MySQL / PostgreSQL 三方言；SQLite 默认本地文件 |
| 进程内缓存 | `server/database/storage.ts` 的 `LRUCache` | 仅用于数据库存储层（TypeORM storage 适配），不是业务缓存 |
| 会话校验 | better-auth `getSession` | 每个受保护请求按 `token` 查 `caomei_auth_session`，M14 已补 `token` / `user_id` / `created_at` / `expires_at` 索引 |
| 多实例 | Docker 单实例默认 | 未部署 Redis；限流等仍为进程内状态（backlog §2.11 已登记多实例风险） |

M14 基准（50,000 行、200 次迭代、内存 SQLite）：`token` 查询 p95 < 0.01 ms，`user_id` / 时间范围 p95 < 0.1 ms，均走索引、无全表扫描。真实部署加网络与 ORM 开销后仍在毫秒级。

## 2. 选型结论

- **默认不引入业务层缓存**：索引后单次会话查询已是微秒级；缓存带来的失效一致性成本（登出、封禁、改密、管理端撤销会话）高于收益。
- **进程内 `lru-cache` 仅作为可选加速**：若未来出现单实例高 QPS 且数据库成为瓶颈，可按 `session.token` 做 30–60 秒 TTL 的短缓存，但必须同时处理：
    1. 登出 / 撤销会话 / 封禁 / 改密 / 2FA 变更时按 `userId` 失效；
    2. `expiresAt` 过期判定不依赖缓存；
    3. 缓存键包含 token 哈希，不落明文日志。
- **Redis 为可选路径，不设为必需依赖**：多实例部署需要共享会话 / 限流状态时再引入；届时缓存与限流共用同一实例，避免两套失效语义。
- **本轮不实现缓存**：阶段 6 只交付索引、基准与阈值；缓存实现需在出现明确瓶颈数据后单独立条（backlog 记录）。

## 3. 回归阈值

- 脚本：`pnpm perf:check` → `scripts/perf/check-perf-threshold.mjs`，固定 50,000 行 / 200 次迭代，读取 `scripts/perf/perf-thresholds.json`。
- 口径：**绝对毫秒上限**（`sessionByToken` 5 ms、`sessionByUserId` 50 ms、`sessionByDateRange` 50 ms、`deleteExpired` 200 ms），约为本机基线的 10 倍余量，避免 CI 抖动误报；同时要求无全表扫描。
- 环境差异：阈值为本地 / CI 参考值，真实 RDS 或网络数据库需按部署环境单独校准；不把该脚本接入发布门禁，只在性能相关改动时手动执行。

## 4. 验证

```bash
pnpm perf:session   # 输出 p50 / p95 到 artifacts/perf/
pnpm perf:check     # 按阈值判定，全表扫描或超限时退出码 1
```

单测覆盖分位数、扫描识别、seed 复现与阈值判定（`tests/unit/scripts/session-benchmark.spec.ts`）。
