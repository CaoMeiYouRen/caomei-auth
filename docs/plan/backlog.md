# 产品 backlog（待办池）

> **状态**：阶段 11「2FA 覆盖收紧与登录通道闭环」已于 2026-11-21 收口（见 [阶段正文](./archive/todo-archive-phases-11.md) 与 [收口记录](../design/governance/2026-11-21-phase11-closure.md)）；当前无进行中阶段。本表只保留**尚未进入阶段**的候选与未完成项汇总。
> 准入、流转与归档规则见 [规划规范](../standards/planning.md)；阶段方向见 [roadmap.md](./roadmap.md)。

---

## 1. 专项子规划

暂无独立子规划候选。

---

## 2. 功能性需求（Feature Backlog）

> 小节编号沿用历史：2.1 已随阶段 4（caomei-ui 迁移）交付、2.10 已随阶段 5 M10 交付，2.2 / 2.3 / 2.5 / 2.6 已上收阶段 6，编号不连续属预期。

### 2.4 Admin 日志登录事件与热力图

- **登录事件日志**：新增登录事件数据源（事件类型、结果、IP、UA），支撑按事件类型筛选与合规审计；需评估写入成本、保留期与索引。当前仅有 Session 实体，无事件表。
- **热力图**：按时间 × 事件类型的分布可视化（趋势图已交付，不再保留）。
- 独立 IP 精确筛选与统计联动已作为阶段 6 M16 上收；事件类型维度因无数据源未纳入本阶段。
- **迁入来源**：既有 backlog「Admin 日志可视化」与阶段 6 范围裁定（2026-11-16 用户确认收窄 M16）。

### 2.7 开发者生态（长期方向）

- **轻量化 SDK（Web）**：提供 `auth-client` npm 包，封装登录 / 注册 / OAuth 流程，开箱即用。
- **轻量化 SDK（Node.js）**：服务端专用 SDK，支持 Headless 认证与 Token 管理。
- **文档中心自动化**：Swagger / OpenAPI 在线调试，API Playground。
- **插件 / 钩子系统**：在认证关键节点（`beforeAuth`、`afterLogin`、`beforeSessionCreate`）注入自定义逻辑。
- **社交登录扩展**：飞书、企业微信、钉钉（国内办公场景）。

### 2.8 安全增强（长期方向）

- **风险管控体系**：基于地理位置、设备指纹的登录风险评分与拦截。
- **安全告警系统**：异地登录、高频失败、异常 IP 的实时告警（邮件 / 钉钉 / 飞书）。
- **高级审计日志**：企业级合规审计日志导出（CSV / JSON），满足 SOC2 / ISO27001 要求。

### 2.9 企业级特性（长期方向）

- **多租户 SaaS**：单实例支持管理多个独立组织租户，租户数据隔离。
- **组织 / 部门管理**：多级组织架构、角色委派、权限矩阵。
- **LDAP / AD 集成**：与传统企业目录服务对接，支持同步企业用户。

### 2.11 邮件链接重置（可选通道）

- **现状**：密码重置统一走验证码（邮箱 6 位码 300 秒 / 3 次尝试，短信同规格，均带 captcha 与 3 次/分限流）；`emailAndPassword.sendResetPassword` 已移除，`POST /api/auth/request-password-reset` 返回 `400 RESET_PASSWORD_DISABLED`，`/reset-password` 的白名单、限流与语言模块规则一并通过（2026-11-15，阶段 5 M5）。
- **重启条件**：出现「换设备 / 邮件客户端内一键完成」的明确需求，或外部集成方要求链接式重置；验证码通道仍保留，作为并列选项而非替代。
- **实现要点**：
    1. 恢复 `sendResetPassword` 回调与 `sendPasswordResetEmail` 模板（M15 后需按用户语言渲染两套邮件）。
    2. 新增 `/reset-password/[token]` 页面：路由 params 取 token，表单复用 `resetPasswordFormSchema`，提交 `authClient.resetPassword({ newPassword, token })`；过期 / 无效 token 给出独立提示。
    3. 客户端白名单 `middleware/auth.global.ts` 目前是 `pathname === path`，需改为前缀匹配（或新增 `publicPathPrefixes`），否则带 token 的路径会被拦到登录页；服务端中间件已是 `startsWith`。
    4. token 不随 GET 消费（`GET /api/auth/reset-password/:token` 只重定向），页面必须用 POST 消费，避免企业邮件网关预取把 token 用掉。
    5. 安全加固：`emailOTP.storeOTP` 切 `hashed`、`rateLimit.storage` 接 Redis（多实例下内存存储按实例计数）、重置成功后强制下线该用户全部会话。
    6. 补 i18n 键（`auth.resetPassword.*`）、视觉基线与单测（无效 token / 过期 / 弱密码 / 成功跳转）。
- **迁入来源**：阶段 5 M5 决策记录（2026-11-15 用户确认「验证码已足够，先下线邮件链接」）。

### 2.12 账号找回（阶段 2–5 剩余部分）

- **已完成（2026-11-20，阶段 9）**：设计草案「阶段 0 + 阶段 1」已交付——结构化审计、假通道修复（短信重置 / 备份码再生成 / 2FA 邮件 OTP 回落 / 改绑与撤销会话错误检查）、管理员协助恢复（发起改绑 → 新通道确认 → 强制重置密码；不触碰 2FA / 备份码，D9）。记录见 [阶段 9 收口](../design/governance/2026-11-20-phase9-closure.md)。
- **已完成（2026-11-21，阶段 10）**：恢复码（与备份码分离）、已验证手机作为自助恢复证明、改邮箱冷静期与撤销、OAuth-only 受控自助设置密码；D1 / D2 / D3 / D5 / D6 / D7 / D10 已落地，见 [阶段正文](./archive/todo-archive-phases-10.md) 与 [范围登记](../design/governance/2026-11-21-phase10-registration.md)。
- **已上收（2026-11-21，阶段 11，进行中）**：设计草案阶段 4「收紧 2FA 覆盖」——邮箱 OTP / 手机 OTP / 邮箱验证码 / 邮箱验证链接自动登录 / 魔法链接 / 社交（内置 / genericOAuth / `idToken`）/ SSO（OIDC 共享与专属回调、SAML ACS）在 2FA 开启后要求第二因子；范围与拟定决策见 [阶段 11 范围登记](../design/governance/2026-11-21-phase11-registration.md)。
- **剩余方向**：设计阶段 2 剩余的管理员协助恢复审批流与工单；设计阶段 5 的审计表与管理端审计检索、可信设备列表与吊销、passkey / 硬件密钥；关闭 2FA 要求第二因子（D15，阶段 11 明确不做）。
- **阶段 11 迁入（未完成）**：2FA 用户会话撤销脚本——当前只提供 SQL 口径（`DELETE FROM session WHERE userId IN (SELECT id FROM user WHERE twoFactorEnabled = 1)`），需补 dry-run / `--confirm` 的多方言脚本。
- **准入条件**：审批流与审计检索需用户另行授权；关闭 2FA 门槛变更须在阶段 11 收口后单独评估（避免与覆盖收紧叠加扩大「同时丢失因子」的死锁面）。
- **明确不做**：管理员重置 2FA / 备份码（D4）、管理员代设密码（D8）保持不允许。
- **迁入来源**：2026-11-18 用户提出的邮箱封禁找回问题与专项分析；外部参照见 [调研](../design/governance/2026-11-18-account-recovery-research.md)。

---

## 3. 技术债务（Tech Debt）

### 3.1 安全与合规

- **`docker-publish` 重建路径纳入安全告警门禁**：`mode=build` 会重新构建并推送生产镜像，但目前未执行 `scripts/security/check-alerts.mjs`；`retag` 复用已构建镜像，可按现状处理。待评估后决定是否在 `mode=build` 前增加 gate。
- **上游未修复依赖告警跟进**：`braces`（GHSA-vfj7-8cjw-p6xm，需 ≥3.0.4，lock 仍为 3.0.3）暂无已发布补丁版本，仅存在于构建 / 开发工具链；待上游发版后升级并复查 `pnpm audit`。`node-forge` 已升至 1.4.3（满足 GHSA-86w9-cpqp-85rv 的 ≥1.4.1），从本条移除。
- **迁入来源**：既有 backlog「上游未修复依赖告警跟进」与原 `todo.md`「低优先级 · 安全审计工具集成」（安全审计已由 `.github/workflows/security-auto-fix.yml` 每日巡检 + Dependabot 落地，不再作为候选）。

### 3.2 质量与测试

- **改绑确认页视觉基线**：`/channel-change/[id]` 新增页面只做了浏览器功能验证，尚无桌面 / 移动 / 暗色自基线；待评估与认证页矩阵（390 / 768 / 1024）一并补采。
- **Spug 短信通知能力**：Spug 渠道只支持模板变量，无法发送任意变更通知文本；手机改绑的旧通道通知在 Spug 下会记录 `sms-provider-does-not-support-notification`。如需覆盖自建 Spug 部署，需在模板平台新增通知模板或改用支持自由文本的渠道。


- **测试覆盖率长期达标**：核心逻辑 Lines 覆盖率长期目标 ≥ 60%，2026-11-05 基线（75.95%）已达到；2026-11-06 阶段 2 复测 Statements 78.26% / Lines 78.49%，后续关注 `pages`（34.92%）与 `plugins`（25.00%）等未覆盖区域，不再以全局数字作为阶段门槛。
    - 阶段 2 按范围设下限并全部达标：`server/api` ≥95%（95.94%）、`composables` ≥80%（84.35%）、`components/base` ≥75%（90.11%），全局不跌破 75.74%。
    - 详见 [测试规范](../standards/testing.md)。
- **非 Admin 流程 better-auth 失败静默**：`use-change-password-flow`（修改密码成功提示）、`edit-email-dialog`（修改邮箱）、`use-security-settings`（撤销 / 退出其他会话）、`use-profile-flow`（登出）仍只 `catch` 抛错路径，4xx/5xx 的 `{ error }` 不校验，会提示成功或静默。处理方向：复用 `utils/shared/api-error.ts` 的 `throwIfAuthError`，逐流程补失败 Toast 与单测；M5 只覆盖 Admin 面。
- **Admin composable 泛型化**：`useDataTable<any>` 与 `selectedUsers: any[]` 收紧为 `AdminUser` / 表格行泛型，去掉 `pages/admin/users.vue` 的 `users.value as AdminUser[]` 断言（`use-application-management` 与 OAuth 页面已在 M5 完成泛型化，可作参照）。
- **caomei-ui DataTable 分页 / 排序能力补齐**：1.2.0 的 `CaomeiDataTable` 未透出 `CaomeiPaginator` 的 `showEdges`（迁移后首 / 末页按钮消失），且 `lazy` 只映射 `manualPagination`、未关闭客户端排序（未透出 `manualSorting`，当前页数据会被二次排序）。影响 `/admin/users`（M2）、`/admin/oauth/applications`（M4）与 `/admin/sso/providers`（M6）；`CaomeiDataTable` 的受控排序也不支持清除（空排序事件被忽略）。处理方向：向上游提能力需求，或明确接受并写入口径；不在页面内做临时绕过。
- **国际化 10 语内容扩展**：阶段 8 只启用 5 语（zh-CN / en-US / zh-TW / ja-JP / ko-KR），es-ES / fr-FR / de-DE / ru-RU / pt-BR 仅登记在 Registry 且 `enabled=false`；后续按 5 语批次复用同一翻译 / 校验流程后再启用。
- **新语言母语审校与 seo-ready 升级**：zh-TW / ja-JP / ko-KR 本阶段为机器翻译 draft + `ui-ready`（不索引）；母语审校、术语确认与核心页视觉抽检后逐语言升级 `seo-ready` 并进入 sitemap / hreflang。
- **未启用语言的语言包缺少同构门禁**：`i18n:check` 的 parity 校验、`tests/i18n/message-catalog.spec.ts` 与 `scripts/i18n` 审计都只遍历 `ENABLED_LOCALES`，仍停用的 es-ES / fr-FR / de-DE / ru-RU / pt-BR 在补数据期间即使键缺失或占位符错位也不会红灯（zh-TW / ja-JP / ko-KR 的早期批次只能靠临时脚本把关）。处理方向：`check-locale-parity.mjs` 支持按目录遍历的非启用语言断言，或补一条「目录级键 + 占位符同构」校验（阶段 8 收口时未实施，待后续阶段评估）。
- **未启用语言的懒加载语言包进入客户端产物**：`locale-runtime-loader` 的 `import.meta.glob` 只排除 core / server 模块，不按 `ENABLED_LOCALES` 过滤，构建产物已包含 `locales/ja-JP/static`（约 10 KB 不可达 chunk），ko-KR 分批交付期间会继续累积。处理方向：按 Registry 过滤 glob，或明确接受该体积并写入口径（阶段 8 收口时只记录体积，未做过滤）。
- **`message-catalog` 内容断言覆盖范围待确认**：`tests/i18n/message-catalog.spec.ts` 用 `import.meta.glob` 读语言包；一次实测（`npx vitest run tests/i18n/kana-debug.spec.ts`，主配置 + Nuxt 环境）取到的是带 `type/start/end` 位置元数据的结构（`app.name` → `{type:'0',start:0,end:7}`，flatten 后 10185 条），内容类断言会静默失效；复核未复现（同配置下取到真实文案）。现状：内容类断言已改为 `readFileSync` 读原始 JSON（阶段 8 M8）；仍需确定稳定 repro（配置 / 版本 / 启动目录）后再决定是否把该文件从主配置 `include` 排除。
- **译文台账无消费方**：`i18n/translation-provenance.json` 的 `reviewLevel` / `nativeReview` / `reviewedModules` 目前没有脚本或测试引用，「译文批次必须同步更新」靠人工自觉，`readiness` 也需手动与 Registry 对齐（zh-TW 已在 M5 同步为 `ui-ready`）。处理方向：补一条治理脚本或单测，断言模块名 ⊆ `LOCALE_MESSAGE_MODULES`、`reviewedModules ∪ pendingModules` 覆盖全集、`readiness` 与 Registry 一致。
- **多语言内部链接缺 `localePath`**：`pages/login.vue` 与 `components/app-footer.vue` 仍有字面 `/register`、`/forgot-password`、`/privacy`、`/terms` 链接，从 `/zh-TW` 或 `/en-US` 页面点击后回落到默认语言（Cookie 有 locale，但非根路径不重定向）。M5 复核确认属既有缺陷、非本阶段引入。处理方向：统一改 `NuxtLinkLocale` 或 `localePath()`，并补多语言链接断言。
- **根路径浏览器语言重定向不识别 `zh-Hant` / `zh-HK`**：`Accept-Language: zh-Hant` / `zh-HK` 首次访问根路径时由 `@nuxtjs/i18n` 自身匹配，落到 zh-CN，与 `matchDetectedLocale` 的别名口径不一致（邮件与服务端协商已落到 zh-TW）。处理方向：接受并写入口径，或补 `zh-HK` / `zh-MO` 别名并评估自定义探测回调。
- **Admin 页面深度覆盖与 pages 分母口径**：当前页面测试只覆盖首页 / 登录页 / 静态页（pages 77.46% 仅统计测试导入的 5 个文件）；补 Admin 页 smoke 测试会加载大量低覆盖模板，把全局从 78.3% 拉到 73%（低于阶段 6 基线），故未纳入阶段 7。处理方向：为 Admin 页按交互深度补测（表格选择 / 筛选 / 对话框流程），达标后再纳入覆盖率分母，并同步评估 `coverage.include`。
- **覆盖率模块下限自动化校验**：`pages` ≥ 40% / `plugins` ≥ 40% 与全局非回归基线目前只写规范，CI 不阻断；Vitest 4 移除 `coverage.all` 后报告只统计被测试导入的文件，数字回落无人发现。评估用 `coverage.thresholds`（glob）或脚本读取 `coverage-final.json` 做门禁。
- **移动端安全页会话表逐字折行**：`session-table` 的 6 列 `flex: 1` + `word-break: break-all` + 100 px 固定操作列，在 390 px 视口下每列只剩约 12 px（掩码盒 12×116 即证据），日期换 locale 只把折行从 19 行降到 18 行。处理方向：移动端改为卡片式会话项，随本条移动端布局改造落地。
- **stylelint 18 规则补位**：`stylelint-config-cmyr@1.1.0` 为兼容 SCSS 变量关闭了 `value-no-invalid`（实测现有样式 21 条误报），取值拼写错误暂时不再被拦截；待上游支持 SCSS 变量值后恢复。同配置的 `stylelint-config-recommended-scss@17.0.1` peer 仍为 `stylelint ^17`，需上游升 `^18` 才与 stylelint 18 正式对齐。
- **视觉平板矩阵扩展**：阶段 7 只覆盖 login / register / profile / admin-users / admin-logs 的 768×1024；`/security`、`/change-password` 等核心认证页与横向溢出断言的全矩阵化待评估 CI 时长后补。
- **视觉矩阵补 1024 横向宽度**：阶段 7 只新增 768×1024 平板基线；1024 横向（小桌面 / 横屏平板）无回归保护，待评估 CI 时长后补。
- **新增语言视觉矩阵只覆盖桌面 1440**：阶段 8 为 zh-TW / ja-JP / ko-KR 只采登录 + 个人中心（浅 / 暗）共 12 张，移动 390 与平板 768 未覆盖；韩文文案比中文长约 20%，窄屏换行风险未纳入像素保护，待评估 CI 时长后补。
- **视觉基线对「低于阈值的纯色漂移」无感**：`visualExpect` 的 `threshold: 0.2` 允许单像素 YIQ delta ≤ 1,408.6，`#18181b` → `#1e1e1e` 的 delta 只有 16.6，逐像素判等，`maxDiffPixels: 200` 永不触发。P5-1（f91e6e4）换语言切换器 token 后，暗色基线直到 M4-2 因文案位移被迫重采才暴露。处理方向：为关键 token / 组件计算样式补断言（如 `--admin-surface`、`.language-switcher__trigger` 背景色），或在 token / 主题变更时按「全量暗色基线重采」写入门禁清单；`test:visual:update` 改为 `--update-snapshots=all` 并在报告中打印构建产物 SHA / 提交号，避免增量重采留下混合代基线。
- **视觉预算分级与允许清单**：评估 Admin 数据页（DataTable 密度 / 选择列 / 空态）的 `reader` / `admin` 分档与「区域 + 像素 + 归因 + owner」允许清单；P4-0 暂用统一阈值，避免在迁移期引入双重标准。
- **Admin 对话框视觉矩阵未覆盖内部滚动区**：视觉层只截整页首屏，SSO 创建对话框（900px 宽、内部滚动）的 OIDC / SAML / 属性映射配置段落在首屏之外，M7 迁移后自基线无像素变化，只能靠定向 Playwright 验收。处理方向：在矩阵中为长表单补充「滚动到指定分段后再截图」的交互态，或明确接受并写入口径。
- **caomei-ui FormItem 的必填语义与 label 可点击聚焦**：`CaomeiFormItem` 的 `required` 只渲染 `aria-hidden` 的 `*`，不向控件注入 `required` / `aria-required`；label 是 `<span aria-labelledby>`，点击标签不再聚焦输入框。M2 / M5 / M7 均沿用该约定，属于库级能力缺口。处理方向：向上游提能力需求（或由 FormItem 透传 `required` 语义），在上游补齐后统一评估。
- **2FA / captcha / Toast 视觉覆盖**：为 2FA 弹窗、验证码启用态、提交中 / 提交成功 Toast 补充参考态与自基线；需已启用 2FA 的测试账号与 captcha provider。阶段 3 已登记为环境限制，M6-1 收口时迁入本候选（不再保留阶段编号）。
- **API 参考文档同步**：M2-3 已覆盖 Zod 相关 API 文档；本条目只保留 `/api/admin/sso/providers` 系列补录（i18n 相关文档已在阶段 5 M19 同步）。
- **`AGENTS.md` §7.3.4 提交粒度口径待同步**：规划规范 v1 新增「回填提交 / 阶段收口提交」两类不承载小条目的提交（回填只补表格字段、收口跨多个大条目），`AGENTS.md` §7.3.4 目前只覆盖「规划 / 治理类改动关联 backlog 候选」；修改 AGENTS.md 需用户授权，故先在规范侧按 §7.3.4 口径解释并保留差异。处理方向：取得授权后把两类例外写入 §7.3.4，并与 `git.md` §3 同批对齐。
- **文档站锚点与 GitHub slug 不一致**：文档站（VitePress）对数字开头的标题会补 `_` 前缀、把 `7.3` 归一为 `7-3`（如 `planning.html` 的实际 id 是 `_7-进度表`、`AGENTS.html` 是 `_7-3-提交规范-commit-convention`），而仓库内 30+ 处交叉引用沿用 GitHub slug（`#7-进度表`、`#8-推送策略`），在站点上全部点不到；`ignoreDeadLinks: true` 使 `docs:build` 不会报错。处理方向：统一一种 slug 形式（或给长引用标题加显式 `id`），并补一条比对 `dist` 实际 `id` 的校验脚本；与「规划文档机检」候选合并实施更划算。
- **`lib/auth.ts` 能力拆分**：注册准入校验已抽到 `server/utils/registration-guard.ts`（2026-11-21，CI 文件规模门禁修复），`lib/auth.ts` 由 609 降至 589 行并移出文件规模基线；基线条目原有的拆分计划（session / password / mfa 能力拆到 `lib/auth/` 子模块）随之失去记录位置，在此保留线索。处理方向：按 session / password / mfa 三段拆分，拆分后 `lib/auth.ts` 只保留实例装配。
- **迁入来源**：原 `todo.md`「低优先级 · 文档同步」与既有 backlog 质量类条目。

### 3.3 基础设施

- **注册规则多实例缓存**：规则缓存为进程内 30 秒 TTL，多实例部署时最坏 30 秒内仍按旧规则；如需强一致，引入 Redis 共享缓存并在管理端变更时发布失效。

- **Dependency Cruiser 依赖图**：配置 `depcruise` 验证 `utils/shared` / `server/utils` / `utils/web` 分层约束。
- **SonarQube / Codecov 集成**：接入外部质量平台，持续追踪覆盖率与代码异味趋势。
- **Nx / Turborepo 调研**：评估分模块构建的可行性，提升超大项目构建速度。

### 3.4 UI 与主题

- **Demo 模式语言切换偏移验证**：`data-preset` / GitHub 角标与右上角语言切换共存时的偏移仅在 `NUXT_PUBLIC_DEMO_MODE=true` 下可见，需在 Demo 构建中补一次视觉确认。

---

## 4. 已否决 / 暂缓提案

记录曾被考虑但已否决或无限期延后的条目，避免重复讨论。

| 提案 | 结论 | 原因 |
|------|------|------|
| 使用 Valibot 替代 Zod | 暂缓 | Zod 已有成熟生态和大量迁移成本，暂不考虑替换。 |
| 引入 GraphQL | 否决 | 当前 REST API 复杂度不需要 GraphQL，增加维护负担。 |
| 微服务拆分 | 否决 | 项目规模未达到需要拆分的程度，增加运维复杂度。 |
| WebAuthn / FIDO2 支持 | 计划中 | 已在路线图中，暂无紧急需求排期。 |
| PrimeVue 5.x 升级 | 暂缓 | 先评估组件库迁移到 caomei-ui 的方向；在方向确定前维持 PrimeVue 4.x 锁定，避免跨 major 混装。 |
