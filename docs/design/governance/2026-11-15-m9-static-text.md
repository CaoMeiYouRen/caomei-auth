# 2026-11-15 阶段 5 M9：首页、静态页与共享壳文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M9；[M8 记录](./2026-11-15-m8-oauth-text.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/index.vue` | 左侧标题 / 副标题、GitHub 与文档链接、页面入口与 6 个按钮、源码分隔文案 |
| 页面 | `pages/about.vue` | 标题、简介、功能特性 7 项、技术栈 6 项、主题说明、开源协议句（`<i18n-t>` + `#license`） |
| 页面 | `pages/privacy.vue` | 12 个条款段落、5 处内嵌链接句（Sentry / Clarity / 百度统计 / Google Analytics / 客服邮箱）、11 个第三方登录链接 |
| 页面 | `pages/terms.vue` | 8 个条款段落、联系方式 |
| 共享壳 | `components/app-footer.vue` | 版权、右上角 aria、标语、9 个页脚链接 |
| 共享壳 | `components/feedback-button.vue` / `github-corner.vue` / `demo-mode-banner.vue` | 反馈按钮默认文案、GitHub 角标可访问名、Demo 横幅标题 / 说明 / 文档链接句 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/static.json` | 新增 **static** 模块，**141 键**（home 12 / about 23 / privacy 72 / terms 31 / 共用 3） |
| 语言包 | `i18n/locales/{zh-CN,en-US}/app.json` | 新增 `footer.*`（12）、`feedback.*`（2）、`github.*`（2） |
| 语言包 | `i18n/locales/{zh-CN,en-US}/demo.json` | `demo.*`（4）：标题、说明、文档链接句、链接名 |

`app` 模块 24 → **40 键**，`demo` 0 → **4 键**，全量 **844 键**。

## 2. 实现要点

- **新增 `static` 模块**：首页与三个静态页体量大、且只在 `/`、`/about`、`/privacy`、`/terms` 命中，按路由懒加载；`i18n/config/locale-modules.ts` 注册模块、key group 与路由规则（`^\/$` 与 `^\/(?:about|privacy|terms)(?:\/|$)`），模块数 17 → 18。
- **共享壳留在 `app`（core）**：页脚 / 反馈 / GitHub 角标在全部页面出现，放进 core 避免路由懒加载缺口。
- **内嵌链接句**：隐私政策的 5 处链接句与开源协议句统一改 `<i18n-t>` + 命名插槽（`#sentry` / `#clarity` / `#baidu` / `#google` / `#email` / `#license`），避免英文缺空格；条款里 `<strong>标签：</strong>正文` 拆成 label / text 两键，冒号由 `static.colon`（zh「：」/ en「: 」）统一输出；`rights.*Label` 因原样式把冒号包在 `<strong>` 内，保留冒号并单独渲染，其余 label 一律不带冒号。
- **第三方登录链接**：链接 URL 留在页面常量里，文案键以字面量放进 `thirdPartyPlatforms`，既避免动态拼接逃过审计，也让 11 个平台名各自可翻译。
- 反馈按钮 / GitHub 角标的 props 默认值改为 `undefined` + `computed` 回退到 `t()`，保留调用方可覆盖的行为。
- Demo 横幅的「Demo账号密码详见 + 文档链接」改 `<i18n-t keypath="demo.docHint">` + `#link` 插槽。
- 页脚标语沿用 M2 已有的 `footer.tagline`，值统一为 `统一登录平台 · 安全、便捷、可扩展`（`|` 会被 vue-i18n 当作复数分隔符，导致只渲染前半句；`test:i18n` 已守住该约束）。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **844 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 964 → **823 行 / 69 文件** |
| `pnpm test` | **998 passed / 131 files**（新增 `app-footer` 的 `useI18n` 替身、`demo-mode-banner` 3 例；`locale-modules` 断言 18 模块与 static 路由） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 CSS 415,165 B（累计 +3.86%，本轮无变化）、入口 JS 388,584 B、总 JS 2,241,326 B |
| `pnpm test:visual` | 静态页与首页基线重采（页脚标语由硬编码 `|` 改为 `t('footer.tagline')` 的 `·` 版本，整套 102 张以 `--update-snapshots=all` 重采、共 52 张变化：4 张 Admin 桌面基线的差异精确落在页脚标语行（内容变化），`about` / `privacy` / `terms` / `home` 为切换器与文本节点抗锯齿，其余为 ±1–7 的渲染噪声；无尺寸或布局位移）；verify **104 passed** |
| 浏览器（生产构建） | `/about` 与 `/en-US/about`：标题、简介、功能 / 技术栈条目中英一一对应；`/privacy` 与 `/en-US/privacy`：「数据收集：…」「Data collection: …」，内嵌链接句渲染为 `… 请通过 {邮箱} 联系…` / `… contact our support team at {email}`，无双冒号；`/terms` 与 `/en-US/terms` 同构；页脚在 `/`、`/about`、`/privacy`、`/terms` 上均为当前语言（`首页 / Home`、`隐私政策 / Privacy Policy`、`项目文档 / Documentation`） |

## 4. 已知边界

- **尾斜杠白名单**：`middleware/auth.global.ts` 原先用 `pathname === path` 精确匹配，`/about/` 会被当成私有页跳到登录；本次统一去掉尾斜杠后再判断，`/about/` 与 `/about` 行为一致。
- 备案号来自运行时配置（`icpBeianNumber` / `publicSecurityBeianNumber`），不翻译。
- 隐私 / 服务条款的中文为原文逐字迁移，英文为对应译文；后续如条款实质变更，两份需同步更新（M19 收口时复核）。
- `static` 模块的 `en-US` 视觉基线在 M17 统一补；本次只维护 zh 自基线。
