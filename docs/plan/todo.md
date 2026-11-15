# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)，未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**阶段 5「i18n 全量落地与体验收口」进行中（2026-11-14 授权）：M1–M16 已完成（2026-11-16），M17–M19 pending。** 范围、口径与验收见 [阶段 5 范围登记](../design/governance/2026-11-14-phase5-registration.md)，已交付条目见 [M1](../design/governance/2026-11-15-m1-caomei-ui-1.3.0.md) / [M2](../design/governance/2026-11-15-m2-locale-modules.md) / [M3](../design/governance/2026-11-15-m3-governance-gates.md) / [M4](../design/governance/2026-11-15-m4-auth-text.md) / [M5](../design/governance/2026-11-15-m5-sso-error-reset.md) / [M6](../design/governance/2026-11-15-m6-profile-text.md) / [M7](../design/governance/2026-11-15-m7-security-text.md) / [M8](../design/governance/2026-11-15-m8-oauth-text.md) / [M9](../design/governance/2026-11-15-m9-static-text.md) / [M10](../design/governance/2026-11-15-m10-cross-links.md) / [M11](../design/governance/2026-11-15-m11-admin-users-text.md) / [M12](../design/governance/2026-11-15-m12-admin-oauth-text.md) / [M13](../design/governance/2026-11-15-m13-admin-sso-text.md) / [M14](../design/governance/2026-11-15-m14-admin-logs-text.md) / [M15](../design/governance/2026-11-16-m15-email-locale.md) / [M16](../design/governance/2026-11-16-m16-api-errors.md) 记录；阶段 4 已于 2026-11-14 收口，见 [阶段 4 收口记录](../design/governance/2026-11-14-phase4-closure.md)。

## 阶段 5 原子条目

> 共 19 条；完成态以批次 Review Gate 结论为准，不在实施前预写。单条超过 10 文件 / 800 行时按模块或对话框拆条。

| 编号 | 条目 | 验收要点 | 状态 |
| :--- | :--- | :--- | :--- |
| M1 | 基座对齐：caomei-ui 1.3.0 与内建文案 locale 桥接 | 英文下组件内建文案为英文；受影响视觉基线重采；`test` / `test:visual` 全绿 | 已完成（2026-11-15） |
| M2 | 消息模块化与按需加载 | `locale-modules` / `locale-runtime-loader`；17 模块拆分；core 首屏 + 路由懒加载；loader 单测 | 已完成（2026-11-15） |
| M3 | 治理门禁与既有缺陷 | 扫描覆盖 `<script setup>`；`lint:i18n` / `test:i18n` 接入；Admin `validation.*` 直显修复；`usePageMeta` / `app.head` 接入 | 已完成（2026-11-15） |
| M4 | 认证入口文案 | 5 个认证页 + 共享组件 + 5 个 flow composable + `auth` 模块双语 | 已完成（2026-11-15） |
| M5 | SSO 登录、错误页与密码重置链接页 | SSO / 错误页双语；邮件链接通道下线（决策：统一验证码，backlog §2.11）；白名单 / 限流 / 语言模块规则同步 | 已完成（2026-11-15） |
| M6 | 个人中心文案 | `profile` 页 + 9 个组件 + flow 双语；编辑类对话框完整 | 已完成（2026-11-15） |
| M7 | 安全设置文案 | 2FA / 会话 / 密码区双语；动态列按 locale 格式化 | 已完成（2026-11-15） |
| M8 | OAuth 与授权应用文案 | 同意页 + 授权列表 + 2 个 composable 双语 | 已完成（2026-11-15） |
| M9 | 首页、静态页与共享壳文案 | 首页 / about / privacy / terms + 页脚 / 反馈 / Demo 横幅 + `demo` 模块 | 已完成（2026-11-15） |
| M10 | §2.10 个人中心 ↔ 授权应用 / 安全设置互联跳转 | 三个子页一步到达 / 返回；移动端一致；交互态视觉基线 | 已完成（2026-11-15） |
| M11 | Admin 用户域文案 | 页面 + 4 个对话框 + 2 个 composable 双语 | 已完成（2026-11-15） |
| M12 | Admin OAuth 域文案 | 页面 + 3 个对话框双语 | 已完成（2026-11-15） |
| M13 | Admin SSO 域文案 | 页面 + 5 个组件双语 | 已完成（2026-11-15） |
| M14 | Admin 日志域文案 | 页面 + 6 个组件双语 | 已完成（2026-11-15） |
| M15 | 邮件模板与用户语言偏好 | `User.locale`；7 个邮件方法 + 6 个 MJML 参数化；同步 / 异步语言优先级 | 已完成（2026-11-16） |
| M16 | API 错误面与内容协商 | `createError` 中文清零；`Content-Language` / `Vary` 扩展；双语言测试 | 已完成（2026-11-16） |
| M17 | 治理清理与双语回归 | 未用 / 重复键清理；allowlist 收紧；核心页 `en-US` 视觉基线 | pending |
| M18 | SEO 与 `en-US` 升 `seo-ready` | sitemap / robots / hreflang / canonical / `og:locale`；就绪度升级 | pending |
| M19 | 阶段收口与归档 | 包体 / 视觉 / 覆盖率复核；文档同步；收口记录与归档 | pending |

> **检查点**：M14 完成后复核剩余工作量；如需拆分阶段，由用户决策，不自行降级。
