# 2026-11-16 阶段 5 收口记录：i18n 全量落地与体验收口

> **状态**：已完成（2026-11-16）。M1–M19 全部交付，阶段 5 收口。
> **范围与验收**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 / §6；逐批记录见 [M1](./2026-11-15-m1-caomei-ui-1.3.0.md)–[M18](./2026-11-16-m18-seo.md)。

## 1. 交付总览

| 编号 | 条目 | 结果 |
| :--- | :--- | :--- |
| M1 | caomei-ui 1.3.0 与内建文案 locale 桥接 | 完成（2026-11-15） |
| M2 | 消息模块化与按需加载 | 完成（2026-11-15） |
| M3 | 治理门禁与既有缺陷 | 完成（2026-11-15） |
| M4 | 认证入口文案 | 完成（2026-11-15） |
| M5 | SSO 登录、错误页与重置通道 | 完成（2026-11-15） |
| M6 | 个人中心文案 | 完成（2026-11-15） |
| M7 | 安全设置文案 | 完成（2026-11-15） |
| M8 | OAuth 与授权应用文案 | 完成（2026-11-15） |
| M9 | 首页、静态页与共享壳文案 | 完成（2026-11-15） |
| M10 | 个人中心 ↔ 授权应用 / 安全设置互联 | 完成（2026-11-15） |
| M11 | Admin 用户域文案 | 完成（2026-11-15） |
| M12 | Admin OAuth 域文案 | 完成（2026-11-15） |
| M13 | Admin SSO 域文案 | 完成（2026-11-15） |
| M14 | Admin 日志域文案 | 完成（2026-11-15） |
| M15 | 邮件模板与 `User.locale` | 完成（2026-11-16） |
| M16 | API 错误面与内容协商 | 完成（2026-11-16） |
| M17 | 治理清理与双语回归 | 完成（2026-11-16） |
| M18 | SEO 与 `en-US` 升 `seo-ready` | 完成（2026-11-16） |
| M19 | 阶段收口与归档 | 完成（2026-11-16） |

## 2. 终态指标

| 指标 | 收口值 |
| :--- | :--- |
| 语言包键 | **1467 键**（zh-CN / en-US 同构，18 个模块） |
| 未使用键 | **0**（16 个动态拼接键在审计脚本登记来源） |
| 硬编码中文基线 | **132 行 / 24 文件**（阶段 5 起点 1,390 行 / 107 文件） |
| 测试 | **1036 passed / 138 files** |
| 覆盖率 | Statements 76.78% / Branches 60.04% / Functions 68.89% / Lines 76.92% |
| 视觉基线 | **110 passed**（104 zh + 6 en-US 核心页） |
| 包体 | 入口 JS **339,087 B**、总 JS **2,289,799 B**、入口 CSS 415,165 B（+3.86%，上限 +10%） |
| 语言就绪度 | `zh-CN` / `en-US` 均为 `seo-ready` + `indexable` |
| 质量门 | `lint` 0 error、`lint:css`、`typecheck`、`test`、`test:visual`、`i18n:check`、`lint:md`、`ai:check`、`migration:check-budget` 全绿 |

## 3. 阶段级变更

- **页面文案**：18 个页面 + `components/**` + `composables/**` 的用户可见文案全部走语言包；`common.status.*`、`app.admin.nav.*`、`app.theme.*` 覆盖共享壳层。
- **邮件与偏好**：`User.locale` 列 + `additionalFields`（`z.enum` 校验）、7 个邮件方法与 6 个模板双语、请求 / 偏好 / 默认三级优先级、旧用户惰性回填、三方言建表脚本与生产 ALTER 说明。
- **API 错误面**：全部 `/api/**` 返回 `Content-Language` / `Vary`；`createError` 中文清零；管理端 / 上传 / Demo 守卫 / 社交登录展示名按请求语言输出；静态守卫防回退。
- **SEO**：sitemap / robots / hreflang / canonical / `og:locale`、运行时 origin 重写、私有页 `noindex`，`en-US` 放开索引。
- **治理**：模块注册表 18 个、路由懒加载、`insert` 门禁（`i18n:check` / `lint:i18n` / `test:i18n`）、动态拼接键白名单、API 错误面静态守卫。

## 4. 与范围登记的偏差（均已登记理由）

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| 邮件方法数量 | 8 个 | **7 个** | `emailService` 只有 7 个公开方法；`sendEmail` 为传输层，不计入 |
| sitemap 依赖 | 待核验 `@nuxtjs/sitemap` | **自建 `/sitemap.xml` 路由** | 静态公开页 + 双语言 alternates 无需新增依赖，且可精确按 Registry 放量 |
| Demo 假数据 | 生成器接受 locale | **仅 zh-CN** | Demo 数据无请求上下文、启动时一次写入；按风险缓解条款登记为已知边界 |
| `errors.admin.*` 模块归属 | `server-only` 模块 | **`errors` 模块** | 键体量小、与既有 `errors.*` 同域；`server-only` 保留给纯服务端长文案 |
| 视觉矩阵 | 核心页 `en-US` 基线 | **6 张（3 页 × 浅 / 暗桌面）** | Admin 数据随用例顺序变化，英文渲染由浏览器抽检；避免矩阵翻倍 |

## 5. 遗留与后续

- **backlog 新增**（M15 / M16 引入）：Admin API 错误文案读取链路、Admin OAuth 接口 200 + body status、Admin 校验统一 Zod error map。
- **既有 backlog 保留**：视觉中间宽度（768 / 1024）、移动端安全页会话表、2FA / captcha / Toast 视觉覆盖、max-lines 基线、jscpd、DataTable 能力、邮件模板中文注释等。
- **运维动作**：生产库升级前需执行 `caomei_auth_user.locale` 的 `ALTER TABLE`（见 [数据库部署文档](../../deployment/database.md#用户语言偏好列-userlocale2026-11-16)）；部署域名需正确传 `Host`（或显式配置 `NUXT_PUBLIC_AUTH_BASE_URL`）以保证 SEO origin，h3 默认不读取 `X-Forwarded-Host`。
- **未做**：外站站长平台验证、第三语言与 RTL、日志正文与内部错误翻译。

## 6. 验证命令

```bash
pnpm i18n:check && pnpm lint && pnpm lint:css && pnpm typecheck && \
pnpm test && pnpm build && pnpm migration:check-budget && \
pnpm test:visual && pnpm lint:md && pnpm ai:check
```
