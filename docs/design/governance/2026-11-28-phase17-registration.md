# 2026-11-28 阶段 17 范围登记：认证配置与服务端校验正确性

> **状态**：2026-11-28 登记并开工，2026-11-28 收口（见 [阶段 17 收口记录](./2026-11-28-phase17-closure.md)）。依据：[backlog 优先级视图](../../plan/backlog.md#0-优先级评分视图当前期)中「验证码服务端校验与插件注册条件」（重要 4 / 紧急 4 · 首排）与「登录事件 IP 写入契约」（重要 4 / 紧急 3 · 排期），[安全开发规范 5.2](../../standards/security.md) 的已知缺口条目，阶段 16 收口后的维护者评审（2026-11-28）。
> **阶段编号**：取已用最大编号（16）+ 1 = **17**。
> **规划模型**：4 大条目 / 10 小条目（[规划规范](../../standards/planning.md) §4）：大条目 4 条落在 3–8 区间；小条目 10 条达到建议下限。

## 1. 目标

- 修正验证码插件的注册条件：由「前端判定」改为「服务端配置可用」，消除「有 provider、缺 secret」时插件以非空断言注册、请求期读 `null` 报 500 的故障形态。
- 让自定义包装端点 `POST /api/security/change-email` 与 `POST /api/security/two-factor/send-otp` 的 `x-captcha-response` 由服务端校验，使验证码不再是「仅前端门禁」。
- 修正登录事件与审计日志的来源 IP 写入契约：剥离端口 / 方括号 / zone index，非法值回落 `null`，与 `varchar(45)` 列和三方言（SQLite / MySQL / PostgreSQL）保持一致。
- 把上述三条的配置口径、错误码与运维检查项写进安全规范与 API 文档，避免口径散落。

## 2. 决策记录（拟定，2026-11-28）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D59 | 验证码插件注册条件 | `lib/auth.ts` 改按 `getCaptchaConfig() !== null` 挂载插件；`provider` 或密钥缺失一律视为「未启用」，不再使用 `isCaptchaEnabled()` + 非空断言 | `isCaptchaEnabled()` 只看 provider + siteKey，缺 secret 时 `getCaptchaConfig()` 返回 null，`captcha(null!)` 在请求期抛 `Cannot read properties of null` → 500 |
| D60 | 自定义端点服务端校验 | `change-email` / `two-factor/send-otp` 在启用验证码时读取 `x-captcha-response` 并调用 provider 校验：缺 token → `400 CAPTCHA_REQUIRED`；校验失败 → `400 CAPTCHA_INVALID` | 两个端点不在 better-auth 插件 `endpoints` 内；前端已发送该头（`edit-email-dialog.vue` / `utils/web/otp-service.ts`），无需改前端契约 |
| D61 | 校验不可用时的降级 | provider 网络失败 / 超时 → `503 CAPTCHA_UNAVAILABLE`（fail closed）+ warn 日志；不静默放行 | 验证码是防滥用能力，静默放行等于关闭；两条端点已有 3 次/分钟限流作为兜底 |
| D62 | IP 归一化口径 | 取 `x-forwarded-for` 首段 → 去 `[]`、去端口、去 `%zone` → `net.isIP()` 校验 → 合法则原样（IPv6 压缩形态）写入，非法或长度 >45 回落 `null` | 三个方言对超长 / 带端口值行为分叉：MySQL 严格模式与 PostgreSQL 会整行拒绝，SQLite 照存；截断会伪造 IP 前缀，故回落 `null` |
| D63 | 本阶段不做 | 不做前端验证码判定重构（异步配置接口）、不接 Redis 限流存储、不做 PKCE 可配置化、不升级 `braces`、不做 Admin 数据表卡片化 | 保持阶段聚焦「配置正确性 + 服务端校验」；前端与服务端在部分配置下的显示差异以「服务端权威 + 启动告警」收敛，前端异步改造另立候选 |

## 3. 现状取证（2026-11-28）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 插件注册 | `lib/auth.ts:564` 使用 `isCaptchaEnabled() ? [captcha(getCaptchaConfig()!)] : []`；`isCaptchaEnabled()`（`utils/web/captcha.ts:14`）只看 provider + siteKey | 缺 `*_SECRET_KEY` 时 `getCaptchaConfig()` 返回 `null`，插件仍挂载 → 请求期 500 |
| 自定义端点 | `server/api/security/change-email.post.ts`、`two-factor/send-otp.post.ts` 只做 `rateLimit` + body 校验，未读取 `x-captcha-response` | 前端已发送该头，服务端丢弃 |
| 错误码 | 现有 `errors.*` 无验证码相关键 | `i18n/locales/*/errors.json` |
| IP 写入 | `server/utils/audit-log.ts:152-171` 直接取 XFF 首段 / `x-real-ip` 原值；`requestAuditMeta` 被登录事件插件与审计钩子共用 | 超长 / 带端口值在 MySQL / PG 会被拒；实体列 `varchar(45)` |
| 现有测试 | `tests/unit/server/api/security-endpoints.spec.ts` 覆盖两个包装端点；`tests/unit/server/captcha-config.spec.ts` 覆盖配置解析 | 便于按既有 mock 形态补断言 |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | 验证码插件注册与配置口径 | 2 | 按配置可用性挂载、配置矩阵与不一致告警 |
| M2 | 自定义端点服务端验证码校验 | 3 | 统一校验工具、两个包装端点接入与错误码 |
| M3 | 登录事件来源 IP 契约 | 3 | 归一化工具、写入路径接入、三方言与边界断言 |
| M4 | 文档与阶段收口 | 2 | 安全 / API / 环境变量文档同步、阶段收口归档 |

条目明细（8 要素与 4 项字段）见 [todo.md](../../plan/todo.md)。

## 5. 容量基线

- **commits 8–10 / files 16–24 / 行 500–800**（小条目默认各 1 次提交，收口提交另计）。
- 小条目 10 条，每条 ≤10 文件 / 800 行；超出即拆。

## 6. 执行顺序

M1 → M2 → M3 → M4。

M1 先收敛插件挂载，保证「未配置」不再 500；M2 依赖 M1 的「是否启用」单一判定；M3 与 M1/M2 无依赖，可顺次落地；M4 收口。

## 7. 不做什么

- 不做前端验证码判定重构（不新增异步配置接口、不改 `utils/web/captcha.ts` 的同步契约）。
- 不接 Redis 作为限流 / 验证码存储。
- 不做 PKCE 可配置化、`braces` 依赖升级、管理端数据表卡片化。
- 不改认证流程、鉴权语义、OAuth / SSO 协议行为。
- 不改 `.env`；只更新 `.env.example` 与文档。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| provider 校验接口不可达导致发送类端点不可用 | fail closed + 503 明确错误码，前端提示稍后重试；已有 3 次/分钟限流兜底；单测覆盖超时与网络异常分支 |
| 前端仍在「siteKey 有、secret 无」时显示验证码，服务端视为未启用 | 启动时 warn 一次性提示配置不完整；安全规范写入口径（服务端权威）；前端异步改造登记 backlog，不在本阶段做 |
| IP 归一化改动影响既有审计断言 | 先补 `net.isIP` 边界用例再改写入路径；`requestAuditMeta` 与 `eventAuditMeta` 共用同一工具，避免两套口径 |
| 新增错误码需要 5 语言键与台账 | 键加在 `errors.security.*`，模块已在 provenance `reviewedModules` 内；`i18n:check` 同批复跑 |
