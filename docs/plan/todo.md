# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段的进度表与大 / 小条目；准入、粒度、进度表与归档规则见 [规划规范](../standards/planning.md)。已收口阶段的索引见 [阶段归档索引](./todo-archive.md)（阶段 1–9 的权威记录见 [规划规范](../standards/planning.md) §4，摘要见 [已完成工作归档](../archive/completed-work.md)），未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前阶段：阶段 10「用户侧替代证明（恢复码 / 已验证手机 / 冷静期）」**（2026-11-21 登记，待确认后开工）。范围、决策记录（D1 / D2 / D3 / D5 / D6 / D7 / D10）、容量基线与不做范围见 [阶段 10 范围登记](../design/governance/2026-11-21-phase10-registration.md)。

## 阶段 10：用户侧替代证明（2026-11-21 登记）

> **目标**：旧邮箱失效但持有恢复因子的用户可自助换邮箱（密码 + 第二因子），换绑经冷静期可撤销；生效后旧邮箱立即失效。OAuth-only 用户可受控自助设置密码进入自助恢复（L0 扩展）。
> **容量基线**：commits 14–17 / files 36–50 / 行 1,800–2,500（逐条目拆解，测量方 = 规划角色）。
> **执行顺序**：M1 → M2 → M3 → M4 → M5。
> **不做范围**：收紧 2FA 覆盖、管理员重置 2FA / 代设密码、审批流 / 工单、审计检索界面、社交作恢复因子、可信设备 / passkey、Redis 跨实例限流（详见登记记录 §6）。

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 恢复码基座 | 0/2 | 未开始 | — | — | 2–3 → — |
| M2 替代证明与改邮箱 | 0/4 | 未开始 | — | — | 4–5 → — |
| M3 冷静期与生效 | 0/2 | 未开始 | — | — | 2–3 → — |
| M4 自助设置密码与审计口径 | 0/2 | 未开始 | — | — | 2 → — |
| M5 界面、测试与收口 | 0/4 | 未开始 | — | — | 4 → — |

### M1 恢复码基座（P0 🛠️🛡️）

- **目标**：建立与 2FA 备份码分离的独立恢复码，支撑「通道全失」场景的自助恢复证明（D2）。
- **优先级**：P0（M2 的证明因子依赖它；无恢复码则替代证明只剩手机与 TOTP）。
- **范围**：`RecoveryCode` 实体（userId / codeHash / usedAt / createdAt）、≥64 bit 随机、sha256 哈希、批量签发 10 条、一次性展示、剩余数量只读、重签失效旧码、删除单码；消费函数仅内部可用（不暴露公开校验端点）。
- **验收标准**：库内无明文；明文只在生成响应中出现一次；消费走 `usedAt IS NULL` 条件更新，第二次返回 `PROOF_CONSUMED`；重签后旧码全部拒绝；审计覆盖生成 / 使用 / 重签。
- **不做什么**：不复用 2FA 备份码表（D2）；不做恢复码导入 / 打印模板；不做过期自动回收。
- **依赖**：阶段 9 的 `logger.audit` 通道与限流工具。
- **交付物**：实体 + `server/utils/recovery-code.ts`（含 `isFreshSession` 助手）+ 3 个端点 + 单测；2–3 次提交。
- **风险与缓解**：明文外泄 → 一次性展示 + 哈希存储；并发消费 → 事务内条件更新；暴力尝试 → 校验端点限流 + 尝试计数。

#### M1.1 恢复码实体与签发

- **目标**：新增 `RecoveryCode` 实体与签发逻辑，一次生成 10 条、只返回一次明文。
- **验收标准**：单测覆盖熵源长度、哈希存储、批量去重、明文仅响应一次；重建后剩余数量正确；生成 / 重签要求 fresh session（15 分钟内登录），已启用 2FA 的账号另需第二因子（OAuth-only 用户因此可自助生成）。
- **交付物**：`server/entities/recovery-code.ts`、`server/utils/recovery-code.ts`（含 `isFreshSession`，读 `session.createdAt`，15 分钟口径）、`POST /api/security/recovery-codes/regenerate`、实体注册（`server/database/index.ts`）与建表脚本（`database/sqlite/create.sql`）、单测。
- **依赖**：阶段 9 `server/database/index.ts` 实体注册约定。

#### M1.2 消费函数与轮换

- **目标**：提供内部消费函数（供 M2.2 调用）、剩余数量查询、删除单码与重签。
- **验收标准**：消费为 `usedAt IS NULL` 条件更新，并发双花只有一个成功，第二次返回 `PROOF_CONSUMED` 且无副作用；已用 / 不存在对外统一错误码；重签后旧码全部拒绝；列表不含明文；全部端点要求登录会话。
- **交付物**：消费函数、`GET /api/security/recovery-codes`、`DELETE /api/security/recovery-codes/[id]`、单测。
- **依赖**：M1.1。

### M2 替代证明与改邮箱（P0 🛠️🛡️）

- **目标**：扩展改绑请求模型，并允许「密码 + 恢复码 / 已验证手机 OTP / TOTP / 备份码」发起换邮箱（D1 / D3 / D6）。
- **优先级**：P0（本阶段核心能力）。
- **范围**：请求模型扩展与**来源门禁**（`source` / `scheduledAt` / `cancelledAt` / `proofFactor` + `resolveRequestState`）、`verifyRecoveryProof` 服务（`purpose` 区分改邮箱 / 设密码、4 类因子、`allowedFactors`、稳定错误码、事务外失败计数）、`change-with-proof` 端点（证明校验与消费 → 新邮箱占用 → 归属验证码 → 建 pending）、受控证明 OTP 发送端点（`POST /api/security/proof-otp`，标识前缀 `recovery-proof:`）、新邮箱归属验证（6 位 / 10 分钟 / 3 次，复用 `CHANNEL_CHANGE_EXPIRES_IN_MS`）。
- **验收标准**：密码错误、因子缺失、因子失效返回稳定错误码；因子失败按 `userId + factor` 计数（15 分钟 5 次锁定，进程内缓存）且**回滚不清零**；社交绑定不作为因子；新邮箱未验证不进入冷静期；同一用户仅一个 pending（新建时先取消旧请求）；目标占用 409；阶段 9 确认端点拒绝 `source=user`（403 `CHANNEL_CHANGE_KIND_MISMATCH`）、管理员路径零回归。
- **不做什么**：不新增管理员入口（D4 / D8 / D9 不变）；不改造既有旧邮箱确认流程；不接受未注册用户或无密码用户的裸请求。
- **依赖**：M1（恢复码消费）；阶段 9 `ChannelChangeRequest` 与 `createChannelChangeRequest`（既有「取消旧 pending 再新建」语义保持不变）。
- **交付物**：实体变更 + 建表脚本 + `server/utils/channel-change-state.ts` + `server/utils/recovery-proof.ts` + 2 个端点 + 单测；4–5 次提交。
- **风险与缓解**：证明校验被绕过 → 服务内统一判定顺序（密码 → 因子 → 状态）；新邮箱填错 → 归属验证通过才建 pending。

#### M2.1 请求模型扩展、来源门禁与状态判定

- **目标**：`ChannelChangeRequest` 增加 `source`（admin/user）、`scheduledAt`、`cancelledAt`、`proofFactor`；实现 `resolveRequestState(now)`；阶段 9 即时确认端点增加来源门禁。
- **验收标准**：`source NOT NULL DEFAULT 'admin'`（老数据回填 admin）、其余列 nullable，阶段 9 数据可读；枚举沿用 `pending / confirmed / cancelled / expired`（`confirmed` 即「生效」，不新增 `effective`）；判定纯函数：`scheduledAt` 为空时按 `expiresAt` 判过期（阶段 9 即时确认路径）；`scheduledAt` 非空时**只**以 `scheduledAt` 判生效（`now >= scheduledAt`），`expiresAt` 不参与状态判定、也不被覆写；验证码窗统一用 `createdAt + CHANNEL_CHANGE_EXPIRES_IN_MS`；`confirmedAt` 只在生效时写入（M2.4 归属确认不写）；边界用例（空值过期 / 10 分钟验证窗 / 24h / 72h / 已撤销）通过；确认端点与 `[id].get.ts` 对 `source=user` 一律 403 / 不渲染确认页，门禁位于验证码校验之前；管理员路径回归用例通过；`database/sqlite/create.sql` 同步。
- **交付物**：`server/entities/channel-change-request.ts`（含取消旧请求 / 占用失败 / 策略拒绝处写 `cancelledAt`）、`database/sqlite/create.sql`、`server/utils/channel-change-state.ts`、`server/api/channel-change/[id].post.ts` 与 `[id].get.ts` 来源门禁、i18n 错误键、单测。
- **依赖**：阶段 9 实体与 `channel-change.ts` 工具。

#### M2.2 自助恢复证明校验与消费

- **目标**：实现 `verifyRecoveryProof({ userId, purpose, password?, factor, code, sessionCreatedAt?, allowedFactors? })` 返回命中因子与失败原因，并提供 `consumeProofFactor` 供调用方在业务事务内原子消费。
- **验收标准**：`purpose` 区分 `change-email`（`password` 必需）与 `self-service-password`（`password` 可空，改由 `sessionCreatedAt` 判定 15 分钟内）；因子集合 = `PURPOSE_FACTORS[purpose]`（`self-service-password` 排除手机 OTP）∩ 可选 `allowedFactors`，调用方不能放宽；4 类因子各有成功 / 失败与「并发双花」用例；密码错误与因子错误返回不同稳定错误码；D6 断言社交绑定不可作为因子；校验只读，失败计数写事务外计数器（回滚不清零，成功清零，按因子独立计数）；消费按因子落锚点：恢复码 `usedAt IS NULL` 条件更新、备份码 `WHERE backup_codes = :old` CAS、TOTP 新增 `lastUsedTimeStep` 列 CAS、手机 OTP 消费带 `recovery-proof:` 前缀的 `verification` 行；重放统一返回 `PROOF_CONSUMED`。
- **交付物**：`server/utils/recovery-proof.ts`（校验 + 消费 + 失败计数器 + `PURPOSE_FACTORS`）、`server/entities/two-factor.ts`（新增 `lastUsedTimeStep`，并修正「逗号分隔哈希」注释）、建表脚本、共享错误码、单测。校验 TOTP / 备份码须按 better-auth `secretConfig` 对称解密后再比对，不得直接比较库内加密串。
- **依赖**：M1.2。

#### M2.3 改邮箱申请端点

- **目标**：`POST /api/security/email/change-with-proof` 完成证明校验与消费、新邮箱占用校验、归属验证码发送与 pending 请求创建（单事务）。
- **验收标准**：未通过证明 → 403 `PROOF_REQUIRED`；新邮箱已占用 → 409；恢复码在事务内消费，同一码重放 403，业务失败回滚不消费（失败计数保留）；端点要求登录会话并接入 `rateLimit`；请求含 `source=user` 与因子类型；同一用户最多一个 pending（复用「先取消旧请求再新建」语义）；审计完整（含因子类型）；发码端点仅对已验证手机生效（未验证 / 未配置 `PHONE_CHANNEL` 返回明确错误，不假装已发送），同一用户 3 次/分限流。
- **交付物**：端点、请求创建接线（调用 `consumeProofFactor`）、受控证明 OTP 发送端点（`POST /api/security/proof-otp`，仅向已 `phoneNumberVerified` 的手机投递 SMS，标识前缀 `recovery-proof:`；邮件仅用于通知，不作证明因子）、限流接入、单测（含并发双花与回滚后计数保留）。
- **依赖**：M1.2、M2.1、M2.2。

#### M2.4 新邮箱归属验证

- **目标**：6 位验证码确认新邮箱归属（10 分钟有效、3 次尝试），通过后写入 `scheduledAt`（默认 +24h，上限 72h）。
- **验收标准**：错码 / 超出 10 分钟验证窗（`createdAt + CHANNEL_CHANGE_EXPIRES_IN_MS`，**不读** `expiresAt`）/ 超限拒绝且不进入冷静期；通过后状态为 pending 并写入 `scheduledAt`（不改 `expiresAt`）；`scheduledAt` 已存在时重复确认幂等返回当前状态、不再消费验证码；验证码哈希存储；审计；端点要求登录会话并接入 `rateLimit`。
- **交付物**：`POST /api/security/email/change-with-proof/confirm`、冷静期配置（env schema + `.env.example`：默认 24h、上限 72h、越界回退默认）、单测。
- **依赖**：M2.3。

### M3 冷静期与生效（P0 🛠️🛡️）

- **目标**：换绑到期在单事务内生效（状态推进 + 字段收敛 + 会话撤销 + 审计 + 通知），可撤销（D5 / D7）。
- **优先级**：P0（无冷静期则等同管理员直接改绑，弱化防误操作目标）。
- **范围**：`server/utils/channel-change-apply.ts`（**事务内**：请求状态 + `email` / `emailVerified` + DB 会话删除 + `confirmedAt`；**提交后**：缓存失效、通知、成功审计，失败写 failure 审计）、`lib/auth.ts` 的 session 创建钩子与状态查询调用点、撤销与状态查询端点、申请 / 撤销 / 生效三类通知。
- **验收标准**：24h 默认、72h 上限可配置；到期首次访问即生效且只生效一次（`now >= scheduledAt`）；`email` 覆写为新邮箱（不置空）、`emailVerified=true`、DB 会话全部删除且缓存失效；pending 期可撤销、已生效 409；通知失败留原因不静默。
- **不做什么**：不引入后台调度器 / 队列；不改阶段 9 管理员改绑的即时生效与强制重置语义（来源门禁已由 M2.1 落地）；不做冷静期内二次改绑；不做自动重签恢复码。
- **依赖**：M2.1（模型与判定）、M2.4；阶段 9 审计与通知工具。
- **交付物**：生效事务 + 2 个端点 + 通知接线 + 单测；2–3 次提交。
- **风险与缓解**：并发重复生效 → 单事务 + 条件更新（`status=pending` 才更新）；无调度导致漂移 → 读路径统一判定；旧邮箱不可投递 → 记录失败并回落到新邮箱通知。

#### M3.1 生效事务与调用点

- **目标**：`channel-change-apply.ts` 在单事务内推进 `pending → confirmed`、覆写 `email`、置 `emailVerified`、删除该用户全部 DB 会话并写 `confirmedAt`；提交后失效缓存、发生效通知并写成功审计（失败写 failure 审计）；由 `lib/auth.ts` session 创建钩子与状态查询调用。
- **验收标准**：到期首次访问即生效且只生效一次；事务失败整体回滚（状态与字段不半途落库）；并发只生效一次；生效时复查目标邮箱占用与注册策略（冲突则取消并通知，不落库）；旧邮箱立即不能登录（登录请求本身触发 apply，apply 后终止本次登录不生成新会话）；DB 会话删除后同步失效二级存储（Redis / LRU）中的同批会话；审计含生效时间、来源与脱敏前后值（事务外写入，不随回滚消失）；状态非 `pending` 或 `scheduledAt` 为空的请求不进入本函数（阶段 9 管理员请求不经过此处）。
- **交付物**：`server/utils/channel-change-apply.ts`（会话删除用 `EntityManager` 直接删 `session` 表，不走 better-auth adapter 以免脱离事务）、`lib/auth.ts` 钩子接线、单测（事务回滚 / 并发 / 缓存失效）。
- **依赖**：M2.1、M2.4。

#### M3.2 撤销、状态查询与通知

- **目标**：`POST /api/security/email/change-with-proof/cancel` 与 `GET /api/security/email/change-with-proof`；申请 / 撤销 / 生效三类通知（旧邮箱可投递时双通道）。
- **验收标准**：pending 可撤销、已生效 409；状态查询返回 pending / confirmed / expired 与剩余时间（用于倒计时卡）；撤销后回到未申请态；两个端点要求登录会话并接入 `rateLimit`；通知失败记录原因；5 语键齐备。
- **交付物**：撤销与状态查询端点、通知模板接线、单测。
- **依赖**：M3.1。

### M4 自助设置密码与审计口径（P1 🛠️🛡️）

- **目标**：给 OAuth-only 用户一条受控进入自助恢复（L0 扩展）的路径，并把新分支写进安全规范的唯一口径（D10 / D8 保持）。
- **优先级**：P1（依赖 M2.2；不做则 OAuth-only 用户仍无法自助恢复）。
- **范围**：`POST /api/security/password/self-service`（fresh session + 第二因子，因子集合由服务层 `allowedFactors` 强制排除手机 OTP）；`security.md` §1.3 在 L0 条目本体补「密码 + 第二因子改已验证邮箱」分支与恢复码口径；`AUDIT_ACTIONS` 扩枚举。
- **验收标准**：非 fresh session、无第二因子、或仅持手机 OTP 一律 403；设置后撤销其他会话并审计；`security.md` 的 L0 分支可逐条对应实现；不新增 R0–R3 等级词表；D8 断言（管理员仍不能代设）。
- **不做什么**：不允许管理员代设密码（D8）；不允许在 pending 冷静期内设置密码；不开放无第二因子账号的密码重置捷径；不做审计检索界面。
- **依赖**：M2.2。
- **交付物**：1 个端点、`security.md` 更新、`server/utils/audit-log.ts` 枚举、单测；2 次提交。
- **风险与缓解**：fresh session 判定被绕过 → 服务端读会话时间而非客户端参数；因子集合被调用方放宽 → 由 `allowedFactors` 服务层强制。

#### M4.1 受控自助设置密码

- **目标**：`POST /api/security/password/self-service`：fresh session（15 分钟内，复用 M1.1 的 `isFreshSession`）+ 第二因子（恢复码 / TOTP / 备份码，排除手机 OTP）→ 设置密码；以 `purpose=self-service-password` 调用 M2.2（`password` 可空）。
- **验收标准**：非 fresh session 403；无第二因子 403；仅持手机 OTP 403（服务层拒绝，非调用方过滤）；OAuth-only（无密码）用户可走通并有专门用例；设置后撤销其他会话并审计；D8 断言（管理员仍不能代设）。
- **交付物**：端点、会话新鲜度校验复用、单测（含 OAuth-only 用例）。
- **依赖**：M2.2。

#### M4.2 审计与规范口径

- **目标**：`security.md` §1.3 的 L0 条目本体补「密码 + 第二因子改已验证邮箱」分支、恢复码口径、冷静期配置与触发条件；把「不变量 3：确认生效后强制重置密码」显式限定为 L1 管理员路径；同步扩展 `AUDIT_ACTIONS`。
- **验收标准**：L0 / L1 / L2 三段与实现逐条对齐（改邮箱分支写在 L0 内，L1 仍为管理员发起 + 强制重置，不变量 3 仅约束 L1）；恢复事件可按 `action` 在审计表查询（无 UI）；不存在「已实现但无审计」的路径；不新增 R0–R3 等级词表。
- **交付物**：`docs/standards/security.md`、`server/utils/audit-log.ts` 枚举、设计文档回填。
- **依赖**：M3.1、M4.1。

### M5 界面、测试与收口（P1 🎨🧪）

- **目标**：把新能力接到安全页与改邮箱流程，补齐测试、视觉与文案，并按 v1 产出首个归档分片与规划文档机检。
- **优先级**：P1（跟随 M1–M4；缺界面则能力不可用）。
- **范围**：恢复码卡片（`pages/security.vue` 接线）、改邮箱弹窗双通道、冷静期卡片、集成测试、视觉基线（桌面 / 移动 / 暗色）、5 语文案、阶段归档与 `check-planning-docs`。
- **验收标准**：一次性展示不可复看；390 无横向溢出；三态视觉齐全；全量门禁通过；`todo-archive.md` 首行落盘；`check-planning-docs` exit 0。
- **不做什么**：不改认证页整体布局；不为 2FA 弹窗补基线（仍留 backlog）；不做新的视觉分档策略。
- **依赖**：M1–M4 全部完成；`RecoveryCode` 与改绑新列已在 M1.1 / M2.1 进入 `database/sqlite/create.sql`；状态查询（M3.2）提供倒计时数据。
- **交付物**：3 个组件（恢复码面板 / 改邮箱弹窗 / 冷静期卡片）+ 1 个 composable + 测试 + 基线 + 文案 + 归档分片 + 机检脚本；4 次提交。
- **风险与缓解**：视觉夹具缺恢复码数据 → 预置夹具用户与恢复码记录；新列未进建表脚本会 500 → M1.1 / M2.1 同批更新（已列交付物）。

#### M5.1 安全页恢复码面板

- **目标**：`/security` 新增恢复码卡片：生成、一次性展示（复制 / 下载）、剩余数量、重签确认。
- **验收标准**：展示后不可复看；移动 390 不溢出；暗色正常；5 语键齐全；组件测试覆盖生成与重签。
- **交付物**：`components/security/recovery-code-panel.vue`、`pages/security.vue` 接线、组件测试。
- **依赖**：M1.2。

#### M5.2 换邮箱弹窗与冷静期卡

- **目标**：改邮箱弹窗支持恢复码 / 手机 OTP 双通道；pending 期显示剩余时间与撤销入口。
- **验收标准**：证明失败文案稳定；倒计时准确；撤销后回到未申请态；默认 / pending / 错误三态视觉齐全。
- **交付物**：弹窗组件、`use-channel-change` composable、冷静期卡片、组件测试。
- **依赖**：M2.4 / M3.2。

#### M5.3 测试与视觉

- **目标**：集成测试（成功 / 无因子 / 撤销 / 生效 / 并发）与视觉基线（1440 桌面、390 移动、暗色）。
- **验收标准**：失败路径均有断言；新增基线不自拍自比（parity 层标 `reference: false`）；视觉用例不使用 `clock.install`。
- **交付物**：Vitest 集成测试、视觉 spec、基线快照、夹具更新。
- **依赖**：M5.1 / M5.2。

#### M5.4 收口与机检

- **目标**：全量门禁、阶段归档（首个 `todo-archive-phases-10.md` 分片 + 索引首行）、`check-planning-docs` 脚本落地并接入 CI。
- **验收标准**：门禁全绿；索引倒序且覆盖全部 todo 分片；归档块 6 项齐全；`check-planning-docs` 对当前文档 exit 0。
- **交付物**：归档分片、`todo-archive.md` 索引行、`scripts/quality/check-planning-docs.mjs`、`package.json` 脚本、CI 接线。
- **依赖**：M5.3。
