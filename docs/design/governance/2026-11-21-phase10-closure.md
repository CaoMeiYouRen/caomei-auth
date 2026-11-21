# 2026-11-21 阶段 10 收口记录：用户侧替代证明（恢复码 / 已验证手机 / 冷静期）

> **状态**：M1–M5 / 14 小条目全部交付，2026-11-21 收口。
> **范围与验收**：[阶段 10 范围登记](./2026-11-21-phase10-registration.md)。
> **阶段正文与提交清单**：[todo-archive-phases-10](../../plan/archive/todo-archive-phases-10.md)；里程碑见 [roadmap-phases-10](../../plan/archive/roadmap-phases-10.md)。
> **前置**：[阶段 9 收口记录](./2026-11-20-phase9-closure.md)（结构化审计、`ChannelChangeRequest`、强制重置）。

## 1. 交付清单

| 条目 | 交付 | 状态 |
| :--- | :--- | :--- |
| M1.1 | `RecoveryCode` 实体、80 bit 熵 + sha256 哈希、批量签发、新鲜会话 + 第二因子（TOTP / 备份码）重签；`lastUsedTimeStep` CAS 防重放 | 完成 |
| M1.2 | 恢复码列表 / 删除 / 轮换接口；列表不含明文或哈希；重签后旧码全部失效 | 完成 |
| M2.1 | 请求模型扩展（`source` / `scheduledAt` / `cancelledAt` / `proofFactor`）、`resolveRequestState` 纯函数、管理员确认端点与确认页来源门禁 | 完成 |
| M2.2 | `verifyRecoveryProof` / `consumeProofFactor`：4 类因子、按用途强制因子集合、失败计数 15 分钟 5 次锁定（事务外保留）、TOTP / 备份码按原格式消费 | 完成 |
| M2.3 | `POST /api/security/email/change-with-proof`：密码 + 因子校验、事务内消费并创建 pending、新邮箱归属码投递；`POST /api/security/proof-otp` 仅向已验证手机投递 | 完成 |
| M2.4 | 新邮箱归属验证（6 位 / 10 分钟 / 3 次）、冷静期配置（默认 24h、上限 72h、越界回退） | 完成 |
| M3.1 | `applyScheduledChannelChange` 单事务生效（状态推进 + 邮箱覆写 + 会话撤销 + 审计）、登录钩子惰性生效、二级存储缓存失效、双通道通知 | 完成 |
| M3.2 | 撤销与状态查询端点、申请 / 撤销 / 生效三类通知、倒计时数据 | 完成 |
| M4.1 | `POST /api/security/password/self-service`：新鲜会话 + 第二因子（排除手机 OTP）、OAuth-only 补建 credential、撤销其他会话 | 完成 |
| M4.2 | `security.md` §1.3 L0 分支与不变量 3 限定、设计草案落地回写、`AUDIT_ACTIONS` 扩展 | 完成 |
| M5.1 | 安全页恢复码面板（剩余数量、生成 / 重签、一次性展示与复制下载、2FA 第二因子） | 完成 |
| M5.2 | `use-channel-change` 组合式、换邮箱弹窗、冷静期倒计时卡、5 语文案 | 完成 |
| M5.3 | 真实内存 SQLite 集成测试、安全页视觉矩阵新增 2 个交互态并重采基线 | 完成 |
| M5.4 | 首个归档分片与索引、roadmap 里程碑指针、`check-planning-docs` 机检脚本与 CI 接线 | 完成 |

## 2. 终态指标

| 指标 | 收口值 | 对照（阶段 9） |
| :--- | :--- | :--- |
| 测试 | **1325 passed / 188 files** | 1225 / 169 |
| 覆盖率 | Statements **77.96%** / Branches 64.26% / Functions 71.83% / Lines **78.15%** | 78.53% / 64.17% / 72.80% / 78.80% |
| 视觉基线 | **138 passed**（安全页重采 6 张 + 新增 2 张交互态） | 136 |
| 提交 | **19 个**（14 条目提交 + 4 个 R1 修复 + 1 个收口；含 1 个类型修正） | 20 |
| 质量门 | `lint` / `lint:css` / `typecheck` / `i18n:check` / `lint:md:check` / `planning:check` / `test` / `test:visual` 全绿；构建在 Playwright 容器内完成 | 同左 |

## 3. 阶段级变更

- **恢复码**：新增 `server/entities/recovery-code.ts`、`server/utils/recovery-code.ts`。与 2FA 备份码分离（D2）；只存 sha256 哈希，明文仅签发响应一次；重签「删除旧码 + 写入新码」在单事务内完成。
- **恢复证明**：新增 `server/utils/recovery-proof.ts`（用途因子集合 `PURPOSE_FACTORS`、密码 → 因子 → 状态判定顺序、`userId + factor` 失败计数）、`server/utils/proof-factors.ts`（TOTP / 备份码解密与 CAS 消费）、`server/utils/proof-otp.ts`（`recovery-proof:` 前缀的证明短信 OTP，哈希 + 3 次尝试 + 单用户 3 次/分节流）。
- **改绑状态**：新增 `server/utils/channel-change-state.ts`，`resolveRequestState` 统一验证码窗（`createdAt + 10 分钟`）与冷静期（只认 `scheduledAt`）判定；`expiresAt` 不再参与冷静期生效。
- **生效与通知**：新增 `server/utils/channel-change-apply.ts`（单事务条件更新防并发、目标占用与注册策略复查、DB 会话删除、提交后缓存失效 + 审计 + 双通道通知）与 `server/utils/channel-change-notify.ts`。
- **端点**：`/api/security/recovery-codes`（GET / POST regenerate / DELETE）、`/api/security/email/change-with-proof`（POST / GET / confirm / cancel）、`/api/security/proof-otp`、`/api/security/password/self-service`。
- **显式与隐式边界**：管理员即时确认端点对 `source=user` 一律 403；手机 OTP 由服务层拒绝用于设密码；自助改邮箱生效后只撤销会话、不置 `mustResetPassword`。
- **界面**：`components/security/recovery-code-panel.vue`、`email-change-dialog.vue`、`channel-change-card.vue` 与 `composables/use-channel-change.ts`；安全页接线；5 语键同构。
- **治理**：`security.md` §1.3 新增 L0 两条分支、恢复码口径与不变量 5；`AUDIT_ACTIONS` 扩 10 个 action；`planning.md` §6 增加机检范围；新增 `scripts/quality/check-planning-docs.mjs` 并接入 Test 与每周回归。

## 4. 与范围登记的偏差（均已登记理由）

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| 提交数 | 14–17 | 19 | 每个大条目各一轮 Review Gate，新增 4 个 R1 修复提交与 1 个类型修正提交；条目提交本身仍为 14 个 |
| 单条目文件数 | 建议 ≤10 | M1.1 16 个 | 其中 5 个为同一错误键集合的 5 语语言包，属同一逻辑变更，未拆分 |
| 恢复码存储 | 哈希 + 一次性 | 同左；额外补单事务重签 | Review Gate 发现「先删后写」存在零码窗口，改为事务内完成 |
| 备份码消费 | 「按加密格式解密后比对」 | 兼容明文与加密两种存储，并按原格式写回 | 项目未开启 `storeBackupCodes: 'encrypted'`；强行按密文写回会破坏其余备份码 |
| 证明 OTP 限流 | 同一用户 3 次/分 | IP 限流 + 20 秒单用户节流 | 20 秒间隔等价 3 次/分，且能抑制重复投递；多实例缺口仍在 backlog |
| 视觉 pending 态 | 默认 / pending / 错误三态视觉齐全 | pending 冷静期态未采像素基线 | 需要预置 pending 请求夹具（恢复码 + 归属验证）；组件单测覆盖 pending / 无归属 / 已生效 / 过期四态，缺口写入归档块 |
| 视觉矩阵 | 新增页面标 `reference: false` | 为 `VisualState` 增加 `reference` 字段 | 新交互态没有迁移前参考图，若只在路由层标记会让 parity 层找不到参考图 |

## 5. 遗留与已知边界

- **真实存储矩阵**：Redis 二级存储的会话键清理、MySQL / PostgreSQL 事务与行锁并发只在单测（mock / 内存 SQLite）验证，未做实机回归；发布前需按 [安全规范 §5.1.3](../../standards/security.md#513-发布前安全告警门禁-release-security-alert-gate) 的回归矩阵补一次。
- **多实例限流**：证明失败计数与证明 OTP 节流均为进程内实现，多实例部署下按实例计数；沿用 backlog 既有缺口，本阶段明确不引入 Redis。
- **冷静期漂移**：无后台调度器，到期依赖「登录 / 状态查询」读路径惰性生效；不活跃用户的生效上限 = 下次登录，已在范围登记 §7 接受。
- **视觉 pending 态**：见 §4 偏差表；后续补夹具时可复用 `channel-change-integration.spec.ts` 的造数路径。
- **通知投递**：邮件失败会回落新邮箱并写审计；Spug 短信仍不支持自由文本通知（阶段 9 遗留）。
- **后续方向**：收紧 2FA 覆盖（设计草案阶段 4）必须晚于本阶段，现已具备前置；审批流 / 审计检索 / 可信设备 / passkey 仍需用户另行授权，候选见 [backlog §2.12](../../plan/backlog.md)。

## 6. 验证命令

```bash
pnpm lint && pnpm lint:css && pnpm typecheck && pnpm i18n:check && \
pnpm lint:md:check && pnpm planning:check && pnpm test && pnpm test:coverage
pnpm test:visual   # 容器内，138 passed
```

## 7. 运行时抽查

| 路径 / 操作 | 结果 |
| :--- | :--- |
| `POST /api/security/recovery-codes/regenerate`（未登录） | 401 |
| `GET /api/security/recovery-codes`（未登录） | 401 |
| `POST /api/security/email/change-with-proof`（未登录） | 401 |
| `POST /api/security/email/change-with-proof/confirm`（未登录） | 401 |
| `POST /api/security/proof-otp`（未登录） | 401 |
| `POST /api/security/password/self-service`（未登录） | 401 |
| `/security`（未登录） | 重定向登录页 |
