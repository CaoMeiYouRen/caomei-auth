# 阶段 17 里程碑：认证配置与服务端校验正确性（2026-11-28 收口）

> 索引与阶段正文见 [todo-archive-phases-17.md](./todo-archive-phases-17.md)；范围登记见 [2026-11-28-phase17-registration.md](../../design/governance/2026-11-28-phase17-registration.md)，收口记录见 [2026-11-28-phase17-closure.md](../../design/governance/2026-11-28-phase17-closure.md)。

- **目标**：修正验证码插件注册条件（缺 secret 时 500）、让两个自定义包装端点真正校验 `x-captcha-response`、把登录事件与审计日志的来源 IP 收敛到三方言一致，并把口径写进规范。
- **交付**：
    - 验证码注册：挂载只由 `getCaptchaConfig()` 决定，`null` 即不挂载；四组配置矩阵单测；「有 secret 缺 site key」「缺 secret」两类不一致在进程内只告警一次并点名缺失项。
    - 端点校验：新增 `verifyCaptchaToken`（三家 siteverify、recaptcha 分阈值、超时与网络异常归一）与 `requireCaptcha` 门禁；两个端点在缺 token / 校验失败 / provider 不可用时分别返回 400 `CAPTCHA_REQUIRED`、400 `CAPTCHA_INVALID`、503 `CAPTCHA_UNAVAILABLE`（fail closed），被拒时不触达数据库与上游发送。
    - 来源 IP：新增 `normalizeClientIp` / `resolveClientIp`，剥离端口 / 方括号 / zone index 并做 `net.isIP` 校验，非法或 >45 回落 `null`；审计元数据与登录事件仓储共用口径，仓储再兜一层。
    - 文档：安全规范 5.2 与 `.env.example` 同步为现行口径，新增 3 个 `errors.security.*` 键（5 语言 + 中文兜底）。
- **关键决策**：D59 挂载按配置可用性；D60 自定义端点服务端校验与错误码；D61 provider 不可用 fail closed；D62 IP 归一化口径；D63 本阶段不做边界。
- **质量门**：单测 1620（新增 48），覆盖率 Statements 79.02% / Branch 66.16% / Functions 72.78% / Lines 79.23%；重复代码 3.71%；构建与文档站通过，视觉 389 用例零回归。
- **未覆盖边界**：前端验证码判定仍为同步口径（差异靠启动告警收敛）；provider 连通性只以 mock fetch 覆盖；IP 归一化不含可信代理白名单；Redis 限流与 PKCE 可配置化仍在 backlog。
