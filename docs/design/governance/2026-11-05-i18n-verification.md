# 2026-11-05 i18n 技术验证记录（M5-1 / M5-2）

> **状态**：技术验证完成；M2 准入结论为**有条件通过**（见 §6）。
> **2026-11-06 更新**：§6 前置项 1–3 与服务端错误消息试点已随阶段 3 授权登记，状态见 [todo.md](../../plan/todo.md) M5-1～M5-3；页面文案翻译仍待组件 P2 试点完成后准入。
> **关联条目**：[阶段 2 M5-1 / M5-2](../../archive/completed-work.md)。
> **方案来源**：[i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md) §5、§8。
> **边界**：只做基础设与原型，**未翻译任何页面 / 邮件 / API 文案**。

## 1. 版本与环境

| 项 | 版本 |
| :--- | :--- |
| `@nuxtjs/i18n` | 10.6.0（精确锁定） |
| `vue-i18n` | 11.4.18（随模块依赖） |
| Nuxt | 4.6.3 |
| `vue-router` | 5.4.0 |

## 2. 验证项与结果

| 验证项 | 结果 | 证据 |
| :--- | :--- | :--- |
| `locales[].files[]` 模块化加载 | 通过 | `i18n/locales/<locale>/{common,validation}.json`，由 Locale Registry 的 `files` 生成 |
| `experimental.localeDetector` | 通过 | `i18n/localeDetector.ts`：query → `i18n_locale` → 旧 cookie → Accept-Language → 默认；命中旧 cookie 回写 `i18n_locale` |
| `prefix_except_default` | 通过 | `zh-CN` 无前缀，`en-US` 为 `/en-US/**`；`/en-US/login` 返回 200 |
| `useLocaleHead` | 通过 | `<html lang="en-US" dir="ltr" data-preset="caomei">`；`hreflang` 覆盖 `x-default/zh/zh-CN/en/en-US`；canonical 指向 `/en-US/login` |
| 语言切换原型 | 通过 | 页脚 `BaseLanguageSwitcher`：切到 English 后 URL `/en-US/login`、`lang=en-US`、cookie `i18n_locale=en-US`，刷新保持；切回后 `/login`、`lang=zh-CN` |
| SSR / hydration | 通过 | 上述均为服务端渲染结果，浏览器切换后无 hydration 报错 |
| 路由守卫兼容 | 修复后通过 | `middleware/auth.global.ts` 用 `stripLocalePrefix()` 归一化，未登录访问 `/en-US/private` 会跳到 `/en-US/login` 而不是丢失前缀 |
| Zod per-parse error map | 通过（机制） | 见 §4 |

## 3. 实施内容

| 文件 | 作用 |
| :--- | :--- |
| `i18n/config/locale-registry.ts` | Locale Registry：code / fallbackChain / routePrefix / readiness / files / 认证边界映射 / `stripLocalePrefix` |
| `i18n/locales/{zh-CN,en-US}/{common,validation}.json` | 首批词条：语言切换、页脚标语、校验错误键 |
| `i18n/localeDetector.ts` | 服务端 locale 检测 |
| `nuxt.config.ts` | `@nuxtjs/i18n` 模块、`strategy`、`files[]`、`detectBrowserLanguage`、`baseUrl` |
| `app.vue` | `useLocaleHead({ seo: true })` 输出 lang / dir / hreflang / canonical |
| `components/base/language-switcher.vue` | 语言切换原型（PrimeVue Select + `setLocale` + cookie） |
| `middleware/auth.global.ts` | 路由守卫按去前缀后的业务路径判断 |

验证过程中发现并修复的接入问题：

1. `localeDetector` 路径相对 `i18n/` 目录解析，写 `./i18n/localeDetector.ts` 会变成 `i18n/i18n/...`，改为 `./localeDetector.ts`。
2. 未设置 `i18n.baseUrl` 时 hreflang 无法生成有效绝对链接；改为读 `NUXT_PUBLIC_AUTH_BASE_URL`，缺省 `http://localhost:3000`。
3. 路由守卫直接比较 `to.path !== '/login'`，会丢弃 locale 前缀；改为 `stripLocalePrefix` + `useLocalePath('/login')`。
4. 组件自动导入按目录前缀命名，页脚需使用 `<BaseLanguageSwitcher />`。

## 4. Zod per-parse error map 验证

机制：

- `utils/shared/zod-error-map.ts`：`createZodErrorMap(t)` 把 Zod issue code 映射为 `validation.*` 键；不使用全局 `z.config(z.locales.xxx())`。
- 前端：`useForm` 新增 `errorMap` 选项，传入 `safeParse(values, { error })`。
- 服务端：`validateBody` / `validateBodySafe` / `validateQuery` / `validateParams(Safe)` 新增 `{ errorMap }` 选项。

验证覆盖（1 表单 + 1 API）：

| 场景 | Schema | 结果 |
| :--- | :--- | :--- |
| 表单 | `useForm` + `oauthApplicationFormSchema`（`token_endpoint_auth_method` 非法枚举） | 返回 `validation.invalidValue` 对应文案 |
| 表单（无 message 字段） | `z.object({ nickname, age })` | `too_small` / `too_big` 均被映射 |
| API | `validateBodySafe` + `adminRoleSyncSchema`（`action` 非法枚举） | 返回翻译后的 400 message |
| 兼容 | 无 error map 时 | 行为与迁移前一致（400 + 原始 message） |

**关键发现**：schema 级 `message` 优先级高于 per-parse map（`.min(1, '请输入邮箱')` 不会被翻译）。这与评估 §5.7 一致，是本阶段最重要的准入结论。

## 5. 未覆盖范围（明确不做）

> 以下为 2026-11-05 M1 技术验证的范围；阶段 3（2026-11-06）已另行授权 schema 清理、`validation.*` 键、治理脚本与服务端错误试点，不改变本记录的验证结论。

- 页面 / 组件 / Toast / Confirm 文案翻译（M2+）。
- 邮件模板、API 错误文案、`Content-Language` 响应头（M4）。
- `User.locale` 字段与邮件语言偏好（M4）。
- sitemap / hreflang 全量输出策略、`seo-ready` 升级（M5）。
- i18n 治理脚本（`i18n:audit:*`、`lint:i18n`、`test:i18n`）。
- PrimeVue `primelocale` 与 caomei-ui locale 随应用语言同步（组件迁移完成后处理）。

## 6. i18n M2 准入结论

**结论：有条件通过。** 技术链路（模块、detector、路由策略、SEO head、切换、per-parse map）均可用，可以进入 M2；但 M2 开工前必须先完成以下前置项，否则会出现「页面已翻译、校验错误仍是中文」的半成品状态：

| # | 前置条件 | 原因 |
| :-: | :--- | :--- |
| 1 | 移除 Schema 级中文 `message`（评估口径 74 处），改为标准 Zod 消息或错误键 | 否则 per-parse map 不会生效 |
| 2 | 补 `validation.*` 全量错误键（zh-CN / en-US 同构） | 错误键是 map 的唯一来源 |
| 3 | 引入 key parity / 缺词审计脚本（`i18n:audit:*`）并接入 CI | M2 起翻译面快速扩大，无门禁会漏词 |
| 4 | 组件迁移至少完成 P2 试点页 | 避免在 PrimeVue `label` / `value` 上写 `t()` 后被二次改写（评估 §8.2） |
| 5 | 明确 `en-US` 就绪度：保持 `ui-ready`，key parity + 邮件 + SEO 回归后再升 `seo-ready` | Registry 已登记，升级需证据 |

不建议在 M2 一并做：邮件与 `User.locale`（放 M4）、sitemap 全量（M5）、Demo 数据多语言（单独评估）。

## 7. 回退方式

- 移除 `@nuxtjs/i18n` 依赖与 `nuxt.config.ts` 的 `i18n` / 模块条目；
- 删除 `i18n/`、`components/base/language-switcher.vue`、`tests/unit/i18n/`，还原 `app.vue`、`middleware/auth.global.ts` 与 `useForm` / `validation.ts` 的可选参数（可选参数保留也无副作用）；
- 无数据库与 API 契约变更，无需数据回滚。

## 8. 关联文档

-   [i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md)｜[国际化实施方案](../../standards/i18n.md)｜[待办事项](../../plan/todo.md)
-   [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md)｜[阶段 2 范围登记](./2026-11-05-phase2-registration.md)
