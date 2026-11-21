# 阶段 10 里程碑：用户侧替代证明（2026-11-21 收口）

> 索引与阶段正文见 [todo-archive-phases-10.md](./todo-archive-phases-10.md)；范围登记见 [2026-11-21-phase10-registration.md](../../design/governance/2026-11-21-phase10-registration.md)。

- **目标**：旧邮箱失效但持有恢复因子的用户可自助更换已验证邮箱（密码 + 第二因子，冷静期可撤销）；OAuth-only 用户可受控自助设置密码；无恢复因子仍明确拒绝并引导人工。
- **交付**：
    - 恢复码基座（独立于 2FA 备份码）：`RecoveryCode` 实体、批量签发 / 列表 / 删除 / 消费、新鲜会话 + 第二因子重签、80 bit 熵与 sha256 哈希。
    - 替代证明与改邮箱：请求模型扩展（`source` / `scheduledAt` / `cancelledAt` / `proofFactor`）、`resolveRequestState` 单一状态函数、`verifyRecoveryProof` / `consumeProofFactor`（因子集合按用途强制）、`/api/security/email/change-with-proof`（申请 / 归属确认 / 状态 / 撤销）、受控证明短信 OTP。
    - 冷静期与生效：单事务到期生效（状态推进 + 邮箱覆写 + 会话撤销 + 审计）、登录与会话读路径惰性生效、双通道通知与撤销。
    - 自助设置密码：`/api/security/password/self-service`（新鲜会话 + 第二因子，手机 OTP 明确排除）。
    - 界面：安全页恢复码面板、换邮箱弹窗、冷静期倒计时卡、5 语文案、组件 / 组合式 / 集成测试与视觉基线。
    - 治理：`security.md` §1.3 口径回填、`AUDIT_ACTIONS` 扩展、`check-planning-docs` 机检脚本和 CI 接线、首个 todo 归档分片。
- **关键决策**：D1 保留旧邮箱确认并允许替代证明；D2 恢复码与备份码分离；D3 手机 OTP 仅用于改邮箱 / 关 2FA；D5 冷静期默认 24h、上限 72h；D6 社交账号不作恢复因子；D7 生效即旧邮箱失效；D10 OAuth-only 自助设密码；D4 / D8 / D9 沿用阶段 9（不重置 2FA、不代设密码）。
- **质量门**：lint / stylelint / typecheck / 全量测试 / i18n / markdown / 规划机检全绿；Review Gate M1–M5 均 Pass。
- **未覆盖边界**：真实 Redis / MySQL / PostgreSQL 的缓存与并发、多实例限流、供应商投递实测、无调度导致的冷静期漂移、pending 冷静期视觉夹具。
