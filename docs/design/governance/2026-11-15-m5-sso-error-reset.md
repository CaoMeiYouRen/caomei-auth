# 2026-11-15 阶段 5 M5：SSO 登录、错误页与密码重置链接页

> **状态**：已完成（2026-11-15）—— 邮件链接重置按决策下线，`sso-login` 与错误页完成双语。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M5；[M4 记录](./2026-11-15-m4-auth-text.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4；[backlog §2.11](../plan/backlog.md)。

## 1. 决策：邮件链接重置下线

M5 原验收为「`/reset-password` 页面或移除邮件链接」，实施前先核对了现状：

| 通道 | 入口 | 端点 | 凭据 / 时效 | 页面 |
| :--- | :--- | :--- | :--- | :--- |
| 邮箱验证码 | `/forgot-password?mode=email` | `/email-otp/send-verification-otp` → `/email-otp/reset-password` | 6 位码 / 300 秒 / 3 次尝试 | 已上线 + 视觉基线 |
| 短信验证码 | `/forgot-password?mode=phone` | `/phone-number/request-password-reset` → `/phone-number/reset-password` | 6 位码 / 300 秒 / 3 次尝试 | 已上线 + 视觉基线 |
| 邮件链接 | **无 UI 入口** | `/request-password-reset` → `/reset-password/<token>` | 24 位 token / 3600 秒 / 一次性 | **不存在（404）** |

发现 4 处不一致：页面缺失、`sendResetPassword` 是死接线（UI 从不触发 `/request-password-reset`）、`docs/usage/user-management.md` 描述的是链接流程、客户端白名单用精确匹配（带 token 的路径即使有页面也会被拦）。

对比结论（安全 / 体验 / 工程）：链接方案凭据熵更高（62²⁴），但泄露窗口是验证码的 12 倍，且要补页面、白名单前缀语义、过期 / 无效态、视觉基线与两套邮件模板；验证码方案已有 captcha、限流与 3 次尝试，链路完整。**用户于 2026-11-15 确认「验证码已足够，先下线邮件链接」，未来需要时按 [backlog §2.11](../plan/backlog.md) 重启**。

## 2. 下线实现

| 文件 | 改动 |
| :--- | :--- |
| `lib/auth.ts` | 移除 `sendResetPassword` 回调（缺省时 better-auth 让 `/request-password-reset` 返回 `400 RESET_PASSWORD_DISABLED`）；删除 `/request-password-reset`、`/reset-password` 两条限流规则 |
| `server/utils/email/service.ts` | 删除 `sendPasswordResetEmail`（链接邮件模板，-38 行） |
| `tests/unit/server/utils/email/service.spec.ts` | 删除对应 2 例 |
| `utils/shared/public-paths.ts` | 移除 `/reset-password` |
| `i18n/config/locale-modules.ts` | `auth` 模块路由正则去掉 `reset-password` |
| 文档 | `usage/user-management.md` 邮箱流程改为验证码；`login-config/email-login.md` 链接模板改为下线说明；backlog §2.11 记录重启条件与实现要点 |

**行为验证**：`POST /api/auth/request-password-reset` → `400 {"code":"RESET_PASSWORD_DISABLED"}`；`/reset-password` 未登录访问 → `302` 到登录页（白名单移除后按普通受保护路径处理，不再 404）；`/forgot-password` 保持 `200`。

## 3. SSO 页与 flow 双语

- `i18n/locales/{zh-CN,en-US}/sso.json`：**33 键**（中英同构），覆盖页头、四组登录方式（标题 / 说明 / 字段 / 占位符 / 按钮）、提供商列表、常规登录链接与 7 条错误文案。
- 页面：全部文案改 `t('sso.*')`；删除失效的 `definePageMeta({ title })`（该键无消费者），改用 `usePageMeta('sso.title', 'sso.subtitle')`，SSR 标题实测 `SSO 单点登录 - 草梅 Auth` / `SSO sign-in - Caomei Auth`。
- flow：`use-sso-login-flow.ts` 改用 `useI18nText()`；`sso.errorSpecific` 用 `{name}` 插值；单测补 `use-i18n-text` 替身，断言仍针对真实中文。
- 占位符 `user{'@'}company.com` 按 vue-i18n 规则转义 `@`（否则 `valid-message-syntax` 报错）。

## 4. 错误页双语

- 文案放在 **`app` 模块**（core，`app` 前缀统一归属；`errors` 模块同样是 core，选择 `app` 是按前缀归属而非加载时机）：`app.error.status.{400,401,403,404,500}.{title,description}`、`app.error.status.unknown.{code,title,description}`、`app.error.page.{ariaLabel,leftSubtitle}`、`app.error.actions.{home,back}`，中英各 **17 键**。
- 新增 `utils/web/error-status.ts`：`ERROR_STATUS_CODES`、`ERROR_STATUS_MESSAGE_KEYS`（键名以字面量集中，便于 i18n 审计扫到完整键）、`resolveErrorStatusKey()` 与 `resolveErrorView()`（错误码 → 标题 / 描述 / 详情）；配套 11 例单测，含「未知状态码不让英文 `statusMessage` 进标题」「`error.data.message` 优先作为详情」与「映射到的键在 zh / en 语言包中都存在」。
- `error.vue` 改为 `t()` 驱动；`AuthLeft` 标题复用 `auth.left.defaultTitle`，副标题走 `app.error.page.leftSubtitle`。
- **标题 / 描述不再直出 `statusMessage`**：Nitro 的 `Page not found: /x` 是英文框架文案；已知状态码只显示本地化文案，未知状态码把 `statusMessage` 降级为「附加详情」，`error.data.message` 优先。

## 5. 门禁扩展

`error.vue` 此前不在任何扫描根内（`scripts/i18n/lib/{hardcoded-scan,locale-data}.mjs` 只列了 `app.vue`），所以它的中文既没被扫描、它引用的键还会被误判为未使用。本次把 `error.vue` 补进两处扫描根，未使用键从 17 回落到既有的 12 条动态键噪声。

## 6. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **397 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 1,296 → **1,250 行 / 95 文件** |
| `pnpm test` | **993 passed / 130 files**（新增 error-status 11 例；删除链接邮件 2 例） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 CSS 415,165 B（+3.86%）、入口 JS 388,268 B（主题插件把 `useColorMode` 从布局块提升到入口，总 JS 未增）、总 JS 2,195,464 B |
| `pnpm test:visual` | `admin.visual` 的 `error` 状态补暗色 2 张（首次采暗色即发现主题未初始化的真实缺陷）并重采浅色 2 张（描述由 Nitro 的英文 `Page not found: /x` 改为本地化文案，差异仅 1 行文字 2,849 px）；强制重采 `sso-login` 暗色 2 张（与 M4 同源的 token 漂移，逐像素核对 4 组颜色对、0 个越阈像素）；同页只保留一份基线（认证层不再重复登记 404）；verify **104 passed**（62 认证 + 40 Admin + 2 主题切换） |
| 浏览器（生产构建） | `/sso-login` 与 `/en-US/sso-login` 标题 / 副标题 / 按钮全部为对应语言，无键名直出；`/no-such-page` 与 `/en-US/no-such-page`（登录态）分别显示「页面未找到 (404)」「Page not found (404)」、中英按钮与 `aria-label`；未登录访问未知路径仍按既有中间件 302 到登录页 |

## 7. 已知边界

- **错误页的暗色缺陷由视觉矩阵发现并修复**：`error.vue` 不经过布局，`ThemeToggle` 不挂载，`useColorMode` 从未初始化，暗色用户会看到浅色错误页。新增 `plugins/app-theme.client.ts` 在应用级初始化主题，`admin.visual` 的 `error` 暗色基线现在会守住这条。
- `en-US` 的错误页 / SSO 视觉基线在 M17 统一补（本次错误页基线在 `admin.visual` 层，认证层不再重复登记）；`security` 的暗色基线仍带同源 token 漂移，留给 backlog「视觉基线对低于阈值的纯色漂移无感」。
- SSO 提供商的名称 / 域名 / issuer 来自数据库，不做翻译（属后台录入内容）。
- `error.data.message` 若由服务端写入中文，仍会直出；服务端错误面在 M16 统一。
- 邮件正文仍为中文（M15 处理 `User.locale` 与模板参数化）。
- 未登录访问未知路径是 302 到登录页而非 404，为既有中间件行为，本次不改。
