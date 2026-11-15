# 2026-11-16 阶段 5 M15：邮件模板与用户语言偏好

> **状态**：已完成（2026-11-16）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M15 / §5.4；[M14 记录](./2026-11-15-m14-admin-logs-text.md)。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 数据 | `server/entities/user.ts` | 新增 `locale varchar(16) nullable` |
| 认证配置 | `lib/auth.ts` | `user.additionalFields.locale`（可写、非必填、默认 `null`）；6 个邮件回调透传 `request` |
| 前端 | `components/base/language-switcher.vue` | 切换语言后写回账户偏好（未登录失败即忽略） |
| 服务端 | `server/utils/email/i18n.ts` | 邮件翻译器（不依赖 H3 event）+ `Request` 到 locale 的解析 + 优先级 `resolveEmailLocale` |
| 服务端 | `server/utils/email/user-locale.ts` | 按邮箱读用户偏好（动态导入避免初始化循环），`resolveEmailLocaleWithBackfill` 统一优先级与惰性回填 |
| 服务端 | `server/utils/email/service.ts` | 7 个公开方法接 `locale` / `request`，全部文案走 `email.*` 键 |
| 服务端 | `server/utils/email/templates.ts` | 基础模板 chrome 与代码模板时长提示参数化；缺值渲染为空串 |
| 模板 | `server/templates/base-template.mjml`、`fragments/*.mjml` | 页脚标签 / 版权 / 提示标题改为变量，模板内不再有中文 |
| 模板 | `server/utils/email/templates-fallback.ts` | 回退模板同样参数化，回退 HTML 使用 `safeData` 变量 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/email.json` | **58 键**：chrome 18 + 7 组业务文案（verification / loginOtp / emailVerificationOtp / passwordResetOtp / magicLink / emailChange / securityNotification） |
| 建表脚本 | `database/{sqlite,mysql,postgres}/create.sql` | `caomei_auth_user.locale` 三方言同步 |
| 部署文档 | `docs/deployment/database.md` | 生产库 `ALTER TABLE` 升级说明（三方言） |

全量 **1406 键**。

## 2. 实现要点

- **语言优先级**（范围登记 §5.4）：请求语言 > 数据库用户偏好 > 默认 `zh-CN`；显式传入的 `locale` 仅用于调用方已确定语言的场景。认证回调只传 `request`，因此同一请求下的验证邮件、魔法链接与 OTP 语言一致。
- **旧用户惰性回填**：解析出请求语言且库内偏好为空时，异步写回 `User.locale`（失败只记日志，不阻塞邮件）。
- **请求语言解析**：better-auth 回调只给 `Request`，按 query `locale` → `i18n_locale` / `locale` / `language` / `lang` cookie → `Accept-Language` 顺序匹配；`Accept-Language` 按 q 值取首个受支持语言（`fr-FR,en-US;q=0.9` → `en-US`），与 `tryHeaderLocale` 的协商口径一致；畸形 Cookie 的百分号编码不抛错。新增 `RequestLike` 最小接口，便于单测构造 Cookie 头（happy-dom 的 `Request` 会丢弃 Cookie）。
- **翻译器**：`getEmailTranslator(locale)` 直接读 `email.json` 的 zh / en 副本，缺键或空值回退 zh 再回退键名；不依赖 `useTranslation(event)`，异步邮件无需请求上下文。
- **模板参数化**：`base-template.mjml`、5 个片段、回退模板中的静态中文全部换成变量，模板文件本身不再含中文；`renderTemplate` 对缺值输出空串（并告警一次），避免 `{{preheader}}` 之类占位符进入用户收件箱，同时保留漏传变量的可观测信号。
- **持久化**：语言切换器在 `setLocale` 后调用 `authClient.updateUser({ locale })`，失败静默（游客 / 离线不影响切换）；`user.additionalFields.locale` 用 `z.enum(['zh-CN','en-US'])` 校验输入，拒绝任意字符串。
- **反初始化循环**：`user-locale.ts` 用动态 `import()` 读 `server/database` 与实体，避免 `database → auth → email` 的循环依赖。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1406 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 301 → **205 行 / 35 文件** |
| `pnpm test` | **1026 passed / 136 files**（新增邮件翻译器、用户偏好 / 回填、双语渲染、7 个方法的 locale 透传断言） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（26 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 JS 338,182 B、总 JS 2,288,202 B |
| `pnpm test:visual` | **104 passed**（语言切换器写回偏好不改变渲染） |
| `pnpm lint:md` / `pnpm ai:check` | 通过 |
| 数据库 | `prepare-visual-db` 重建后 `caomei_auth_user` 含 `locale`；注册测试用户后 `POST /api/auth/update-user {"locale":"en-US"}` 返回 `{"status":true}`，库中 `locale='en-US'` |
| 邮件渲染 | 单测渲染 action / code / simple 三类英文邮件：除品牌名「草梅 Auth」外无中文片段、无未替换占位符；中文邮件保留 `请在 10 分钟内使用此验证码`、`🛡️ 安全提示`、`隐私政策` |

## 4. 已知边界

- 品牌名 `APP_NAME` 不翻译，英文邮件中仍显示「草梅 Auth」。
- 邮件正文中的用户名 / 新邮箱 / 操作描述来自数据或调用方（如安全通知的 `action` / `details`），不翻译。
- 登录后不会自动把账户偏好应用为界面语言；只有用户主动切换才写回，避免与服务端检测结果互相覆盖。
- 惰性回填由「拿到请求语言且库内为空」触发，因此未登录第三方发起重置请求时也可把该账号初始偏好钉为请求语言；仅影响后续邮件语言，影响面可接受。回填为 best-effort（`void`），serverless 响应结束后可能被丢弃。
- 生产库需按 [数据库部署文档](../../deployment/database.md#用户语言偏好列-userlocale2026-11-16) 手工加列；项目无 TypeORM migration 框架，沿用既有手工 DDL 约定。
- 单条目跨 27 文件（实体 + 认证配置 + 2 个服务端模块 + 模板 + 3 个建表脚本 + 测试），因「用户偏好 → 邮件语言」链路不可拆分、任一环缺失都无法通过门禁，按单原子条目提交。
- 邮件模板的中文注释保留在模板文件中（不进入渲染输出）。
- Admin 的 `en-US` 视觉基线在 M17 统一补。
