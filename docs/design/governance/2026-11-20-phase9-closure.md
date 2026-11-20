# 2026-11-20 阶段 9 收口记录：账号找回与 2FA 边界治理（阶段 0–1 + 管理员协助恢复）

> **状态**：M1–M13 全部交付，2026-11-20 收口。
> **范围与验收**：[阶段 9 范围登记](./2026-11-19-phase9-registration.md)。
> **设计依据**：[账号找回与 2FA 边界设计草案](./2026-11-18-account-recovery-design.md) §2 / §5.5 / §7（D4 / D8 / D9）。
> **前置**：[阶段 8 收口记录](./2026-11-19-phase8-closure.md)（5 语 × 1510 键、测试 1154、视觉 136）。

## 1. 交付清单

| 条目 | 交付 | 状态 |
| :--- | :--- | :--- |
| M1 | 结构化审计：`logger.audit` 独立文件通道 + 改绑 / 2FA 开关 / 备份码再生成 / 密码重置 / 社交与手机绑定接线 | 完成 |
| M2 | 恢复路径失败用例：目标占用、SMTP / 短信失败、2FA OTP 双通道失败、备份码耗尽、旧通道不可投递 | 完成 |
| M3 | `security.md` 新增 2FA 覆盖边界、恢复等级 L0/L1/L2、D4 / D8 / D9 与审计口径；5 语键同构 | 完成 |
| M4 | 短信重置通道收口：未配置 `PHONE_CHANNEL` 返回 `CHANNEL_NOT_CONFIGURED`，配置后真实发送 | 完成 |
| M5 | 备份码重新生成：独立端点 + 密码确认 + 一次性展示 + 旧码失效 + 审计 | 完成 |
| M6 | 2FA 邮件 OTP：`await` 发送、失败回落已验证手机、前端区分邮箱 / 手机 / 回落提示 | 完成 |
| M7 | 改绑与撤销会话错误检查：邮箱 / 手机占用、改绑失败、撤销失败均明确提示 | 完成 |
| M8 | 改绑基座：`ChannelChangeRequest` 实体 + 仓储工具 + 6 位验证码哈希 + 过期 / 重放 / 尝试次数 | 完成 |
| M9 | 管理员发起改绑：邮箱 / 手机 + 必填原因；移除直接编辑与新密码输入；服务端禁止直接改绑 / 代设密码 | 完成 |
| M10 | 用户确认改绑：GET 只读 / POST 消费；生效后置已验证、撤销全部会话、置强制重置；旧通道通知 + 审计 | 完成 |
| M11 | 强制重置：会话创建拦截（403 `PASSWORD_RESET_REQUIRED`）、自动发码、重置成功清标记并撤销会话 | 完成 |
| M12 | 2FA / 备份码不受影响：流程前后状态断言 + 管理端无重置入口 + 「无人工路径」文案 | 完成 |
| M13 | 全量门禁、视觉回归、数据库迁移说明、收口与归档 | 完成 |

## 2. 终态指标

| 指标 | 收口值 | 对照（阶段 8） |
| :--- | :--- | :--- |
| 测试 | **1225 passed / 169 files** | 1154 / 155 |
| 覆盖率 | Statements **78.53%** / Branches 64.17% / Functions 72.80% / Lines **78.80%** | 78.39% / 63.45% / 72.58% / 78.75% |
| 视觉基线 | **136 passed**（未新增快照；改绑确认页进入 backlog） | 136 |
| 重复代码 | jscpd **3.53%**（5,140 / 145,448 行、341 clones，阈值 5%） | 3.57% |
| 包体 | 入口 CSS **404,107 B**（+1.09%，上限 +10%）；入口 JS 358,782 B；总 JS / CSS 2,536,872 B / 1,529,625 B | 415,165 B（阶段 8 口径） |
| 质量门 | `lint` / `lint:css` / `ai:check` / `quality:file-size` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget` / `test` / `test:coverage` / `lint:duplicate` / `lint:md:check` / `test:visual` 全绿 | 同左 |

## 3. 阶段级变更

- **审计**：新增 `server/utils/audit-log.ts`（事件模型 / 脱敏 / 请求元信息）与 `server/utils/audit-hooks.ts`（better-auth 生命周期接线）；`logger.audit.record` 写入独立 `audit-YYYY-MM-DD.log`，不记录密码、验证码、备份码明文。
- **改绑模型**：新增 `ChannelChangeRequest`（目标、码哈希、状态、尝试次数、发起人、原因、过期 / 确认时间）与 `User.mustResetPassword`；同一用户同一通道只保留一条 pending。
- **管理员边界**：`hooks.before` 拒绝 `/admin/set-user-password` 与 `/admin/update-user` 中的邮箱 / 手机字段；管理端只能走 `/api/admin/users/{id}/channel-change` 发起改绑，UI 移除邮箱 / 手机 / 新密码输入。
- **用户确认**：`/channel-change/[id]` 页面 + `GET` 只读 / `POST` 消费端点；确认后更新目标通道并置已验证、删除全部会话（含二级存储）、置强制重置，向旧通道通知并向新通道自动发送重置码。
- **登录拦截**：`databaseHooks.session.create.before` 只拦截 `mustResetPassword` 用户；重置页 / 找回页始终放行；`emailAndPassword.onPasswordReset` 清标记。
- **假通道修复**：短信重置接入 `sendPasswordResetOTP`；备份码再生成接入 `generateBackupCodes`；2FA 邮件 OTP 改为 `await` + 手机回落 + 投递结果回传前端；改邮箱 / 绑定手机增加占用检查与 `TARGET_TAKEN`。
- **运行时稳定性**：`lib/auth.ts` 改为延迟初始化（首次请求时创建实例），`server/database` 的顶层 `await` 不再与 Rollup 拼接顺序竞争；OIDC 发现端点改为请求期创建 metadata handler。
- **模块拆分**：`genericOAuth` 配置拆到 `lib/auth/generic-oauth.ts`；`pages/security.vue` 以 `useSecuritySettings()` 组合对象收口，二者均低于文件规模基线。

## 4. 与范围登记的偏差（均已登记理由）

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| 审计通道 | 复用 `logger` 的 audit 文件 | 保留 `logger.audit.record` API，独立 `audit-logger.ts` 直接写文件 | `logger.ts` 已达 600 行硬上限，继续内联会触发布局门禁；通道语义与不可抛错约束不变 |
| 手机旧通道通知 | 可投递时通知 | Twilio 支持自由文本；Spug 仅模板变量，记录 `sms-provider-does-not-support-notification` | 不为单一通知引入新供应商；已在 backlog 登记 Spug 通知模板候选 |
| 2FA 开关审计时机 | 2FA 开关事件 | `twoFactor.enable` 在 enable 端点成功（密钥 / 备份码签发）时记录；`twoFactor.disable` 在关闭成功时记录 | 上游无 2FA 表数据库钩子；验证 TOTP 与登录挑战共用端点，无法安全区分 |
| 改绑确认页视觉 | 受影响页面视觉通过 | 既有 136 张基线全绿；新页面未采自基线 | 新页需先补认证页矩阵（390 / 768 / 1024）口径；已登记 backlog |
| 管理员发起改绑原因 | 必填原因 | 前端与 Zod 双重校验（`min(2)`） | 与现有后台表单最低长度一致 |

## 5. 遗留与已知边界

- **恢复阶段 2–5**：恢复码 / 冷静期 / 已验证手机替代证明、2FA 覆盖收紧、审批流、审计表与管理端检索均未启动，候选见 [backlog §2.12](../plan/backlog.md)。
- **手机通知**：Spug 渠道无法发送自由文本，旧手机号通知在 Spug 部署下只写审计失败；Twilio 可用。
- **2FA 丢失**：同时丢失验证器与备份码时无人工路径（D4），文案与文档已明确，未提供隐式兜底。
- **确认页视觉**：新页面尚无像素基线，仅完成浏览器功能验证。
- **审计检索**：审计只落文件，管理端无检索 / 导出 UI；属阶段 5 候选。

## 6. 验证命令

```bash
pnpm lint && pnpm lint:css && pnpm ai:check && pnpm quality:file-size && \
pnpm migration:check-imports && pnpm i18n:check && pnpm typecheck && pnpm build && \
pnpm migration:check-budget && pnpm test && pnpm test:coverage && \
pnpm lint:duplicate && pnpm lint:md:check
pnpm test:visual   # 容器内，136 passed
```

运行时抽查（视觉夹具构建，`NODE_ENV=test`）：

| 路径 / 操作 | 结果 |
| :--- | :--- |
| `/login` | 200 |
| `POST /api/auth/sign-up/email` | 200（`must_reset_password` 列已加入夹具建表） |
| `POST /api/auth/sign-in/email` | 200 |
| `GET /channel-change/<id>` | 200 / 404（不存在） |
| `POST /channel-change/<id>` | 200（正确码）/ 400 / 409 / 410（错误 / 已消费 / 过期） |
