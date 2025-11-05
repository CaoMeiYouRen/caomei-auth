# 国际化实施方案

本文档分析草梅 Auth 项目当前的国际化现状，并提供分阶段的多语言支持落地方案。目标是在保持现有功能稳定的前提下，为前端、服务端、模板以及运营内容提供统一的翻译能力。

## 1. 当前状况与目标

-   **现状**：
    -   网页 UI、Meta 信息、邮件模板大多为简体中文硬编码。
    -   `nuxt.config.ts` 未引入 i18n 模块，`head.htmlAttrs.lang` 写死为 `zh-CN`。
    -   PrimeVue、Day.js 等第三方库仅配置中文 locale。
    -   服务器端（API 响应、MJML 模板、日志）没有翻译策略。
-   **目标**：
    1. 支持至少 `zh-CN` 与 `en-US` 两个语言包，并为未来语言扩展留接口。
    2. 所有用户可见文本（Web、Email、验证错误、通知）都可基于 locale 切换。
    3. 保持 SSR、SEO 以及 Demo 模式兼容。
    4. 建立翻译交付流程与质量保障机制。

## 2. 技术选型

| 层面       | 推荐技术                                     | 说明                                                                  |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------- |
| 前端 UI    | `@nuxtjs/i18n` v8（Nuxt 3 官方 i18n 模块）   | 集成 `vue-i18n`，支持 SSR、路由前缀、懒加载、SEO。                    |
| dayjs      | 原项目 `dayjs` + `import('dayjs/locale/en')` | 通过自定义插件监听 locale 切换，动态设置 Day.js 语言。                |
| PrimeVue   | PrimeVue `locale` API                        | 根据当前 locale 切换 `primevue.options.locale`，同步日期/分页等文案。 |
| 表单校验   | 复用现有 `utils/validate.ts`，引入翻译键     | 使用 `useI18n().t()` 渲染验证消息。                                   |
| 服务器响应 | `@intlify/core-base` + 共享语言包            | 服务端读取 JSON 语言包，按请求 Accept-Language/Session 返回对应文案。 |
| 邮件模板   | MJML 模板参数化 + 语言包                     | 通过渲染参数传入翻译内容或选择不同片段。                              |
| 内容管理   | JSON/TS 语言包 + 规范脚本                    | 建立 `pnpm i18n:check` 校验脚本，保证键一致与未翻译项可视化。         |

## 3. 目录与命名规范

```
locales/
  ├─ zh-CN/
  │   ├─ common.json        # 通用文案
  │   ├─ auth.json          # 认证/登录模块
  │   ├─ profile.json       # 个人中心
  │   └─ admin.json         # 管理后台
  ├─ en-US/
  │   └─ ...
  └─ index.ts               # 出口文件（可聚合并导出给服务端）
server/locales/              # 服务端可直接复用 locales/index.ts，或软链接
```

-   Key 命名采用 `域.页面.语义`，例如 `auth.login.title`、`security.mfa.enableButton`。
-   避免在组件内定义语言常量，统一从语言包读取。
-   多数情况下前后端共用 `common.json` 与 `auth.json`，特殊场景（例如日志）放在 `server-only.json`。

## 4. 实施步骤

### 阶段 A：基础设施

1. 安装依赖：

    ```bash
    pnpm add -D @nuxtjs/i18n @intlify/utils @intlify/core-base
    ```

2. 在 `nuxt.config.ts` 中追加模块与配置：

    ```ts
    export default defineNuxtConfig({
        modules: [
            "@primevue/nuxt-module",
            "@sentry/nuxt/module",
            "@nuxt/eslint",
            "vue-recaptcha/nuxt",
            "@nuxtjs/i18n",
        ],
        i18n: {
            defaultLocale: "zh-CN",
            strategy: "prefix_except_default",
            lazy: true,
            langDir: "locales",
            detectBrowserLanguage: {
                useCookie: true,
                cookieKey: "i18n_redirected",
                redirectOn: "root",
            },
            locales: [
                {
                    code: "zh-CN",
                    iso: "zh-CN",
                    file: "zh-CN/index.json",
                    name: "简体中文",
                },
                {
                    code: "en-US",
                    iso: "en-US",
                    file: "en-US/index.json",
                    name: "English",
                },
            ],
            compilation: {
                strictMessage: true,
            },
        },
    });
    ```

3. 新增 `plugins/i18n.client.ts` 与 `plugins/i18n.server.ts` 钩子：

    - **前端**：监听 `locale` 变更，调用 PrimeVue `setPrimeVueLocale(locale)`、`dayjs.locale(locale)`。
    - **后端**：在 API handler 中通过 `setResponseHeader('Content-Language', locale)`，并为 `logger` 附带语言信息。

4. 更新 `app.head`，根据 locale 动态渲染 `lang` 与 `title`（通过 `useLocaleHead`）。

### 阶段 B：页面与组件

1. 扫描 `pages/`、`components/` 中硬编码中文，替换为 `t('...')`。
2. 为布局、导航、按钮等公共组件使用 `common.json`。
3. 对输入验证与 Toast 信息调用 i18n。
4. 使用 `<i18n-t>` 处理内嵌 HTML 的文案（例如链接、强调文本）。
5. 在路由级别使用 `defineI18nRoute` 配置多语言路径（如 `/privacy` -> `/privacy` & `/zh/privacy`）。

### 阶段 C：PrimeVue、Day.js、其他第三方

1. 在 `primevue` 配置中删除硬编码 `locale`，改为在插件中注入对应语言数据。
2. 引入 `dayjs/locale/zh-cn`、`dayjs/locale/en`，在插件内 `dayjs.locale(currentLocale)`。
3. 对 `useHead`、`useSeoMeta` 进行多语言处理，确保 OG 标签多语言。

### 阶段 D：服务端与模板

1. 在 `server/plugins` 中新增 `i18n.ts`，用于：
    - 根据请求 Header 或 Session 推断语言。
    - 将 `t` 函数注入 `event.context`，供 API handler 使用。
2. 将 MJML 模板的静态中文改为变量，例如 `\{\{ t('email.verification.subject') \}\}`；渲染时传入 `t`。
3. 对返回给前端的错误消息统一走 i18n（例如 `createError({ statusMessage: t('errors.auth.invalidCode') })`）。
4. 对日志保留英文默认值，并支持附带语言的业务日志（用于分析）。

### 阶段 E：运营内容 & Demo 模式

1. Demo 模式虚拟数据中的文案也需提供多语言版本。
2. 管理后台列表（如 OAuth 客户端描述）若来自数据库，需要标注是否支持多语言字段。
3. 如果未来引入 CMS，可在语言包中保留占位符，或者在 API 层做翻译映射。

## 5. 自动化与质量保障

-   **脚本**：
    -   `pnpm i18n:lint`：校验各语言 JSON 键一致、值不为空。
    -   `pnpm i18n:report`：生成未翻译项报告（可使用 `@intlify/cli` 或自定义脚本）。
-   **Git Hook**：在 `lint-staged` 中加入 `pnpm i18n:lint`，避免提交破坏语言包。
-   **测试**：
    -   新增 `vitest` 单元测试验证 `t` 函数关键键存在。
    -   `e2e` 中覆盖语言切换、URL 前缀、邮件预览。
-   **监控**：在生产环境日志中捕获 `Missing translation`，并记录语言。

## 6. 分阶段里程碑

| 阶段     | 目标                   | 产出                                     |
| -------- | ---------------------- | ---------------------------------------- |
| Sprint 1 | 完成基础设施、示例页面 | 安装依赖、配置 Nuxt i18n、首页双语切换。 |
| Sprint 2 | 全量页面替换           | `pages/` 与核心组件全部使用语言包。      |
| Sprint 3 | 服务端与模板           | API 响应、邮件模板、日志多语言化。       |
| Sprint 4 | 自动化与 QA            | 脚本、CI 校验、e2e 覆盖、文档更新。      |

## 7. 关键风险与应对

-   **翻译缺失**：通过脚本和 CI 报告阻止缺失键，预设 fallback 为中文。
-   **性能影响**：启用 `lazy`、`langDir`，仅加载必要语言包；对大型语言包使用分模块 JSON 减少首屏体积。
-   **SEO 冲突**：使用 `strategy: 'prefix_except_default'` 与 `alternate` 链接标记，保证默认语言不变 URL。
-   **PrimeVue 兼容**：提前准备 `primevue` 官方语言文件，避免不同版本 API 不兼容。
-   **服务端一致性**：统一从同一份语言数据加载，必要时构建时生成 `dist/server/locales`。

## 8. 下一步行动清单

1. 创建 `locales/` 目录与初始 `zh-CN`、`en-US` 语言包。
2. 落地 Nuxt i18n 配置与插件。
3. 完成登录/注册等关键路径翻译替换。
4. 更新邮件模板与错误消息。
5. 添加 i18n 校验脚本并接入 CI。

执行完上述步骤后，草梅 Auth 将具备可扩展、可维护的多语言能力，为用户提供一致的国际化体验。
