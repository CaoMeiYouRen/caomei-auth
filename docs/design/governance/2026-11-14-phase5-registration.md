# 2026-11-14 阶段 5 范围登记：i18n 全量落地与体验收口

> **状态**：已授权启动（2026-11-14，用户确认「阶段 5 = i18n 全量」、§2.10 并入本阶段、caomei-ui 升级 1.3.0）；实施未开始，完成态以 `todo.md` 与 Review Gate 结论为准。
> **单一事实源**：阶段范围、原子条目与验收见本文；执行口径（目录、模块、脚本、验收细则）以 [国际化实施方案](../../standards/i18n.md) 为准；候选详情见 [backlog.md](../../plan/backlog.md)；方向见 [roadmap.md](../../plan/roadmap.md)。
> **前置**：[阶段 4 收口记录](./2026-11-14-phase4-closure.md)（PrimeVue 已下线）；[i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md) §8 / §12；[i18n 技术验证](./2026-11-05-i18n-verification.md)。
> **准入规则**：[规划规范](../../standards/planning.md)。

## 1. 阶段目标

1. **完成 i18n 剩余里程碑**：页面文案（M2）、个人 / 安全 / OAuth / SSO（M3）、Admin 与邮件 / API（M4）、治理与 SEO（M5）全部落地。
2. **双语质量门可执行**：key parity、硬编码扫描（含 `<script setup>`）、`lint:i18n`、`test:i18n`、双语视觉抽检全部接入 CI，而不是只靠人工检查。
3. **组件库内建文案跟随应用语言**：升级 caomei-ui 1.3.0，并通过 `CaomeiConfigProvider` 把 Select / Paginator / DataTable / Toast / Confirm 等内建文案切到当前 locale。
4. **`en-US` 完成 `ui-ready → seo-ready`**：输出 sitemap / hreflang / canonical / `og:locale`，并按 Registry 只放量 `seo-ready` 语言。
5. **完成 backlog §2.10**：个人中心 ↔ 授权应用 / 安全设置 / 修改密码 / 返回首页的一致入口与返回路径。

## 2. 范围与非目标

### 2.1 本阶段范围

- Web UI 全量文案：18 个页面、`components/**`、`composables/**` 中的用户可见文本。
- 邮件：8 个 `emailService` 方法、6 个 MJML 模板与 `templates-fallback.ts` 参数化。
- `User.locale` 字段、登录后偏好持久化、异步邮件语言来源。
- API 错误面：`createError` 中文清理、错误键映射、`Content-Language` / `Vary` 扩展到全部本地化 API。
- SEO：sitemap、robots、hreflang、canonical、`og:locale`、`en-US` 就绪度升级。
- 基座：caomei-ui 1.2.0 → 1.3.0；`CaomeiConfigProvider` locale 桥接；受影响视觉基线重采。
- backlog §2.10 导航互联与对应视觉基线。
- 治理：`locale-modules` / `locale-runtime-loader`、扫描盲区修复、`lint:i18n` / `test:i18n`。

### 2.2 非目标

- 不新增第三语言、不做 RTL、不承诺机器翻译质量（`en-US` 需审校）。
- 不翻译日志正文、内部错误堆栈、数据库枚举值。
- 不做 UI 改版；除 §2.10 的入口调整外维持现有布局与交互。
- 不改变认证流程与权限模型（`User.locale` 仅新增用户偏好字段，不参与鉴权）。
- 不引入 sitemap 之外的新 SEO 平台，不做运营内容（公告 / CMS）国际化。
- 不处理 backlog 中与 i18n 无关的体验 / 性能 / 企业级候选。

## 3. 现状取证（2026-11-14 基线）

| 项 | 现状 | 影响 |
| :--- | :--- | :--- |
| 语言包键 | 99 个（`common` 6 / `errors` 17 / `validation` 76），`en-US` 同构 | 页面文案模块尚未建立 |
| 硬编码中文基线 | `pnpm i18n:audit:hardcoded`：107 个文件 / 1,390 行 | 当前只扫模板段，`<script setup>` 文案不可见 |
| `.vue` 中文 | 63 / 65 个（`pages` + `components` + `layouts`，1,271 行含中文） | 页面文案是主体工作量 |
| 服务端中文 | 83 / 88 个 `.ts` 含中文（含注释）；`createError` 中文 4 文件 / 11 处 | 用户可见面需与注释剥离后清理 |
| 邮件 | 8 个方法、6 个 MJML、fallback 模板仍有中文；`User` 无 `locale` | 异步邮件无语言来源 |
| Meta / SEO | 18 个页面仅 `admin/sso/providers` 有 `useHead`；`usePageMeta` 零消费者；`app.head.title` 硬编码 | 标题 / 描述 / hreflang 未按 locale 输出 |
| 服务端 i18n 试点 | `server/utils/i18n.ts` 已支持 `Content-Language` / `Vary`，覆盖 `/api/auth` `/api/oauth` `/api/sso` `/api/social` | 其余 API 与错误面未接入 |
| 组件库 | caomei-ui 1.2.0；`CaomeiConfigProvider` 未挂载 | 英文界面下组件内建文案仍为中文 |
| 就绪度 | `zh-CN` `seo-ready`；`en-US` `ui-ready`、`indexable: false` | 双语 SEO 未放量 |
| 治理门禁 | `i18n:audit` / parity / fallback / hardcoded 已接入；`lint:i18n` / `test:i18n` 未接入 | 缺「新增代码不得裸写中文」的阻断 |
| 视觉 | 自基线 102 条；无 `en-US` 基线 | 双语渲染未纳入回归 |

## 4. 阶段构成（5 条主线 / 19 条原子条目）

| 编号 | 条目 | 交付面 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| M1 | 基座对齐：caomei-ui 1.3.0 与内建文案 locale 桥接 | 依赖升级、`CaomeiConfigProvider`、双语内建文案抽检、受影响视觉基线重采 | 英文下 Select 空态 / Paginator / DataTable 空态 / Toast / Confirm 默认文案为英文；`test` / `test:visual` 全绿 | 阶段 4 |
| M2 | 消息模块化与按需加载 | `i18n/config/locale-modules.ts`、`locale-runtime-loader.ts`、Registry `files[]` 按模块拆分（17 模块）、loader 单测 | 路由进入加载对应模块；core 模块首屏可用；`i18n:check` / `test` 通过；首屏体积无不解释跃升 | M1 |
| M3 | 治理门禁与既有缺陷 | 硬编码扫描覆盖 `<script setup>`（`columns` / `options`）；基线重算并写明构成；`lint:i18n` + `test:i18n` 接入 CI / lint-staged；Admin 表单 `validation.*` 直显修复；`usePageMeta` 接 `t()` 并落地页面；`app.head` 去硬编码 | 新增中文被阻断；两条新门禁可跑；Admin 校验提示显示译文而非键名；`usePageMeta` 有页面消费者与单测 | M2 |
| M4 | 认证入口文案 | `login` / `register` / `forgot-password` / `change-password` / `quick-login` + `auth-left` / `phone-input-v2` / `send-code-button-v2` / `captcha` / `password-strength` + 6 个认证 composable（含 `use-otp`）+ `auth` 模块 | 5 页双语文案完整；Toast / Confirm 走 `t()`；表单校验按语言显示；浅 / 暗 + 双语言浏览器验证 | M3 |
| M5 | SSO 登录、错误页与密码重置链接页 | `sso-login` + `error.vue` + `use-sso-login-flow`；`/reset-password` 页面或移除邮件链接（决策 backlog §3.1 条目） | SSO 页双语完整；错误页按语言输出；邮件链接不再 404；`publicPaths` 与限流同步 | M4 |
| M6 | 个人中心文案 | `pages/profile.vue` + `components/profile/**`（9 个）+ `use-profile-flow` + `profile` 模块 | 页面无中文残留；编辑邮箱 / 手机号 / 用户名对话框双语；头像与社交账号可访问名翻译 | M5 |
| M7 | 安全设置文案 | `pages/security.vue` + `session-table` / `two-factor-panel` + `use-security-settings` + `security` 模块 | 2FA / 会话 / 密码区双语；动态列按 locale 格式化 | M6 |
| M8 | OAuth 与授权应用文案 | `oauth/consent` / `oauth/clients` + `use-oauth-consent` / `use-oauth-clients` + `oauth` 模块 | 同意页与授权列表双语；撤销 / 扫描反馈走 `t()`；OAuth 错误提示按语言 | M7 |
| M9 | 首页、静态页与共享壳文案 | `index` / `about` / `privacy` / `terms` + `app-footer` / `feedback-button` / `github-corner` / `demo-mode-banner` + `use-index-flow` / `use-static-page-flow` + `demo` 模块 | 登录入口与静态页双语；Demo 横幅按语言；页脚 / 反馈入口双语 | M8 |
| M10 | §2.10 个人中心 ↔ 授权应用 / 安全设置互联跳转 | 三个页面的入口与返回路径、移动端按钮密度、交互态视觉基线 | 三个子页一步到达、一步返回；桌面 / 移动入口一致；无认证 / 权限变更 | M8 |
| M11 | Admin 用户域文案 | `admin/users` + `components/admin/users/**` + `use-user-management` / `use-user-table` + `admin-users` 模块 | 页与 4 个对话框双语；列头 / 筛选项 / 空态 / Toast 走 `t()` | M10 |
| M12 | Admin OAuth 域文案 | `admin/oauth/applications` + `components/admin/oauth/**` + composable + `admin-oauth` 模块 | 页与 3 个对话框双语；API 文档对话框内容按语言 | M11 |
| M13 | Admin SSO 域文案 | `admin/sso/providers` + `components/admin/sso/**` + 2 个 composable + `admin-sso` 模块 | 页与 5 个组件双语；OIDC / SAML 表单提示按语言 | M12 |
| M14 | Admin 日志域文案 | `admin/logs` + `components/admin/logs/**`（6 个组件）+ `use-logs-management` + `admin-logs` 模块 | 页 / 统计卡 / 表格 / 趋势图双语；筛选与撤销反馈按语言 | M13 |
| M15 | 邮件模板与用户语言偏好 | `User.locale` 列 + `additionalFields` + 8 个邮件方法 + 6 个 MJML + fallback + `email` 模块 | 双语言邮件快照；同步流程请求 locale 优先、异步用户偏好优先；旧用户 `null` 兜底；`migration:check-budget` 通过 | M14 |
| M16 | API 错误面与内容协商 | `createError` 中文清理、错误键映射、`Content-Language` / `Vary` 扩展、`server-only` 模块 | 双语言 API 错误测试；响应头断言；未识别 locale 回退默认 | M15 |
| M17 | 治理清理与双语回归 | 重复 / 未用键清理、allowlist 收紧、Demo 数据 locale、核心页 `en-US` 视觉基线、覆盖率 | 四条 i18n 门禁全绿；核心路径双语视觉通过；未用键有据或清零 | M16 |
| M18 | SEO 与 `en-US` 升 `seo-ready` | sitemap / robots / hreflang / canonical / `og:locale`、Registry 就绪度升级 | 只对 `seo-ready` 输出 alternates；sitemap 含双语 URL；`en-US` 可索引；SEO 回归通过 | M17 |
| M19 | 阶段收口与归档 | 包体 / 视觉 / 覆盖率复核、文档同步、收口记录、归档 | 全量门禁通过；`todo.md` 归档；`roadmap` / `backlog` / i18n 文档口径一致 | M1–M18 |

> **拆分规则**：单条超过「10 个文件 / 800 行新增」时按模块或对话框拆条；Admin 域优先按「页面 / 对话框」拆分。条目编号变更须回扫 `todo.md`、`roadmap.md`、本记录与 `.session/`。

## 5. 关键决策与口径

### 5.1 caomei-ui 1.3.0

- **版本事实**（2026-11-14 registry 核验）：1.3.0 新增 `data-motion` 动效轴（缺省 `minimal` 与迁移前逐值等价）、`CaomeiIcon` 与图标注册表、触摸目标扩展、Select 面板内部滚动、Paginator `#report` 插槽、DataTable `autoResetPageIndex`；Calendar / RichTextEditor 边框对比度加深属可见变化。peer 依赖与 1.2.0 一致（`vue ^3.5` / `echarts ^6` / `vue-echarts ^8` / `md-editor-v3 ^7.1` / `@nuxt/kit ^4`），但捆绑的 `reka-ui` 由 2.10.4 升到 2.11.0，需按组件回归 Select / Dialog / DataTable 的指针与键盘行为。
- **升级口径**：动效轴保持默认、不开启 `expressive`；`CaomeiConfigProvider` 由 `app.vue` 挂载，`locale` 直接取 `useI18n().locale`（`zh-CN` / `en-US` 为 caomei 预注册语种）。
- **回归重点**：Select 面板高度上限（长列表 Admin 筛选）、DataTable 分页默认值、Calendar 描边导致的视觉基线漂移。1.3.0 发布仅当日，升级后先跑全量视觉与定向交互，再进入文案批次。

### 5.2 消息模块与加载

- 模块沿用 i18n.md §4：`common` / `errors` / `validation` / `auth` / `profile` / `security` / `oauth` / `sso` / `admin` / `admin-users` / `admin-oauth` / `admin-sso` / `admin-logs` / `demo` / `email` / `server-only`。
- `core`（`common` / `errors` / `validation` / `auth`）首屏加载；其余按路由 / 场景懒加载；服务端与前端共享 `locale-runtime-loader`。
- 服务端仍以 `server/utils/i18n.ts` 为唯一装配点，`useTranslation(event)` 不可用时回落 zh-CN 兜底表。

### 5.3 扫描盲区与基线

- `hardcoded-scan` 扩展为同时扫描 `.vue` 模板段与 `<script setup>` 中的字符串字面量（重点：`columns` / `options` / `roleOptions` 等配置数组）。
- 扩展后基线会**上升**：必须在同批提交说明中写明「新增可见行数 + 原有行数」，禁止把迁移造成的隐性下降当作完成度。
- `columns` / `options` 迁入语言包后，允许 `--update` 收紧基线，但每次收紧都要说明构成。

### 5.4 用户语言与邮件

- `User.locale`：`varchar(16)`、nullable、默认 `null`；旧用户按请求 locale 处理并惰性回填，不阻塞登录。
- 有效语言：同步邮件 = 请求 locale > `User.locale` > 默认；异步邮件 = `User.locale` > 默认。
- 邮件与服务端共享 `email` 模块；MJML 变量走白名单 + 现有 `sanitize-html`，模板输出做双语言快照测试。

### 5.5 Zod 与表单

- 继续使用 per-parse error map；Schema 内不调用 `t()`、不使用全局 `z.config`。
- Admin 表单（`create-provider-dialog` / `create-application-dialog`）不得直接拼接 `issue.message`，统一经 `useValidationMessage` / `t()` 边界翻译。

### 5.6 视觉与测试

- 双语视觉采用「核心页基线 + 全量浏览器抽检」：`login` / `register` / `profile` / `admin/users` 等核心页补 `en-US` 基线，其余页面按批次做浅 / 暗 + 双语言浏览器验证，避免视觉矩阵翻倍。
- 视觉基线更新在 Playwright 1.65 容器内完成；1.3.0 升级与页面批次分开提交，便于归因。

### 5.7 SEO

- sitemap / robots 方案在 M18 开工前按 Search-First 核验（`@nuxtjs/sitemap` 与 `@nuxtjs/i18n@10` 的 alternates 集成）；新增依赖前先确认项目内无等价能力。
- 只对 `seo-ready` 且 `indexable: true` 的语言输出 sitemap / alternates；`ui-ready` 语言不进入索引。

### 5.8 §2.10 口径

- 只调整入口与返回路径，不改认证流程、权限模型或页面结构；移动端保持与桌面一致的入口顺序。
- 需要补交互态视觉基线（返回入口、按钮分组），并在浅 / 暗 + 双语言下验证。

## 6. 验收标准

- [ ] 18 个页面与 `components/**`、`composables/**` 的用户可见文案全部走语言包；allowlist 外无中文硬编码。
- [ ] `pnpm i18n:check`、`lint:i18n`、`test:i18n`、`i18n:audit:duplicates` 全部通过；key parity 100%。
- [ ] `zh-CN` / `en-US` 切换后路由前缀、cookie、`html lang`、`og:locale` 一致；刷新与直达 URL 保持语言。
- [ ] 表单校验、Toast / Confirm、API 错误按请求语言显示；本地化 API 返回 `Content-Language` 与 `Vary`。
- [ ] 8 个邮件方法与 6 个 MJML 支持双语；`User.locale` 生效；旧用户 `null` 不报错。
- [ ] 组件库内建文案跟随应用语言（含 Select 空态、Paginator、DataTable 空态、Toast / Confirm 默认按钮）。
- [ ] 核心页有 `en-US` 视觉基线；全部页面完成浅 / 暗 + 双语言浏览器验证。
- [ ] `en-US` 升为 `seo-ready`、`indexable: true`；sitemap / hreflang / canonical 输出正确。
- [ ] §2.10：三个子页一步到达、一步返回，移动端入口一致。
- [ ] 质量门：`lint` 0 error、`lint:css`、`typecheck`、`test`、`build`、`test:visual`、`migration:check-budget`、`i18n:check`、`ai:check` 全绿；包体无不可解释跃升。
- [ ] 文档同步：`docs/standards/i18n.md`、开发规范、README（如涉及）、`.session/`。

## 7. 风险与缓解

| # | 风险 | 影响 | 缓解 |
| :-: | :--- | :--- | :--- |
| 1 | 首屏体积膨胀 | 性能回退 | core 模块最小化 + 路由懒加载；每批复测入口 JS / 总 JS，异常即回退模块边界 |
| 2 | SSR / hydration 语言不一致 | 首帧闪烁、SEO 错误 | detector 与 Registry 单一来源；路由前缀 + cookie 写入同步；`networkidle` 后再断言 |
| 3 | 路由前缀影响守卫 | 登录跳转丢语言 / 白名单失效 | 统一 `stripLocalePrefix` + `localePath`；补守卫单测 |
| 4 | `User.locale` 迁移 | 旧库失败 / 数据不一致 | nullable + 默认 `null`；`migration:check-budget`；旧用户惰性回填 |
| 5 | 邮件模板转义 / 变量注入 | 渲染错误或 XSS | 变量白名单 + `sanitize-html`；双语言快照测试 |
| 6 | caomei-ui 1.3.0 回归 | 视觉 / 交互漂移 | 独立提交；默认动效轴不变；受影响基线重采 + Select / DataTable 定向交互 |
| 7 | 扫描盲区导致「完成度虚高」 | Admin 文案遗漏 | M3 先修扫描面再迁移；每批写明基线构成 |
| 8 | 文案量大、易漏 | 部分页面残留中文 | 按路由批次提交；每批浏览器验证；`lint:i18n` 阻断新增裸写 |
| 9 | Demo / 假数据中文 | 英文界面出现中文数据 | `demo` 模块 + 生成器接受 locale；无法覆盖时明确登记仅 zh-CN |
| 10 | 视觉矩阵翻倍 | CI 时长与维护成本 | 只对核心页建 `en-US` 基线，其余抽检 |

## 8. 检查点与容量控制

- **M14 完成后检查点**：复核包体、覆盖率、视觉数量与剩余 M15–M19 工作量；若明显超出单阶段容量，由用户决定是否将邮件 / API / SEO 拆为后续阶段，**不得自行降级或预写完成态**。
- 每批遵循「参考态（如需）→ 实现 → 归因 → 自基线 → 文档 → 单次提交」，Review Gate 放行后再进入下一批。

## 9. 关联文档

- 规划：[roadmap.md](../../plan/roadmap.md)｜[todo.md](../../plan/todo.md)｜[backlog.md](../../plan/backlog.md)｜[规划规范](../../standards/planning.md)
- i18n：[国际化实施方案](../../standards/i18n.md)｜[i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md)｜[i18n 技术验证](./2026-11-05-i18n-verification.md)
- 阶段：[阶段 4 收口记录](./2026-11-14-phase4-closure.md)｜[阶段 3 收口记录](./2026-11-09-phase3-closure.md)
- 规范：[开发规范](../../standards/development.md)｜[API 规范](../../standards/api.md)｜[测试规范](../../standards/testing.md)｜[文档规范](../../standards/documentation.md)
