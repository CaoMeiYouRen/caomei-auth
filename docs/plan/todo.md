# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)，未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前进行中阶段：阶段 3「caomei-ui P2–P3 迁移与 i18n 非组件面」**（2026-11-06 用户选择方向 A，并补充「可以先处理组件之外的国际化」）。

- 范围与验收口径的单一事实源：[阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)
- 构成：**6 条主线 / 16 条原子条目**（迁移准备 3 / P2 试点 2 / 认证入口 3 / 个人与安全 4 / i18n 非组件面 3 / 收口 1）
- 边界：**只做 P2–P3 页面替换与非组件 i18n**，不翻译页面文案、不做 P4 Admin、不卸载 PrimeVue、不做体验与性能项。

## 阶段 3 原子条目

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M1-1 | 用量快照复测、白名单与包体基线复核（含 1.0.0 → 1.2.0 升级验证） | `pnpm migration:usage` 快照、`CAOMEI_UI_ROUTE_PREFIXES`、`keyCss` / 总 JS（固定 chunk 白名单）基线 | 进行中（2026-11-08 已升级 1.2.0，typecheck / build 通过；待用量快照与白名单复核） |
| M1-2 | P2 视觉基线采集与差异清单（`/login`） | 浅色 / 暗色 × 桌面 / 移动 × 默认 / 校验错误 / 2FA / 验证码；差异清单 | 待开始 |
| M1-3 | DatePicker range 与 Toast 语气样式决策裁定 | 回写迁移评估 §6.3 / §7.3；更新 §12 上收条件 | 已完成（2026-11-08 按 1.2.0 修订：range 直接迁移；Toast token 映射） |
| M2-1 | 登录页整页迁移 + login 专用 V2 薄封装 | `pages/login.vue`、按需 V2 封装、白名单 `/login` | 待开始 |
| M2-2 | 试点回归与白名单登记 | 测试 mock 改写、视觉差异归因、SSR / hydration、定向测试 | 待开始 |
| M3-1 | 注册页迁移 | `pages/register.vue` 及消费者封装 | 待开始 |
| M3-2 | 忘记密码 / 重置密码 / 修改密码迁移 | `forgot-password.vue`、`change-password.vue` 及相关组件 | 待开始 |
| M3-3 | 快速登录迁移与认证页 Toast / Confirm 切换 | `quick-login.vue`、认证相关 `useToast` / `useConfirm` 显式 import | 待开始 |
| M4-1 | 个人资料页迁移 | `pages/profile.vue` 及消费者封装 | 待开始 |
| M4-2 | 安全设置页迁移（2FA / 会话 / 账号绑定） | `pages/security.vue`；超阈值时按 2FA、会话、绑定拆条 | 待开始 |
| M4-3 | OAuth 同意页迁移 | `pages/oauth/consent.vue`（`oauth/clients` 仍在 P4） | 待开始 |
| M4-4 | SSO 登录页迁移 | `pages/sso-login.vue` | 待开始 |
| M5-1 | Zod 错误本地化前置 | 移除 74 处（评估口径）schema 级中文 `message`；补齐 `validation.*` 全量键（`zh-CN` / `en-US` 同构） | 待开始 |
| M5-2 | i18n 治理脚本与门禁 | `scripts/i18n/audit-*.mjs`、`i18n:audit:*`、`i18n:check-*`、CI 与 `lint-staged` 接入 | 待开始 |
| M5-3 | 服务端错误消息接入（认证类试点） | `errors.*` 键、`useTranslation(event)`、`Content-Language` / `Vary`；不可用时回退并登记 | 待开始 |
| M6-1 | 批次收口与质量门 | 白名单、包体复测、迁移记录、文档同步、回退验证 | 待开始 |

## 说明

- 阶段 3 的验收、依赖与风险以 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md) 为准；本表只登记状态，不重复条款。
- 每个迁移路由整页切换、独立提交、独立回滚；未登记路由继续使用 PrimeVue。
- 完成态不得早于 Review Gate 结论；未完成事项的登记口径见 [规划规范 §5](../standards/planning.md#5-状态同步)。
- 阶段收口时按 [规划规范](../standards/planning.md) 归档到 [已完成工作归档](../archive/completed-work.md)。
