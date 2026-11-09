# 2026-11-05 i18n 评估与实施方案（基于原规划修订）

> **状态**：`proposal`（评估完成，**M1 技术验证已于 2026-11-05 完成**；M2 前置与认证类服务端错误消息试点已在阶段 3 完成，见 [阶段 3 收口记录](./2026-11-09-phase3-closure.md)；页面文案与邮件未授权）。本文在 [国际化实施方案](../../standards/i18n.md) 基础上做现状复核与方案修订，并参考 momei / dependfix / caomei-ui 的已验证实现；页面级实施未启动。
> **验证记录**：[i18n 技术验证记录](./2026-11-05-i18n-verification.md)（M5-1 / M5-2：模块、detector、路由策略、useLocaleHead、语言切换、Zod error map）。
> **范围**：Web UI、服务端 API、邮件模板、表单校验、Demo 模式、SEO 与治理脚本。
> **关联**：[backlog §1.2](../../plan/backlog.md#12-i18n-全量落地)｜[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[规划规范](../../standards/planning.md)
> **单一事实源**：执行口径（目录、模块、里程碑、脚本、验收）以 [i18n.md](../../standards/i18n.md) 为准；本文保留现状取证、取舍理由与风险。

## 1. 结论摘要

**结论：方向可行，原规划需要 6 处关键修订。**

1. **技术版本**：`@nuxtjs/i18n` 最新为 **10.6.0**（2026-11-05），`vue-i18n` 为 **11.4.18**；原规划的「v9+」应改为 **v10**。v10 起 `lazy` 选项已移除（语言文件始终懒加载），原配置中的 `lazy: true` 会被忽略 / 报错，应改为 `locales[].files[]`。
2. **模块化消息**：momei 已验证 `i18n/locales/<locale>/<module>.json` + `files[]` + Locale Registry + 运行时 loader 的组合；本项目应按 `common / auth / profile / security / admin / admin-* / oauth / sso / demo / email / errors / validation` 拆分，而不是单文件。
3. **Zod v4 错误本地化**：本项目使用 Zod 4.6.7，**per-parse error map**（`schema.safeParse(value, { error: localeMap })`）可用；现有 74 处 schema 级中文 `message` 会覆盖 locale map，必须改为「标准 Zod 消息 + 自定义错误键」，才能在不复制 Schema 的前提下做请求级翻译。
4. **服务端**：v10 提供 `experimental.localeDetector` + `useTranslation(event)`，应替代原规划的「自定义 `t` 注入」；API 需返回 `Content-Language` 并设置 `Vary`。
5. **邮件语言**：`User` 实体当前没有语言字段，`better-auth-localization` 只翻译认证错误、不持久化用户语言；异步邮件（安全通知等）必须新增用户语言偏好字段（建议 `locale`），同步邮件可用请求 locale 兜底。
6. **与组件库迁移的顺序**：建议组件迁移先行（或至少完成基座与核心页），再接应用 i18n；否则需要在 PrimeVue `primelocale` 与 caomei-ui `CaomeiConfigProvider` 之间维护双轨，且 `CaomeiButton` / `CaomeiTag` 的可见文本插槽会在迁移时二次改写。

**现状规模**（2026-11-05 静态扫描，含注释与测试；段数为宽松正则的近似值，文件数为精确值）：

- 281 个文件包含中文（`ts` / `vue` / `mjml`）。
- `pages` / `components` / `layouts` 中 **63 个 `.vue`**（约 1,200+ 段中文）；`server` 中 **74 个 `.ts`**；`composables` / `utils` 中 **52 个 `.ts`**。
- Zod 相关中文消息 **约 74 处**（正则口径）；`useToast` 调用点 **160 处**、`useConfirm` **14 处**；邮件服务 **8 个方法**、MJML 模板 **6 个**、`server/templates` 中文行 **16 处**；`createError` 中中文消息 **4 / 49**。
- 当前无 `@nuxtjs/i18n`、无 `i18n/` 目录、无语言切换器；`html lang="zh-CN"`、PrimeVue `locale: zh_CN`、dayjs `zh-cn` 均为硬编码。

## 2. 背景与目标

### 2.1 背景

- 草梅 Auth 目前是「中文单语」实现：页面、邮件、API 错误、表单校验、Demo 数据均为中文硬编码。
- 已有基础设施：`utils/shared/locale.ts`（19 个 better-auth 风格 locale）、`server/utils/locale.ts`（Cookie / Header / Accept-Language 检测）、`better-auth-localization`（认证错误翻译）。
- 原 [国际化实施方案](../../standards/i18n.md) 已给出 Locale Registry、模块化消息、就绪度分级、服务端装配与治理脚本方向，但部分技术细节已过时，且缺少 Zod v4、邮件用户偏好、caomei-ui locale、语言切换器与验证链的具体落点。

### 2.2 目标

1. 首发支持 `zh-CN`（默认）与 `en-US`，为后续语言扩展保留 Registry 与回退链。
2. 覆盖 Web UI、Meta / SEO、表单校验、Toast / Confirm、API 错误、邮件模板、Demo 模式。
3. SSR、暗色模式、Demo 模式、OAuth / SSO 流程不回归。
4. 建立 key parity、未使用键、重复消息、硬编码扫描与运行时测试门禁。

### 2.3 非目标

- 不在本轮翻译运营内容（CMS 文章、公告正文等）；先用语言包占位与数据库字段设计留出扩展点。
- 不做机器翻译质量评估；`en-US` 由人工 / 审校流程保证。
- 不改变现有认证流程、数据库结构（除新增用户语言偏好字段）。
- 不引入 Tailwind / 新样式体系。

## 3. 参考项目实证

| 项目 | 实现 | 可复用经验 | 需注意的差异 |
| :--- | :--- | :--- | :--- |
| **momei** | `@nuxtjs/i18n`；`i18n/config/locale-registry.ts` + `locale-modules.ts` + `locale-runtime-loader.ts`；5 个 locale；模块化 JSON；服务端 `server/utils/i18n.ts`；6 个治理脚本；`vitest.i18n.config.ts` | Locale Registry 字段（readiness / fallbackChain / routePrefix / indexable / sitemap / feed）；core + 路由按需模块；服务端与前端共享 Registry；`zh-Hans` → `zh-CN` 边界映射；`ui-ready` → `seo-ready` 分级 | momei 已有 5 个 seo-ready 语言与内容国际化；本项目首发只需 2 个，不要把 5 语言复杂度一次性搬入 |
| **dependfix** | `apps/platform/i18n/`；`nuxt-i18n-config.ts` + `i18n.config.ts` 拆分；单一 `zh-CN.json` / `en-US.json`；`localeDetector.ts`；`i18n:audit:missing`；insert anchor 检测 | `prefix_and_default` + `redirectOn: 'root'`；detector 优先级 query → cookie → header → default；`defineI18nConfig` 与 jiti 的加载边界拆分；缺词 blocker 与 unused warning 的分级；locale 文件 anchor 校验 | dependfix 词条量小、单文件；本项目页面多，应使用 momei 的模块化方案，不照搬单文件 |
| **caomei-ui** | `CaomeiConfigProvider` / `provideLocale` / `useLocale`；`zh-CN` / `en-US` 预注册；其余 8 语言按需 `registerLocale`；28 个命名空间 / 29 个消费组件 | 组件内建文案与应用 i18n 解耦；`locale` 与 `messages` 可覆盖；`zh-CN` / `en-US` 无需额外注册 | 组件内建文案语言需与应用 locale 同步；`zh-TW` 等需显式注册，且 provider 文案是 `computed`，异步注册晚于首帧会永久回落默认 |

**关键结论**：

- Locale Registry 是唯一事实源，前端路由、SEO、回退链、服务端装配、语言切换器都读它。
- 模块化消息 + 路由按需加载是控制首屏体积的必要条件；不要把所有模块塞进 `index.json`。
- 服务端与前端必须共享同一套 Registry / fallbackChain，否则同一请求会出现不同回退结果。
- 治理脚本要区分 blocker（缺词 parity）与 warning（unused / duplicate），不要把清理项变成发版阻塞。

## 4. 现状盘点（caomei-auth）

### 4.1 运行时与语言入口

| 项 | 现状 | 影响 |
| :--- | :--- | :--- |
| `@nuxtjs/i18n` | 未安装 | 需新增模块、Registry、语言包、detector |
| `htmlAttrs.lang` | 固定 `zh-CN` | 需按 locale 动态输出 |
| PrimeVue locale | `primevue.options.locale = zh_CN` | 组件内建文案固定中文；迁移到 caomei-ui 后改 `CaomeiConfigProvider` |
| dayjs | `dayjs.locale('zh-cn')` | 需按 locale 动态 `dayjs.locale()` |
| 语言切换器 | 无 | 需新增，写入 cookie + 用户偏好 |
| `usePageMeta` | 仅设置 title / description，无 i18n | 需接入 `t()` 与 `useLocaleHead` |
| SEO | 无 sitemap / hreflang / og:locale | 需按 Registry 的 `seo-ready` 输出 |

### 4.2 现有 locale 工具

- `utils/shared/locale.ts`：`SUPPORTED_LOCALES` 为 better-auth 风格（`zh-Hans` / `zh-Hant` / `default` / 15 个其他语言），`DEFAULT_LOCALE = 'zh-Hans'`，`FALLBACK_LOCALE = 'default'`。
- `server/utils/locale.ts`：`normalizeLocale`、`parseAcceptLanguage`、`getLocaleFromCookie`、`getLocaleFromHeaders`、`detectUserLocale`、`setLocaleCookie`、`getUserLocale(request)`；Cookie 读取 `locale` / `language` / `lang`，并支持 `x-locale` / `x-language` / `x-lang`。
- `lib/auth.ts`：`localization({ defaultLocale: 'zh-Hans', fallbackLocale: 'default', getLocale: getUserLocale })`。

**修订建议**：

1. 新建项目级 `i18n/config/locale-registry.ts`，内部 locale 只保留 `zh-CN` / `en-US`（后续可扩展）。
2. 保留 better-auth 的 19 个 locale 仅作为**认证插件边界值**；认证层负责 `zh-Hans → zh-CN`、`zh-Hant → zh-TW`（或暂映射 `zh-CN`）、`default → en-US`。
3. 统一 Cookie 为 `i18n_locale`（@nuxtjs/i18n 约定）；`server/utils/locale.ts` 兼容读取旧 `locale` / `language` / `lang`，避免已有用户失效。
4. `setLocaleCookie` 同时写 `i18n_locale`，并在用户登录后持久化到用户偏好（见 §6.6）。

### 4.3 文案分布（静态扫描）

| 区域 | 文件 / 片段 | 说明 |
| :--- | ---: | :--- |
| `pages` / `components` / `layouts` | 63 个 `.vue`（约 1,200+ 段中文） | 页面标题、表单、按钮、Toast、空态、帮助文本 |
| `server` | 74 个 `.ts` | API 错误、邮件、Demo 数据、日志 |
| `composables` / `utils` | 52 个 `.ts` | Toast 文案、流程提示、校验、日期 |
| Zod | 74 处中文消息 | `utils/shared/validators.ts`、`schemas.ts`、`api-schemas.ts` 等 |
| Toast / Confirm | 160 / 14 处 | 大量中文 `summary` / `detail` |
| 邮件 | 8 个方法 / 6 个 MJML / 16 行模板中文 | 验证、重置、OTP、Magic Link、改邮箱、安全通知 |
| API 错误 | 4 / 49 处 `createError` 含中文 | 其余多为英文或错误码 |

> 扫描包含注释与测试；实际用户可见文本小于上表。开工前应以「页面 / 组件 / 服务端用户可见路径」为准重新盘点。

### 4.4 表单校验

- `composables/core/use-form.ts` 使用 `zodSchema.safeParse(values)`，把 `error.issues[].message` 直接写入 `errors`。
- `utils/shared/validators.ts` / `schemas.ts` / `api-schemas.ts` 大量 `.min(1, '请输入邮箱')` / `.regex(..., '...')`。
- 服务端 `server/utils/validation.ts` 的 `getFirstZodError` 直接返回 Zod message。

**问题**：schema 级中文 `message` 优先级高于 per-parse error map，若不在迁移时移除，服务端无法按请求 locale 翻译。

### 4.5 邮件与用户语言

- `server/utils/email/service.ts` 8 个方法全部硬编码中文标题、正文、按钮、提示。
- `server/templates/base-template.mjml` 与 `fragments/*.mjml` 使用中文占位内容；`templates-fallback.ts` 也有中文。
- `User` 实体无 `locale` / `preferredLanguage` 字段；`better-auth-localization` 不持久化用户语言。
- 异步邮件（如安全通知）无法从请求上下文取 locale，必须有用户级偏好。

### 4.6 测试

- `tests/unit/server/locale.spec.ts` 已覆盖 `normalizeLocale` / `parseAcceptLanguage`；可作为 Registry / detector 迁移的基础。
- 无 i18n 运行时测试、无 key parity 测试、无硬编码扫描。
- `pnpm lint:md` / `pnpm ai:check` 已有，但 `lint:i18n` 未引入。

## 5. 目标架构

### 5.1 目录结构

```text
i18n/
  config/
    locale-registry.ts        # 唯一 locale 事实源：code / fallbackChain / readiness / routePrefix / SEO 开关
    locale-modules.ts         # module 与 key group、路由与按需加载映射
    locale-runtime-loader.ts  # 前端按需加载 + 服务端共享装配
  locales/
    zh-CN/
      common.json
      auth.json
      profile.json
      security.json
      oauth.json
      sso.json
      admin.json
      admin-users.json
      admin-oauth.json
      admin-sso.json
      admin-logs.json
      demo.json
      email.json
      errors.json
      validation.json
    en-US/
      ...（与 zh-CN 同构）
  localeDetector.ts           # 服务端请求 locale 检测
  i18n.config.ts              # vue-i18n datetime / number 格式（与模块配置拆分）
  nuxt-i18n.config.ts         # Nuxt 模块层配置（jiti 安全）
```

### 5.2 Locale Registry

字段参考 momei，至少包含：

| 字段 | 说明 |
| :--- | :--- |
| `code` | `zh-CN` / `en-US`（项目内部唯一标识） |
| `name` / `nativeName` | 语言切换器展示 |
| `dir` | `ltr` / `rtl` |
| `default` | 默认语言 |
| `fallbackChain` | `en-US → zh-CN`、`zh-CN → zh-CN` |
| `routePrefix` | `''` / `/en-US`（`prefix_except_default`） |
| `readiness` | `draft` / `ui-ready` / `seo-ready` |
| `switchable` / `indexable` | 是否出现在切换器 / 是否允许索引 |
| `sitemapEnabled` / `feedEnabled` | SEO 输出开关 |

约束：

- Registry 是唯一事实源；`nuxt.config.ts` 的 `i18n.locales` 由 Registry 生成，不手写第二份。
- `zh-CN` 为 `seo-ready`；`en-US` 首发可先 `ui-ready`，满足 key parity + 邮件 + SEO 回归后升 `seo-ready`。
- `better-auth` 的 `zh-Hans` / `zh-Hant` / `default` 只在认证边界映射，不进入 Registry。

### 5.3 路由与检测策略

| 项 | 建议 | 理由 |
| :--- | :--- | :--- |
| `strategy` | `prefix_except_default` | 默认 `zh-CN` 无前缀；`en-US` 为 `/en-US/...`；避免 `prefix_and_default` 产生默认语言双 URL 的 SEO 重复 |
| `defaultLocale` | `zh-CN` | 与现有默认一致 |
| `detectBrowserLanguage` | `useCookie: true`，`cookieKey: 'i18n_locale'`，`redirectOn: 'root'` | 只在根路径做浏览器检测；其余路径由 URL 前缀决定，避免重置用户选择 |
| 检测优先级 | URL 前缀 > cookie `i18n_locale` > 旧 `locale` / `language` / `lang` > `x-locale` > `Accept-Language` > 默认 | 与现有 `server/utils/locale.ts` 兼容 |
| `experimental.localeDetector` | `i18n/localeDetector.ts` | 服务端 `useTranslation(event)` 依赖它 |
| 语言切换 | 切换后写 `i18n_locale` + 跳转对应前缀；登录用户同步写用户偏好 | 避免只改 cookie、下次请求又被 URL 前缀覆盖 |

### 5.4 消息加载

- `locales[].files[]` 按模块列出文件；`locale-modules.ts` 定义模块顺序与路由映射。
- **core 模块**（`common` / `errors` / `validation` / `auth`）在首屏加载；`admin-*`、`profile`、`security`、`oauth`、`sso`、`demo`、`email` 按路由 / 场景懒加载。
- `locale-runtime-loader.ts` 提供 `ensureLocaleMessageModules` / `ensureRouteLocaleMessages`，按 `fallbackChain` 逐级补齐；服务端与前端共用。
- Key 命名：`域.页面.语义`，例如 `auth.login.title`、`admin.users.createButton`、`validation.email.required`。

### 5.5 服务端

- `i18n/localeDetector.ts` 使用 `defineI18nLocaleDetector` + `tryQueryLocale` / `tryCookieLocale` / `tryHeaderLocale`，复用现有 `server/utils/locale.ts` 的归一化映射；**首次命中旧 `locale` / `language` / `lang` Cookie 时回写 `i18n_locale`**，避免 SSR / CSR 首帧语言不一致。
- API handler 使用 `const t = await useTranslation(event)`；错误消息用 `t('errors.xxx')`，并设置 `Content-Language` 与 `Vary: Accept-Language, Cookie`。
- 日志继续使用英文默认消息；可在结构化字段中附带 `locale`，不翻译日志正文。
- 缓存策略：带语言内容的响应必须把 `Accept-Language` / `i18n_locale` 纳入 `Vary` 或缓存键，避免跨语言串响应。

### 5.6 邮件与用户偏好

- 在 `User` 实体新增 `locale`（`varchar(16)`，nullable，默认 `null`）；通过 better-auth `additionalFields` / TypeORM 列暴露。字段名固定为 `locale`，不再使用 `preferredLanguage` 等别名；有效 locale = `User.locale` > 请求 locale > 默认，旧用户为 `null` 时惰性回填或按请求 locale 处理。
- 邮件服务方法增加 `locale` 参数（或从用户记录读取）：
    - 同步流程（注册验证、密码重置、OTP、Magic Link）：优先请求 locale，其次用户偏好，最后默认。
    - 异步通知（安全通知等）：优先用户偏好，其次默认。
- MJML 模板改为参数化：标题、正文、按钮、提示、页脚由 `t()` 传入；`server/templates` 的中文占位改为变量。
- 邮件语言与 Web 语言解耦：用户可能在中文 Web 上使用英文邮箱；以用户偏好为准，不强制跟随当前请求。

### 5.7 Zod v4 错误本地化

**方案：保留共享 Schema，按请求传入 per-parse error map。**

- 前端：`useForm` 增加 `zodErrorMap` 选项（或 `useZodErrorMap()`），`safeParse(values, { error: map })`；map 把 Zod issue code 映射到 `validation.*` 键。
- 服务端：`validateBody` / `validateQuery` / `validateParams` 接受 `event`，用 `useTranslation(event)` 生成 map；`getFirstZodError` 改为返回翻译后的消息或错误键。
- Schema 改造：
    - 移除 schema 级中文 `message`（74 处），让标准 Zod issue 走 map。
    - 自定义规则（密码不一致、邮箱/手机格式）保留**错误键**，例如 `.refine(..., { message: 'validation.password.mismatch' })`；边界层再翻译。
    - 不要在 Schema 中直接调用 `t()`：Schema 前后端共享，`t` 只在请求边界可用。
- 兼容：Zod 4 的 `z.config(z.locales.zhCN())` 是全局配置，SSR 多请求下会串语言；**不使用全局配置**，只用 per-parse map。

### 5.8 与组件库迁移的衔接

| 场景 | 处理 |
| :--- | :--- |
| 组件迁移先行 | 删除 PrimeVue `primelocale` 与 `plugins/primevue-i18n`；应用 i18n 接管后，用 `CaomeiConfigProvider :locale` 同步组件内建文案 |
| i18n 先行 | 保留 `plugins/primevue-i18n`，按当前 locale 注入 `primelocale`；组件迁移时删除该插件并改 `CaomeiConfigProvider` |
| caomei-ui 多语言 | `zh-CN` / `en-US` 预注册；若后续加 `zh-TW` / `ja-JP` / `ko-KR`，在模块顶层 `registerLocale`（provider 文案是 computed，异步注册晚于首帧会永久回落） |
| 文案插槽 | `CaomeiButton` / `CaomeiTag` 的可见文本走默认插槽，`t()` 直接写在插槽内；不要写 `label` / `value` |

详细顺序与理由见 [caomei-ui 迁移评估 §8.2](./2026-11-05-caomei-ui-migration-evaluation.md)。

## 6. 消息模块规划（摘要；执行口径以 [i18n.md](../../standards/i18n.md) §4 为准）

| 模块 | 覆盖范围 | 加载时机 |
| :--- | :--- | :--- |
| `common` | 导航、按钮、通用状态、空态、页脚、主题切换 | 首屏 core |
| `errors` | 通用错误、网络错误、权限错误、404 / 500 | 首屏 core |
| `validation` | Zod / 表单校验错误键 | 首屏 core |
| `auth` | 登录、注册、忘记密码、重置、快速登录、OTP、Magic Link | 首屏 / auth 路由 |
| `profile` | 个人资料、头像、用户名、邮箱、手机号 | 个人资料路由 |
| `security` | 密码、2FA、会话、账号安全 | 安全路由 |
| `oauth` | OAuth 客户端、授权确认、同意页 | OAuth 路由 |
| `sso` | SSO 登录、提供商展示 | SSO 路由 |
| `admin` | 后台壳层、菜单、通用操作 | `/admin/**` |
| `admin-users` | 用户管理、封禁、角色、会话 | `/admin/users` |
| `admin-oauth` | OAuth 应用管理、密钥、API 文档 | `/admin/oauth/**` |
| `admin-sso` | SSO 提供商、OIDC / SAML 表单 | `/admin/sso/**` |
| `admin-logs` | 登录日志、筛选、图表 | `/admin/logs` |
| `demo` | Demo 模式横幅、虚拟数据文案 | Demo 模式 |
| `email` | 邮件标题、正文、按钮、提示 | 服务端按需 |
| `server-only` | 服务端专用错误 / 通知（可选） | 服务端按需 |

**归属规则**：

- 页面私有词条留在页面命名空间；跨页面复用的按钮 / 状态 / 提示上收到 `common`。
- 禁止公共页引用后台私有 key，或后台页复用公共页私有 key。
- 上收前先跑 `i18n:audit:duplicates`；审计只给候选，是否抽取由组件职责与加载边界决定。

## 7. 治理脚本与门禁（摘要；执行口径以 [i18n.md](../../standards/i18n.md) §7 为准）

| 脚本 / 命令 | 职责 | 阻断级别 |
| :--- | :--- | :--- |
| `scripts/i18n/audit-locale-keys.mjs` | 扫描 `i18n/locales/<locale>/*.json`，校验 key parity、缺失、未使用 | 缺失 = blocker；未使用 = warning |
| `scripts/i18n/check-locale-parity.mjs` | 语言间 key parity / 结构一致 | blocker |
| `scripts/i18n/audit-duplicate-messages.mjs` | 重复消息候选（仅翻译签名完全一致） | warning |
| `scripts/i18n/audit-hardcoded-text.mjs` | 扫描 `.vue` 模板 / 服务端用户可见路径中的中文硬编码 | 新增 = blocker；存量 = warning + allowlist |
| `scripts/i18n/check-locale-fallback.mjs` | 校验 Registry fallbackChain 与 `files[]` 完整性 | blocker |
| `pnpm lint:i18n` | `@intlify/eslint-plugin-vue-i18n` 的 `no-raw-text` / `no-missing-keys` 等 | blocker（新增代码） |
| `pnpm test:i18n` | `vitest.i18n.config.ts`：Registry、loader、切换、关键路径文案 | blocker |

接入点：

- `test.yml` / `regression-weekly.yml` 增加 `pnpm i18n:audit`、`pnpm lint:i18n`、`pnpm test:i18n`。
- `lint-staged` 对 `i18n/locales/**` 与 `.vue` / `.ts` 变更执行 `i18n:audit:missing`。
- 现有 `pnpm lint:md` / `pnpm ai:check` 保持不变。

## 8. 分阶段实施计划（摘要；执行口径以 [i18n.md](../../standards/i18n.md) §8 为准）

| 里程碑 | 范围 | 产出 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| **M1 基础设施** | 安装 `@nuxtjs/i18n@10` / `vue-i18n@11`；建 `i18n/` 目录、Registry、模块映射、loader、detector、`i18n.config.ts`；接入 `useLocaleHead`、语言切换器 | 双语言可切换；`html lang` / `dir` / og:locale 正确；core 模块可加载；`prefix_except_default` 路由可用 | 切换语言不刷新 / 刷新均正确；`/en-US` 可访问；cookie 持久化；SSR 无 hydration mismatch | 无 |
| **M2 核心链路** | `common` / `errors` / `validation` / `auth`；登录、注册、忘记密码、重置、快速登录、OTP、Magic Link；`usePageMeta` 接 `t()` | 认证链路全量翻译；Zod error map 接入 `useForm`；Toast / Confirm 文案走 `t()` | 认证流程中英文完整；表单错误按语言显示；`lint:i18n` 通过 | M1；**页面文案部分依赖组件迁移 P2/P3 完成**（否则在 PrimeVue `label` / `value` 上写 `t()`，迁移时二次改写） |
| **M3 个人 / 安全 / OAuth / SSO** | `profile` / `security` / `oauth` / `sso`；个人资料、密码、2FA、会话、OAuth 同意、SSO 登录 | 这些路由全量翻译；日期 / 数字格式按 locale；邮件按钮 / 提示接入 `email` 模块 | 页面无中文残留；日期 / 数字符合 locale；a11y 可访问名翻译 | M2 |
| **M4 Admin 与邮件 / API** | `admin` / `admin-users` / `admin-oauth` / `admin-sso` / `admin-logs`；`User.locale` 字段；8 个邮件方法；MJML 参数化；API 错误 `useTranslation` + `Content-Language` | 后台全量翻译；邮件按用户偏好；API 错误按请求语言 | 后台关键页无中文残留；邮件 2 语言模板通过；API 错误 / `Content-Language` 正确 | M3 |
| **M5 治理与 SEO** | `demo` 模块；`audit-*` 脚本；`lint:i18n`；`vitest.i18n.config.ts`；sitemap / hreflang / `seo-ready` 升级；文档 | 治理脚本接入 CI；`en-US` 升 `seo-ready`；文档同步 | 脚本全绿；key parity 100%；无未使用键（或 allowlist）；SEO 输出正确 | M4 |

### 8.1 每批最小验收

- `pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` 通过。
- `pnpm i18n:audit:missing` 通过（缺词 = blocker）。
- 受影响页面浅色 / 暗色 + `zh-CN` / `en-US` 浏览器验证。
- 无新增硬编码中文（存量 allowlist 不扩大）。
- 服务端 API / 邮件有定向测试或实际发送验证（测试环境）。

## 9. 风险与缓解

| # | 风险 | 影响 | 缓解 |
| :-: | :--- | :--- | :--- |
| 1 | **Zod schema 级中文消息覆盖 locale map** | 服务端错误仍是中文 | M2 前移除 74 处 schema 级消息，改标准 issue / 错误键；补 per-parse map 测试 |
| 2 | **全局 Zod locale 在 SSR 串语言** | 并发请求语言错乱 | 禁用全局 `z.config`；只用 per-parse map |
| 3 | **better-auth locale 标识冲突** | 认证错误与业务语言不一致 | 认证层映射 `zh-Hans` / `zh-Hant` / `default`；业务层只用 `zh-CN` / `en-US` |
| 4 | **邮件无用户偏好** | 异步邮件语言错误 | 新增 `User.locale`；同步流程请求 locale 兜底；迁移默认 null |
| 5 | **首屏体积膨胀** | 性能回退 | core + 路由按需模块；不要把所有 JSON 塞进首屏；复测入口 JS |
| 6 | **SEO 重复 / 缺 hreflang** | 索引错误 | `prefix_except_default`；`useLocaleHead`；只对 `seo-ready` 输出 sitemap / alternates |
| 7 | **语言切换被 URL 前缀覆盖** | 用户选择失效 | 切换写 cookie + 跳转对应前缀；登录用户写偏好 |
| 8 | **与组件迁移冲突** | 同页面二次改写 | 按 §5.8 顺序；i18n 基础设施并行，页面文案不并行 |
| 9 | **邮件模板 MJML 变量注入 / 转义** | 邮件渲染错误 / XSS | 变量白名单 + `sanitize-html` 现有能力；模板快照测试 |
| 10 | **Demo 数据中文专名** | 英文界面出现中文假数据 | `demo` 模块 + 生成器接受 locale；或明确 Demo 仅 zh-CN 并登记 |

## 10. 验收标准（摘要；执行口径以 [i18n.md](../../standards/i18n.md) 为准）

- [ ] `zh-CN` / `en-US` 可切换，刷新 / 直达 URL 后语言保持。
- [ ] `html lang` / `dir`、`og:locale`、`hreflang`、`usePageMeta` 按 locale 输出。
- [ ] 认证、个人资料、安全、OAuth、SSO、后台关键页无中文硬编码（allowlist 外）。
- [ ] `pnpm i18n:audit:missing` 100% key parity；`lint:i18n` / `test:i18n` 通过。
- [ ] Zod 校验错误按请求语言显示；服务端 API 错误带 `Content-Language`。
- [ ] 8 个邮件方法支持 `zh-CN` / `en-US`；用户偏好生效；MJML 模板无硬编码中文。
- [ ] 日期 / 数字 / dayjs locale 正确；caomei-ui 内建文案跟随应用语言（若已迁移）。
- [ ] Demo 模式中英文可用，或明确登记为仅 `zh-CN`。
- [ ] `pnpm build` 通过；首屏 / 入口包体无不可解释跃升。
- [ ] 文档同步：`docs/standards/i18n.md`、README、开发规范。

## 11. 不做什么

- 不一次性支持 19 个 better-auth locale；首发只做 `zh-CN` / `en-US`。
- 不把 `better-auth-localization` 的语言列表直接当项目语言列表。
- 不在 Schema 中调用 `t()` 或依赖全局 Zod locale。
- 不做机器翻译质量承诺；`en-US` 需审校。
- 不翻译日志正文、内部错误堆栈、数据库字段值。
- 不改变认证流程 / 权限模型。

## 12. 上收触发条件

1. 用户明确授权启动 i18n；
2. 组件库迁移顺序已确认（建议组件迁移先行，至少完成核心页）；
3. `@nuxtjs/i18n@10` + Nuxt 4.6.3 的兼容性在本地验证通过；
4. Zod per-parse error map 方案在 1 个表单 + 1 个 API 上完成技术验证；
5. 用户语言偏好字段的迁移方案（nullable / 默认值）已确认。

## 13. 工作量画像

| 项 | 数值 |
| :--- | :--- |
| 用户可见中文文件（页面 / 组件 / 布局） | 63 个 `.vue`（约 1,200+ 段） |
| Zod 中文消息 | 74 处 |
| Toast / Confirm 调用点 | 160 / 14 |
| 邮件方法 / MJML / 模板中文行 | 8 / 6 / 16 |
| 建议模块数 | 15（含 `server-only`） |
| 建议里程碑 | M1–M5 |

> 不给出工期数字；按「基础设施 → 核心链路 → 业务域 → 治理」推进，每批独立提交与验证。

## 14. 关联文档

- 本项目：[国际化实施方案](../../standards/i18n.md)｜[backlog §1.2](../../plan/backlog.md#12-i18n-全量落地)｜[caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[开发规范](../../standards/development.md)｜[测试规范](../../standards/testing.md)｜[规划规范](../../standards/planning.md)
- momei：[国际化系统设计](https://github.com/CaoMeiYouRen/momei/blob/master/docs/design/modules/i18n.md)｜[Locale Registry](https://github.com/CaoMeiYouRen/momei/blob/master/i18n/config/locale-registry.ts)｜[i18n 治理脚本](https://github.com/CaoMeiYouRen/momei/tree/master/scripts/i18n)
- dependfix：[i18n 规范](https://github.com/dependfix/dependfix/blob/master/docs/standards/i18n.md)｜[i18n 配置](https://github.com/dependfix/dependfix/tree/master/apps/platform/i18n)
- caomei-ui：[内建文案与语言](https://github.com/CaoMeiYouRen/caomei-ui/blob/master/docs/components/locale.md)
- 官方文档：[@nuxtjs/i18n v10](https://i18n.nuxtjs.org/)｜[Zod v4 error customization](https://zod.dev/error-customization)
