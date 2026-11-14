# 2026-11-15 阶段 5 M3：治理门禁与既有缺陷

> **状态**：已完成（2026-11-15），Review Gate 放行后单次提交。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M3；[国际化实施方案](../../standards/i18n.md) §7。
> **关联**：[M2 记录](./2026-11-15-m2-locale-modules.md)｜[i18n 技术验证](./2026-11-05-i18n-verification.md)。

## 1. 硬编码扫描覆盖 `<script setup>`

`scripts/i18n/lib/hardcoded-scan.mjs` 新增 `extractVueScripts()`：提取 `.vue` 的全部 `<script>` 块（含 `<script setup>`），与模板一样剔除注释后计入基线。此前 `columns` / `options` / `useHead` 里的文案不可见，迁移后会出现「基线隐性下降」。

基线构成（`node scripts/i18n/audit-hardcoded-text.mjs`）：

| 面 | 行数 | 说明 |
| :--- | ---: | :--- |
| Vue 模板（去 HTML 注释） | 824 | 存量基线主体 |
| **Vue 脚本块（本次新增覆盖）** | **190** | `columns` / `options` / Toast / `useHead` 等 |
| TS / MJML（去注释） | 565 | composables、server、邮件模板 |
| 合计 | **1,579**（112 文件） | 原基线 1,390（107 文件） |

净变化 `+189` 行：脚本段 +190、同批移除 1 行（`use-page-meta.ts` 的 `'草梅 Auth'` 改为 `t('app.name')`）；新增 6 个文件仅因脚本块含中文（`auth-left`、`status-badge`、`feedback-button`、`send-code-button-v2`、`theme-toggle`、`pages/admin/logs.vue`）。同批 `--update` 收紧到最终值。

治理测试同步更新：`tests/unit/i18n/governance-scripts.spec.ts` 新增脚本块计入、脚本注释剔除、多脚本块合并、HTML 注释内 `<script>` / 字符串内 `</script>` 边界四例，并把「只统计模板」的旧断言改为「模板 + 脚本」。

## 2. 双语门禁接入

| 门禁 | 实现 | 覆盖 |
| :--- | :--- | :--- |
| `lint:i18n` | `eslint.i18n.config.mjs`（只加载 `@intlify/eslint-plugin-vue-i18n` + `jsonc-eslint-parser`，目标 `i18n/locales/**/*.json`） | 语言包可编译（`valid-message-syntax`）；`settings.localeDir` 仅用于该规则定位资源 |
| `test:i18n` | `vitest.i18n.config.ts`（node 环境，只跑 `tests/i18n/**`，实测 0.5s） | 键同构、英文包无中文（`language.*` 母语名除外）、文案不含复数分隔符、每条文案可被 vue-i18n 编译、真实语言包按路由装配 |
| `i18n:verify` | `lint:i18n && test:i18n` | 本地一键门禁 |

- **CI**：`i18n:check` 串联 `lint:i18n` 与 `test:i18n`，三份 workflow 仍只调一个入口（避免多处维护）。
- **Git Hook**：`lint-staged` 对 `i18n/locales/**/*.json` 追加 `eslint --config eslint.i18n.config.mjs --quiet`（缺失键 / 结构校验保持不变）。
- **有效性验证**：临时写入 `"未闭合 {name"` 后 `lint:i18n` 报 `valid-message-syntax`（exit 1）；恢复后 0 error。
- **未启用的规则**：`no-duplicate-keys-in-locale` 实测在本目录结构下产生 204 条跨语言误报（把两个语言的同名模块判成同一 locale），`valid-plural-forms` 依赖同一套 locale 解析、取不到可信 locale，故均不启用；「文案不得含复数分隔符」改由 `test:i18n` 的专用断言覆盖（实测 `valid-message-syntax` 对 `一段 | 另一段` 不报错，不能替代该断言）。
- 新增 devDependencies：`@intlify/eslint-plugin-vue-i18n@4.5.1`、`jsonc-eslint-parser@^3.3.0`、`vue-i18n@11.4.18`（精确钉当前 lock 中 `@nuxtjs/i18n` 实际解析的版本；防双实例靠与 `@nuxtjs/i18n` 的 `^11.4.8` 对齐，模块抬高下限时同批升级）。

## 3. Admin 校验键直显修复

| 位置 | 修复 |
| :--- | :--- |
| `composables/admin/use-sso-provider-form.ts` | `validateForm()` 的 issue 文案统一经 `useValidationMessage()` 翻译，不再向 Toast 返回 `validation.*` 键 |
| `components/admin/oauth/create-application-dialog.vue` | 同上；`submitApplication` 的 Toast 展示译文 |

测试：`use-sso-provider-form.spec.ts` 注入 `$t`（返回英文）后断言 `Provider ID is required`，并单独覆盖无 i18n 上下文时回退 zh-CN 的路径；两条都断言结果**无任何 `validation.` 前缀**。`create-application-dialog` 的 `validateForm` 为组件内私有函数，无独立单测，靠同一 `useValidationMessage` 契约与代码审查覆盖（M17 如补视觉/交互用例可一并纳入）。

多个校验错误用语言包分隔符拼接：新增 `common.listSeparator`（中文为全角分号，英文为分号加空格），两个对话框不再写死全角分号。

## 4. `usePageMeta` 与 `app.head`

- `usePageMeta(titleKey, descriptionKey?)` 改为 i18n 键驱动：标题取 `t(titleKey)`，站点名取 `t('app.name')`，描述缺省回退标题；用函数形式 `useHead` 输出，语言切换后同步更新。
- 消费者：`pages/admin/sso/providers.vue` 改用 `usePageMeta('admin.sso.providers.title', 'admin.sso.providers.description')`，删除无效的 `definePageMeta({ title })`；新增键见 `admin-sso.json`（中英）。
- `app.head.title` 从 `nuxt.config.ts` 移除，改由 `app.vue` 的 `useHead({ title: t('app.title') })` 输出；新增 `app.title` 键（中英）。页面级 `usePageMeta` 覆盖站点默认标题。
- SSR 实测（生产构建 + 视觉夹具）：

| 路由 | `<title>` | description / og:title |
| :--- | :--- | :--- |
| `/login` | `草梅 Auth 统一登录平台` | — |
| `/en-US/login` | `Caomei Auth Unified Sign-In Platform` | — |
| `/admin/sso/providers` | `SSO 提供商管理 - 草梅 Auth` | 中文描述与 og:title 一致 |
| `/en-US/admin/sso/providers` | `SSO Providers - Caomei Auth` | 英文描述与 og:title 一致 |

单测：`tests/unit/composables/use-page-meta.spec.ts` 覆盖标题拼接、描述回退与 og 字段。

## 5. 验证矩阵

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | 通过：99 键 → 103 键（新增 `app.title`、`admin.sso.providers.*`、`common.listSeparator`），结构一致，基线 112 文件 / 1,579 行；已串联 `lint:i18n` 与 `test:i18n` |
| `pnpm lint:i18n` | 通过（0 error）；负向用例可拦截未闭合占位符 |
| `pnpm test:i18n` | 8 passed（2 files，0.5s） |
| `pnpm test` | 989 passed / 128 files（上批 973，+16：tests/i18n 8、扫描 4、use-page-meta 3、sso 校验 1（原用例拆为注入/兜底两例）） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` | 通过（1m 47s） |
| `pnpm migration:check-budget` | 通过：入口 JS 376,333 B；总 JS 2,189,074 B |
| `pnpm test:visual` | 102 passed（标题不在截图区域，无基线变化） |

## 6. 边界

- 页面正文文案仍未迁移（M4–M14）；`lint:i18n` 不启用 `no-raw-text`，避免把未迁移页面判成错误。
- `admin/sso/providers` 的 `keywords` 元信息仍为中文（M18 SEO 批次处理）。
- `test:i18n` 与主测试套件有少量重叠（`tests/i18n/**` 也会被 `pnpm test` 收集），换取独立秒级门禁；M17 若合并可再评估。
- **同文件重复键**暂无门禁：`JSON.parse` 会静默保留后者，`lint:i18n` 关闭 `no-duplicate-keys-in-locale` 后不再检查；当前语言包由脚本生成且每模块独立，风险低，M17 未用键清理时一并补 duplicate-aware 校验。
- `usePageMeta` 的标题参数是裸字符串键，缺键会把 key 渲染进 `<title>`；`i18n:check` 的键同构 + 页面覆盖测试保证键存在，暂不加类型约束。
