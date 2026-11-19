# 2026-11-19 阶段 9 范围登记：账号找回与 2FA 边界治理（阶段 0–1）

> **状态**：已选定方向（2026-11-19 用户在规划候选中选择「账号找回与 2FA 边界治理」），范围待用户确认后开工。
> **单一事实源**：阶段范围、原子条目与验收见本文；设计依据与威胁模型见 [账号找回与 2FA 边界设计草案](./2026-11-18-account-recovery-design.md) §2 / §6。
> **前置**：[阶段 8 收口记录](./2026-11-19-phase8-closure.md)（5 语 × 1510 键、测试 1154、视觉 136、CI 全绿）。
> **设计定位**：本阶段只做设计草案的**阶段 0（基线与可观测性）与阶段 1（修复假通道）**，不改变根凭据模型。

## 1. 阶段目标

1. **先修事实**：让「看起来有、实际没有」的通道要么可用、要么明确不可用，杜绝「提示已发送但实际未发送」。
2. **先有可观测性**：改邮箱、2FA 开关、密码重置、社交 / 手机绑定四条路径留下结构化审计事件（操作人、目标、before / after、来源、结果），为阶段 2 的人工兜底与阶段 3 的替代证明提供取证基础。
3. **先有行为基线**：关键恢复路径的失败用例（旧邮箱失效、目标邮箱被占用、SMTP 失败、2FA OTP 发送失败、备份码耗尽）固化为测试，避免后续阶段改动无声回退。
4. **不引入死锁**：本阶段不做 2FA 收紧（阶段 4）、不引入恢复码与冷静期（阶段 3）、不新增审批流（阶段 2），保持现有可恢复路径不变或变好。

## 2. 范围与非目标

### 2.1 本阶段范围

- 结构化审计：`server/utils/logger.ts` 的 audit 通道 + 四条路径的调用点（改邮箱、2FA 开关、密码重置、社交 / 手机绑定）。
- 失败用例与行为快照：`tests/unit/`（服务 / composable 层）与必要的 API 层用例。
- 假通道修复：短信重置密码、备份码再生成、2FA 邮件 OTP 回落与提示、改邮箱 / 改绑 / 撤销会话的错误检查、管理员改密码端点、密码重置后撤销会话与通知。
- 文档与文案：`docs/standards/security.md` 补「2FA 覆盖边界」与「恢复等级 / 恢复因子」口径；修正「短信 / 邮箱验证码属于 2FA 方法」的表述；2FA OTP 邮件文案接入语言包。
- 受影响的 UI 基线：`/profile` 改邮箱对话框、`/security` 备份码区块、`/admin/users` 改密码对话框（仅当渲染变化时重采）。

### 2.2 非目标

- **不做根凭据模型变更**：不新增恢复码表、不改改邮箱的「旧邮箱确认」模型、不引入冷静期（均属设计阶段 3）。
- **不做 2FA 覆盖收紧**：邮箱 OTP / 魔法链接 / 社交 / SSO / 验证链接仍不触发 2FA（阶段 4，且必须先有阶段 2 / 3）。
- **不做管理员 2FA 重置与审批流**：属阶段 2，依赖 D4 决策。
- **不改数据模型**：本阶段审计走结构化日志，不建审计表；表结构留到阶段 2（届时随管理端展示一并设计）。
- **不引入短信供应商**：短信通道按「已配置则用、未配置则明确不可用」处理。
- **不翻译用户生成内容**，不调整既有 zh-CN / en-US 语义（仅随键同步）。

## 3. 现状取证（2026-11-19 复核）

| 项 | 现状 | 证据 |
| :--- | :--- | :--- |
| 邮箱验证码重置密码 | 已配置，可发送 | `lib/auth.ts:308-336`（`emailOTP.sendVerificationOTP` 的 `forget-password` 分支） |
| 短信验证码重置密码 | **空壳**：`$phoneNumber` 未配置 `sendPasswordResetOTP` | `lib/auth.ts:337-356` |
| 备份码 | 仅启用时展示；`/two-factor/generate-backup-codes` 未接 UI | `composables/use-security-settings.ts:87-115`；全仓无 `generate-backup-codes` 引用 |
| 2FA 邮件 OTP | 发送不 `await`、失败不回落手机；邮件主题 / 正文硬编码中文 | `lib/auth.ts:372-392` |
| 管理员改密码 | UI 把密码塞进 `updateUser.data`，上游以 `PASSWORD_CANNOT_BE_UPDATED_VIA_UPDATE_USER` 拒绝；正确端点 `/api/auth/admin/set-user-password` 未接 | `components/admin/users/user-detail-dialog.vue`；`server/middleware/3-demo-guard.ts:46` 已引用该路径 |
| 改邮箱静默失败 | 前端不检查 `{ error }`；目标邮箱被占用时上游静默返回成功 | `components/profile/edit-email-dialog.vue`；上游 `update-user.mjs` |
| 密码重置后会话 | 默认不撤销、不通知 | 上游 `utils/password.mjs`（未配置 `revokeSessionsOnPasswordReset`） |
| 审计 | 只有通用 API 请求日志，无 before / after 与操作原因 | `server/middleware/1-log.ts`；`server/utils/logger.ts:94` 已有 audit 文件通道 |
| 2FA 触发范围 | 仅邮箱 / 用户名 / 手机号 + 密码登录 | 上游 `two-factor` 插件 `signInPaths` |

## 4. 阶段构成（10 条原子条目）

| 编号 | 条目 | 交付面 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| M1 | 恢复路径结构化审计 | `server/utils/logger.ts` audit 通道 + 4 条路径调用点 | 事件含 operator / target / before / after / ip / ua / result；四条路径各有用例断言；用户可见行为不变 | 无 |
| M2 | 恢复路径失败用例与行为快照 | `tests/unit/**`、必要的 API 层用例 | 旧邮箱失效 / 目标邮箱被占用 / SMTP 失败 / 2FA OTP 发送失败 / 备份码耗尽均有失败用例 | M1 |
| M3 | 安全规范与文案一致性 | `docs/standards/security.md`、i18n 语言包、用户文档 | 明确 2FA 覆盖边界与恢复等级；「短信 / 邮箱验证码属于 2FA」表述修正；5 语键同构 | 无 |
| M4 | 短信重置密码空壳收口 | 前端入口 + 服务端错误码 | 未配置短信时入口不显示、API 返回明确错误；配置时发送成功 | M3 |
| M5 | 备份码重新生成 | `/security` UI + composable + 审计 | 密码确认后可重新生成并一次性展示；旧码失效；有审计事件 | M1 |
| M6 | 2FA 邮件 OTP 回落与提示 | `lib/auth.ts` + 邮件服务 + 语言包 | 发送 `await`；邮件失败回落已验证手机；前端明确提示成功 / 失败；文案走语言包 | M3 |
| M7 | 改邮箱 / 改绑 / 撤销会话错误检查 | 3 个 composable + 对话框 | 目标邮箱被占用、改绑失败、撤销失败均给出明确提示；不再静默成功 | M2 |
| M8 | 管理员改密码走正确端点 | `user-detail-dialog.vue` + admin 调用层 | 管理员改密码成功；失败有本地化提示；有单测 | M2 |
| M9 | 密码重置后撤销会话与通知 | `lib/auth.ts` + 邮件通知 + env 开关 | 重置成功后旧会话失效；发送安全通知；开关默认开启、可关闭 | M2 / M6 |
| M10 | 视觉、文档与收口 | 视觉基线、文档、归档 | 受影响页面视觉通过；全量门禁通过；收口记录与归档 | M1–M9 |

> **拆分规则**：单条超过「10 文件 / 800 行」时拆条；M1 若因四条路径跨文件过多，可拆为「审计基座」+「路径接入」两条。

## 5. 关键口径

### 5.1 审计事件

- 通道：复用 `server/utils/logger.ts` 的 audit 文件（已存在），新增结构化字段，不建表、不改 schema。
- 必填字段：`action`（email.change / twoFactor.enable / twoFactor.disable / backupCodes.regenerate / password.reset / social.bind / phone.bind）、`actorId`、`targetUserId`、`before`、`after`、`result`（success / failure + reason）、`ip`、`userAgent`、`source`（web / admin）。
- 不记录密码、验证码、备份码明文；`before` / `after` 只记录状态差异（如 `emailVerified: true → false`、`twoFactorEnabled: false → true`）。

### 5.2 「假通道」判定

- 前端展示可操作入口、后端返回成功，但用户实际收不到验证码 / 通知 → 视为假通道，必须在本阶段消除（要么补实现，要么隐藏入口 + 明确错误）。
- 失败必须可区分：未配置（`CHANNEL_NOT_CONFIGURED`）、发送失败（`SEND_FAILED`）、目标占用（`TARGET_TAKEN`）。错误码进入共享 Zod / API 错误口径，文案走语言包。

### 5.3 2FA 覆盖边界（文档口径）

- 本阶段只在文档与前端提示中澄清现状：邮箱 OTP、手机 OTP、魔法链接、邮箱验证链接自动登录、社交 / SSO 登录**不触发** 2FA。
- 不在代码层收紧；收紧属阶段 4，且必须晚于阶段 2 / 3（否则制造死锁）。

### 5.4 回滚

- 每条修复按条回退，不依赖数据迁移；M9 的会话撤销与通知由 env 开关控制，异常时可关闭。
- M4 若因部署方启用短信而需要真实发送，按部署配置生效，不改变未配置环境的默认行为。

## 6. 依赖与风险

| 项 | 说明 | 缓解 |
| :--- | :--- | :--- |
| 鉴权面改动 | 改的是登录 / 找回 / 管理端写操作 | 审计按 `deep` 执行；每条改动附失败用例；不改上游插件内部实现 |
| 管理员改密码 | 权限集中，误操作影响大 | 本阶段只切端点 + 失败提示；审批 / 工单留阶段 2（D4） |
| 密码重置撤销会话 | 可能打断在线用户 | 默认开启但提供 env 开关；通知说明原因 |
| 2FA OTP 回落 | 短信未配置时无回落目标 | 回落仅在手机已验证且短信已配置时生效，否则提示不可用 |
| 审计日志量 | 四条路径 + 备份码操作 | 只记状态差异，不记明文；沿用现有轮转 |
| 上游限制 | `changeEmail` 无替代证明参数、`twoFactor` 无管理员重置 | 本阶段不依赖这些能力；阶段 2 / 3 再评估自建端点 |

## 7. 验证矩阵

| 阶段 | 必跑 |
| :--- | :--- |
| M1–M2 | `pnpm lint`、`pnpm typecheck`、`pnpm test`（定向 + 全量）、`pnpm ai:check` |
| M3 | `pnpm i18n:check`、`pnpm lint:md:check` |
| M4–M9 | 上述 + `pnpm build`、`pnpm test:coverage`、`pnpm migration:check-budget`、`pnpm lint:duplicate`；涉及 UI 的跑 `pnpm test:visual`（容器） |
| M10 | 全量门禁 + 视觉 + `pnpm security:alerts`（CI 承担 token 场景） |

定向验证（每条）：审计事件字段断言；失败用例覆盖 `CHANNEL_NOT_CONFIGURED` / `SEND_FAILED` / `TARGET_TAKEN`；管理员改密码成功 + 失败；重置后旧会话 `401`、新密码可登录。

## 8. 交付与收口

- 每条完成即 Review Gate 后提交；涉及鉴权的批次 `audit-depth=deep`。
- M10 产出阶段 9 收口记录，归档到 [已完成工作归档](../../archive/completed-work.md)。
- 未完成项回填 backlog：阶段 2–5 的恢复模型（恢复码 / 冷静期 / 管理员兜底 / 2FA 收紧）与 D1–D7 决策。

## 9. 实施前确认事项（2026-11-19）

| 编号 | 待确认内容 | 默认建议 |
| :--- | :--- | :--- |
| C1 | 短信重置：未配置短信服务时的处理 | 隐藏入口 + 返回 `CHANNEL_NOT_CONFIGURED`；本阶段不引入短信供应商 |
| C2 | 密码重置成功后撤销全部会话并发通知 | 默认开启，提供 env 开关 |
| C3 | 管理员改密码的范围 | 只切到 `/api/auth/admin/set-user-password` + 失败提示；审批 / 工单留阶段 2（与 D4 一并决策） |
| 范围 | 只做设计草案阶段 0–1（10 条原子条目） | 按本表实施，不进入阶段 2–5 |
| 决策依赖 | D1 / D2 / D4 / D5 等 7 项 | 本阶段不阻塞；阶段 2 开工前定 D4，阶段 3 前定 D1 / D2 / D3 / D5 / D6 / D7 |

**外部状态（规划时点 2026-11-19）**：open issue 1（#114 讨论类）、open PR 0、最近 15 次 workflow 全 success；阶段 8 已收口，无在途变更冲突。

**确认记录**：待用户确认后补记（确认即在本表下追加日期与结论）。
