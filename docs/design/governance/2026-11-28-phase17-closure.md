# 2026-11-28 阶段 17 收口记录：认证配置与服务端校验正确性

> 范围与决策见 [阶段 17 范围登记](./2026-11-28-phase17-registration.md)；阶段正文见 [todo-archive-phases-17](../../plan/archive/todo-archive-phases-17.md)，里程碑见 [roadmap-phases-17](../../plan/archive/roadmap-phases-17.md)。

## 1. 交付清单

| 大条目 | 交付 | 提交 |
| :--- | :--- | :--- |
| M1 验证码插件注册与配置口径 | 挂载改由 `getCaptchaConfig() !== null` 决定（缺 secret 不再以 `captcha(null!)` 挂载）；配置矩阵单测（provider / secret / site key 四组合）；配置不一致告警去重并点名缺失项 | `bcb9a2e` |
| M2 自定义端点服务端验证码校验 | `verifyCaptchaToken`（三家 siteverify + recaptcha 分阈值 + 超时 / 网络异常归一，全部可注入 fetch）与 `requireCaptcha` 门禁；`change-email`、`two-factor/send-otp` 接入，缺 token → 400 `CAPTCHA_REQUIRED`、失败 → 400 `CAPTCHA_INVALID`、不可用 → 503 `CAPTCHA_UNAVAILABLE`；3 个 `errors.security.*` 键（5 语言 + 中文兜底） | `b640605` |
| M3 登录事件来源 IP 契约 | `normalizeClientIp` / `resolveClientIp`（XFF 首段、`[IPv6]`、端口、`%zone`、`net.isIP`、45 上限回落 `null`）；`requestAuditMeta` / `eventAuditMeta` 与登录事件仓储共用口径，仓储写入再兜一层 | `6a5fe2b` |
| M4.1 文档同步 | 安全规范 5.2 改为现行口径（挂载条件、成对配置、三种错误码与 fail closed）；`.env.example` 说明 site key 在启用时必填与两类部分配置后果 | `3a1bd08` |
| M4.2 阶段收口 | 归档分片、索引、roadmap 指针、收口记录 | 收口提交 |

## 2. 终态指标

- 测试：**1620** 用例通过（较阶段 16 的 1572 增加 48：captcha-config 8、captcha-verify 11、captcha-guard 5、security-endpoints 3 新增 + 既有断言、client-ip 22、audit-log 1、login-events 1）。
- 覆盖率：Statements 79.02%（+0.15）/ Branch 66.16%（+0.28）/ Functions 72.78%（+0.10）/ Lines 79.23%（+0.16）。
- 重复代码 3.71%（阈值 5%）；`quality:file-size` 0 错误；`build` 与 `docs:build` 通过。
- 视觉：**389** 用例通过（本阶段无 UI 改动，用于确认零回归，未新增基线）。
- i18n：`i18n:check` 通过（新增 3 键 × 5 语言 + 中文兜底表同批）；硬编码中文基线随 1 行服务端告警收紧。
- 安全：`ai:check` / `migration:check-imports` 通过；本阶段不涉及依赖升级。
- 提交：4 个条目提交 + 1 个收口提交。

## 3. Review Gate 轮次

- M1.1 / M1.2 R1 Pass：挂载决策抽成 `resolveCaptchaPlugins()` 后可脱离 better-auth 实例断言；确认 `null` 分支不再挂载、告警去重不刷屏。
- M2.1 / M2.2 / M2.3 R1 Pass：校验结果归一为 `skipped / passed / missing-token / invalid / unavailable`，端点只做错误码映射；被拒时不触达数据库与上游发送（断言 `findOne` / `sendTwoFactorOTP` / `consumeLatestTwoFactorDelivery` 未被调用）。
- M3.1 / M3.2 / M3.3 R1 Pass：先补边界矩阵再改写入路径；`requestAuditMeta` / `eventAuditMeta` / 仓储三层同口径，45 长度合法 IPv6（39 字符）保留、超长回落 `null`。
- M4.1 / M4.2 R1 Pass：规范不再保留「已知缺口」表述，`.env.example` 与代码判定一致，归档块 6 项字段齐全。

## 4. 偏差

- 计划 8–10 commits / 16–24 files；实际 5 个提交 / 20 个文件。M1、M2、M3 各 1 次提交（实现 + 单测同批），M4 拆 2 次（文档 / 收口）。
- M2 的 `requireCaptcha` 首版用 `getHeader(event, ...)`，在最小 event（无 `node.req`）上抛 `TypeError`，被既有 `self-service-channel-change` 用例捕获；改为直接读 `event.node?.req?.headers`，缺失即视为未携带（fail closed）。
- `captcha-config.ts` 的配置类型由上游联合类型收窄为项目支持的三种（`SupportedCaptchaConfig`），避免在调用点反复非空断言；仅在交给 `captcha()` 时做一次结构兼容断言。
- 硬编码中文基线更新同时移除 `composables/admin/use-user-management.ts` 的陈旧条目（该文件已无中文），属基线收紧而非新增豁免。

## 5. 已知残留

- 前端验证码判定仍是同步口径（provider + site key）：与服务端判定不一致时只靠启动告警，用户在「有 secret 缺 site key」时会被服务端拒绝且前端无提示；前端异步配置接口按 D63 不做，未另立 backlog 条目（如需重新评估，应先确认是否有真实的「只配 secret 不配 site key」部署）。
- provider 连通性只在单测中以 mock fetch 覆盖，未做真实 reCAPTCHA / Turnstile / hCaptcha 端到端联调（需要真实密钥，属真机 / 外部验证项）。
- IP 归一化不含可信代理白名单：任一调用方传入的 `x-forwarded-for` 首段都会被采信，仅在部署侧保证代理覆盖（与阶段 13 的条目口径一致）。
- Redis 限流存储、PKCE 可配置化、`braces` 升级仍在 [backlog](../../plan/backlog.md)。
