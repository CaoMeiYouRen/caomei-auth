# 阶段 11 里程碑：2FA 覆盖收紧与登录通道闭环（2026-11-21 收口）

> 索引与阶段正文见 [todo-archive-phases-11.md](./todo-archive-phases-11.md)；范围登记见 [2026-11-21-phase11-registration.md](../../design/governance/2026-11-21-phase11-registration.md)，收口记录见 [2026-11-21-phase11-closure.md](../../design/governance/2026-11-21-phase11-closure.md)。

- **目标**：开启 2FA 的用户经邮箱 / 手机 OTP、邮箱验证码 / 链接自动登录、魔法链接、社交（内置 / genericOAuth / `idToken`）与 SSO（OIDC 共享 / 专属回调、SAML ACS）登录时同样要求第二因子；复用上游挑战、提供逐通道开关与回退。
- **交付**：
    - 挑战基座：会话入口矩阵、上游 two-factor after-hook 复用（`{ ...ctx, returnHeaders: true }` + Set-Cookie 复制）、`TWO_FACTOR_COVERAGE_*` 六通道开关。
    - 通道接入：邮箱 / 手机 OTP、邮箱验证码 / 链接、魔法链接、内置 / genericOAuth 社交回调与 `idToken`、SSO OIDC 专属 / 共享回调、SAML ACS。
    - 登录页：`/login?twoFactor=1&channel=&redirect=` 自动打开 2FA 弹窗、通道提示、站内回跳、取消重试、URL 参数清理；弹窗抽为 `components/auth/two-factor-dialog.vue`。
    - 恢复与审计：TOTP / 备份码 / 邮件 OTP / 信任设备回归（含过期与撤销），`twoFactor.challenge` / `twoFactor.verify` 审计（含 `trustDevice`），错误提示区分因子 / 会话 / 通道。
    - 测试与视觉：195 文件 / 1370 用例；6 张 2FA 弹窗基线（1440 / 768 / 390 × 浅 / 暗），全量视觉 144 passed。
    - 治理：`security.md` §1.3 覆盖口径、覆盖矩阵、`.env.example` 开关、5 语文案与错误键。
- **关键决策**：D11 覆盖范围；D12 逐通道默认开启；D13 JSON / 302 双响应形态；D14 既有会话不回溯；D15 关闭 2FA 维持仅密码；D16 SSO 单一开关；D17 授权链只回归。
- **质量门**：`lint` / `lint:css` / `typecheck` / `test` / `i18n:check` / `lint:md:check` / `planning:check` / `quality:file-size` / `lint:duplicate` / `test:visual` 全绿；Review Gate R1 Reject → R2 Reject → R3 Reject → R4 Reject → R5 Pass。
- **未覆盖边界**：OAuth provider authorize / consent 的 state 回跳（M3.3 迁 backlog）、2FA 用户会话撤销脚本（迁 backlog）、真实社交 / 企业 IdP 回调、多实例限流、既有会话不回溯（D14）。
