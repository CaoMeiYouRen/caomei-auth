# 2026-11-24 阶段 14 范围登记：国际化门禁与前端健壮性

> **状态**：2026-11-24 登记，2026-11-24 用户确认开工（进行中）。§2 的 D33–D42 为拟定口径，随登记生效；如用户改判，开工前同批更新本文件、[todo.md](../../plan/todo.md)、[roadmap.md](../../plan/roadmap.md) 与受影响规范。
> **依据**：[backlog §3.2](../../plan/backlog.md#32-质量与测试)（i18n 门禁 / 视觉矩阵 / 前端错误处理 / 样式门禁）、[backlog §3.4](../../plan/backlog.md#34-ui-与主题)（Admin 日志页 1440 溢出、移动端会话表）、[阶段 13 收口记录](./2026-11-23-phase13-closure.md) §5（未覆盖边界）、[阶段 13 M4.1 复审](../../plan/backlog.md#34-ui-与主题)（1440 溢出候选）。
> **规划模型**：7 大条目 / 15 小条目（[规划规范](../../standards/planning.md) §4 / §7 / §8）；小条目数 15 为建议上限，未再拆阶段的原因是本阶段两主题（i18n 门禁、前端健壮性）均为既有负债清理，单条规模小、互不冲突，拆阶段会额外增加收口开销。

## 1. 目标

- 把 i18n 从「5 语可用」推进到「未启用语言也有门禁」：目录级键 / 占位符同构、产物不打包未启用语言、译文台账有消费方、多语言内部链接不回落默认语言。
- 补齐 i18n 的窄屏与长语言视觉保护，让 ja / ko 的换行与 `nowrap` 契约有像素回归。
- 收敛前端健壮性负债：非 Admin 流程的 4xx/5xx 不再提示成功、Admin composable 去掉 `any` 逃逸、stylelint 覆盖全局样式层。
- 修掉两个具体布局缺陷：`/admin/logs` 在 1440 下页面级横向溢出；移动端安全页会话表逐字折行。
- 不改变认证流程行为、i18n 启用语言集合、后端 API 契约与 2FA / 可信设备语义。
- 登记同批清理 backlog：移除已完成的阶段 9 / 10 / 11 交付摘要与 11 条已上收本阶段的候选（见 §4 范围），backlog 只保留尚未进入阶段的候选。

## 2. 决策记录（拟定，2026-11-24）

| 编号 | 决策 | 结论 | 依据 / 影响 |
| :--- | :--- | :--- | :--- |
| D33 | 未启用语言门禁范围 | `check-locale-parity` 增加「按目录遍历」模式：对 es-ES / fr-FR / de-DE / ru-RU / pt-BR 断言键集合与占位符同构（双向）；目录未创建只输出待建清单，目录一旦创建即进入发布校验，分批补数据用 `--allow-incomplete=<locale>` 白名单临时降级为 warning | 现有 parity / catalog / 审计只遍历 `ENABLED_LOCALES`，未启用语言补数据期可静默缺键；阻塞发布会把补数据变成发布阻塞，故采用「目录级完整性」口径 |
| D34 | 语言包产物过滤 | `locale-runtime-loader` 的 `import.meta.glob` 按 `ENABLED_LOCALES` 过滤静态语言包，core / server 模块不过滤；构建产物保留 core 与已启用语言 | 当前产物含 ja-JP 等不可达 chunk（阶段 8 记录约 10 KB 且会累积）；过滤只影响未启用语言，不改运行时回退 |
| D35 | 译文台账消费方 | 新增治理脚本断言：`reviewedModules ∪ pendingModules ⊆ LOCALE_MESSAGE_MODULES`、`readiness` 与 Registry 一致、`nativeReview` 取值合法；接入 `pnpm i18n:check` | 台账目前无消费方，全靠人工自觉；脚本化后与 `message-catalog` 校验互补 |
| D36 | 多语言内部链接 | 认证页与页脚的字面路径统一改 `localePath()` / `NuxtLinkLocale`，保留原有视觉与文案；补多语言链接断言 | `/zh-TW`、`/en-US` 下点击注册 / 忘记密码 / 隐私 / 条款会回落默认语言，属既有缺陷 |
| D37 | i18n 视觉矩阵扩展 | ja-JP / ko-KR 补 390（移动）与 768（平板）基线，覆盖 register / forgot-password / sso-login；长语言窄容器补 2 条 localized-core 用例，`white-space` 仅在用例证明溢出时恢复 `normal` | 阶段 8 只采 1440 桌面 12 张，韩文比中文长约 20%，窄屏换行与 `nowrap` 无像素保护 |
| D38 | 前端失败处理口径 | 4 条非 Admin 流程（改密码 / 改邮箱 / 安全设置 / 个人资料）统一复用 `throwIfAuthError`，4xx / 5xx 给失败 Toast，不改成功路径与既有文案键；`use-profile-flow` 的登出失败按同一口径 | 现只 `catch` 抛错路径，`{ error }` 响应会提示成功或静默；仅补错误分支，不加新交互 |
| D39 | 类型与样式门禁 | `useDataTable` / 选中集收紧为 `AdminUser` 等具体行类型，去掉断言；`.stylelintignore` 只忽略临时模式，`styles/` 6 个 SCSS 纳入 `pnpm lint:css`；不新增 stylelint 规则 | `any` 逃逸与样式层未检查都是既有缺口；先恢复覆盖，规则调整另行评估 |
| D40 | Admin 日志页 1440 布局 | 统计卡与热力图改为容器内滚动 / 收敛 `min-width`，**不减少热力图 168 桶默认展示**；补 1440 页面级无横向溢出断言，热力图基线恢复常规元素口径 | 阶段 13 以「页面横向滚动归零 + 视口截图」绕开，属临时口径；根因是区块最小宽度超出内容区 |
| D41 | 移动端安全页会话表 | ≤ 768 改为卡片式会话项（掩码 / 设备 / 时间 / 操作竖排），桌面表格不变；补移动端浅 / 暗基线 | 390 下 6 列各约 12px，日期逐字折行；卡片化是唯一可读方案 |
| D42 | 本阶段不做 | 不启用新语言、不改 5 语启用集合；不改后端 API 契约与鉴权；不做 PKCE、登录事件 IP 写入契约、注册规则共享缓存、门禁 artifact / 负向验证（均留在 backlog，另阶段评估）；不做 VitePress 锚点脚本与 AGENTS 治理条目；不改 2FA / 可信设备行为 | 保持阶段聚焦 i18n 与前端健壮性；跨主题条目需要独立授权与验证矩阵 |

## 3. 现状取证（2026-11-24）

| 项 | 事实 | 证据 |
| :--- | :--- | :--- |
| 未启用语言门禁 | `i18n:check` 的 parity / catalog 只遍历 `ENABLED_LOCALES`，es / fr / de / ru / pt 缺键不红灯 | `scripts/i18n/check-locale-parity.mjs`、`tests/i18n/message-catalog.spec.ts` |
| 语言包产物 | `locale-runtime-loader` 只排除 core / server 模块，构建产物含 `locales/ja-JP/static` 等不可达 chunk | `utils/i18n/locale-runtime-loader.ts`（阶段 8 记录约 10 KB 且累积） |
| 译文台账 | `i18n/translation-provenance.json` 的 `reviewLevel` / `nativeReview` / `reviewedModules` 无脚本或测试引用 | `i18n/translation-provenance.json` |
| 多语言内部链接 | `pages/login.vue`、`components/app-footer.vue` 仍有字面 `/register`、`/forgot-password`、`/privacy`、`/terms` | 阶段 8 / 12 M5 复核记录 |
| i18n 视觉矩阵 | localized-core 只覆盖 1440 桌面 12 张；ja / ko 的 register / forgot-password / sso-login 窄屏未覆盖 | `tests/visual/*localized*`、`reference-manifest.json` |
| 非 Admin 失败处理 | 4 个 composable 仅 `catch` 抛错路径，不校验 `{ error }` | `composables/use-change-password-flow.ts`、`use-security-settings.ts`、`composables/{edit-email-dialog,use-profile-flow}` |
| Admin 类型逃逸 | `useDataTable<any>`、`selectedUsers: any[]`、`users.value as AdminUser[]` | `pages/admin/users.vue`、`composables/use-admin-users.ts` |
| 样式门禁 | `.stylelintignore` 的 `_*` 覆盖 `styles/` 全部 6 个 SCSS，`lint:css` 实际只查 `.vue` | `.stylelintignore`、`package.json` |
| Admin 日志页 1440 | 内容区 1160px、统计卡 + 热力图区块约 1400px，页面可横向滚动 | 阶段 13 M4.1 复审与 `admin-logs-light-desktop-default.png` |
| 移动端会话表 | 6 列 `flex: 1` + `word-break: break-all` + 100px 操作列，390 下每列约 12px | `components/security/session-table.vue` |

## 4. 大条目索引

| 大条目 | 名称 | 小条目 | 一句话范围 |
| :--- | :--- | :--- | :--- |
| M1 | i18n 门禁与产物 | 2 | 未启用语言同构门禁、语言包产物过滤 |
| M2 | 台账与多语言链接 | 2 | 台账消费方、内部链接 localePath |
| M3 | i18n 视觉回归 | 2 | ja / ko 窄屏基线、长语言窄容器用例 |
| M4 | 前端健壮性与样式门禁 | 3 | 失败处理、Admin 泛型化、stylelint 覆盖 |
| M5 | Admin 日志页 1440 布局 | 2 | 宽度收敛 / 容器内滚动、无溢出断言与基线 |
| M6 | 移动端安全页会话表 | 2 | 卡片式改造、移动端基线 |
| M7 | 文档与阶段收口 | 2 | 口径同步与全量门禁、归档 |

条目明细（8 要素与 4 项字段）见 [todo.md](../../plan/todo.md)。

## 5. 容量基线

- **commits 15–20 / files 45–60 / 行 1,500–2,200**（小条目默认各 1 次提交，收口提交另计；行 = diff 改动量含删除；测量方 = 规划角色，依据阶段 12 / 13 同类条目的实际规模）。
- 类型：🧪 M1 / M2 / M3 / M4，🛠️ M4 / M5 / M6，🎨 M3 / M5 / M6，🛡️ 随 M4。
- 小条目 15 条，每条 ≤10 文件 / 800 行新增；超出即拆。

## 6. 执行顺序

M1 → M2 → M3 → M4 → M5 → M6 → M7。

先补门禁再动产物（M1），避免过滤后缺键无人发现；M3 视觉在 i18n 内容稳定后再采；M5 / M6 布局改动最后做，避免与前端错误处理改动互相干扰视觉基线。

## 7. 不做什么

- 不启用 es-ES / fr-FR / de-DE / ru-RU / pt-BR，也不调整 5 语启用集合。
- 不改后端 API 契约、鉴权、事件模型、2FA / 可信设备语义。
- 不做 PKCE 可配置化、登录事件 IP 写入契约、注册规则共享缓存、发布门禁 artifact / 负向验证（留在 backlog）。
- 不做 VitePress 锚点校验脚本、AGENTS.md 治理条目（需用户授权，留在 backlog）。
- 不改 stylelint 规则集与 caomei-ui 版本。

## 8. 风险与缓解

| 风险 | 缓解 |
| :--- | :--- |
| 未启用语言同构门禁因补齐缺失直接红灯 | 首轮先记录缺失清单，再按批次补齐；门禁只断言「目录完整」，不阻塞 5 语发布 |
| 语言包过滤后遗漏运行时回退 | 保留 core / server 模块与回退语言；构建后核对产物与 `enabled=false` 目录不一致即失败 |
| 视觉矩阵扩展拉长 CI | 只加 2 语言 × 2 视口 × 3 页（12 张）+ 2 条 localized-core，控制在现有 154 张的 +10% 内 |
| 失败 Toast 改动触碰成功路径 | 只改错误分支，成功分支与文案键不变；逐流程补单测 |
| 1440 布局收敛改变热力图观感 | 不改 168 桶与色阶，只改容器滚动 / 最小宽度；先出对照截图再定 |
| 移动端卡片化影响桌面 | 断点隔离（≤768），桌面表格与既有基线不变 |
