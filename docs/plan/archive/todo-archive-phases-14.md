# 阶段 14 归档：国际化门禁与前端健壮性

> 归档日期：2026-11-26；阶段正文自 [todo.md](../todo.md) 迁入，索引见 [todo-archive.md](../todo-archive.md)，收口记录见 [2026-11-26-phase14-closure](../../design/governance/2026-11-26-phase14-closure.md)。

- **阶段**：阶段 14「国际化门禁与前端健壮性」/ 2026-11-24 登记 → 2026-11-26 收口
- **大条目**：M1 i18n 门禁与产物（已闭环） / M2 台账与多语言链接（已闭环） / M3 i18n 视觉回归（已闭环） / M4 前端健壮性与样式门禁（已闭环） / M5 Admin 日志页 1440 布局（已闭环） / M6 移动端安全页会话表（已闭环） / M7 文档与阶段收口（已闭环） / M8 验证码可选配置修复（插队，已闭环）
- **提交清单**：M1 `35c03b2`、`b418af7`；M2 `b18323e`、`e6dda59`；M3 `044ed57`、`33cc218`；M4 `5937a4e`、`0d12400`、`711acad`；M5 `5b6d690`；M6 `47e12c6`；M7 `b918e53`、`8b24d7a`（M7.2 为阶段收口提交）；M8 `2debcf2`
- **质量门**：`lint`（0 error / 27 既有 warning）/ `lint:css` / `lint:md:check` / `typecheck` / `test`（218 文件 / 1565 用例）/ `test:coverage`（Statements 78.84% / Branch 65.89% / Functions 72.56% / Lines 79.04%）/ `i18n:check`（29 用例）/ `ai:check` / `planning:check` / `quality:file-size` / `lint:duplicate`（3.77%）/ `migration:check-imports` / `migration:check-budget`（入口 CSS 405,196 B / +1.37%）/ `build`（56.9 MB / 13.6 MB gzip）/ `docs:build` / `test:visual`（173 用例 / 165 张自基线）/ `security:alerts`（1 个已豁免 high）全绿
- **Review Gate**：M1.1 R1 Reject → R2 Reject → R3 Pass → R4 Reject → R5 Pass；M1.2 R1 Pass → R2 Pass；M2.1 R1 Reject → R2 Pass；M2.2 R1 Reject → R2 Reject → R3 Pass；M3.1 R1 Pass；M3.2 R1 Pass → R2 Pass；M4.1 R1 Pass；M4.2 R1 Pass；M4.3 R1 Pass；M5.1 R1 Reject → R2 Pass；M5.2 R1 Reject → R2 Pass；M6.1 R1 Reject → R2 Pass；M6.2 R1 Reject → R2 Pass；M7.1 R1 Reject → R2 Pass；M7.2 R1 Reject → R2 Pass；M8.1 R1 Reject → R2 Reject → R3 Pass
- **未覆盖边界**：窄屏基线按 D44 只采 12 张（390 浅色 / 768 暗色，每视口不重复双主题），完整 24 矩阵未采；`/sso-login` 暗色主题缺失，暗色基线呈现浅色内容 + 暗色页脚，已登记 backlog §3.4；移动端安全页卡片仅有 zh-CN 元素基线；M3.2 的 360 用例以几何断言与组件截断契约覆盖长文案，未做注入超长文案；验证码自定义端点（change-email / 自定义 send-otp）服务端仍未校验 `x-captcha-response`，配置部分缺失的服务端注册缺口见 backlog §3.1；本地门禁通过，推送与 CI 由维护者执行。

---

## 阶段 14：国际化门禁与前端健壮性（2026-11-24 登记 → 2026-11-26 收口）

_目标：把 i18n 从「5 语可用」推进到「未启用语言也有门禁」，并收敛前端错误处理、类型逃逸、样式门禁与两处具体布局缺陷。_

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 i18n 门禁与产物 | 2/2 | 已闭环 | `35c03b2`、`b418af7` | R5 Pass（M1.1 R1 Reject → R2 Reject → R3 Pass → R4 Reject → R5 Pass；M1.2 R1 Pass → R2 Pass） | 2 → 2 commits |
| M2 台账与多语言链接 | 2/2 | 已闭环 | `b18323e`、`e6dda59` | R3 Pass（M2.1 R1 Reject → R2 Pass；M2.2 R1 Reject → R2 Reject → R3 Pass） | 2 → 2 commits |
| M3 i18n 视觉回归 | 2/2 | 已闭环 | `044ed57`、`33cc218` | R2 Pass（M3.1 R1 Pass；M3.2 R1 Pass → R2 Pass，W01/W02 已补） | 2 → 2 commits |
| M4 前端健壮性与样式门禁 | 3/3 | 已闭环 | `5937a4e`、`0d12400`、`711acad` | R1 Pass（标准审计：W01 lint:css 覆盖与 W02 安全设置失败用例已补，W03 按条目拆分提交，W04 视觉 154 张通过） | 3 → 3 commits |
| M5 Admin 日志页 1440 布局 | 2/2 | 已闭环 | `5b6d690` | R2 Pass（R1 Reject：769–1240 窄桌面筛选控件被裁切 → 筛选行换行修复 + 1024 裁切守卫） | 2 → 1 commit |
| M6 移动端安全页会话表 | 2/2 | 已闭环 | `47e12c6` | R2 Pass（R1 Reject：暗色边框误用浅色 token → 改用 `$dark-border-color` 并重采基线） | 2 → 1 commit |
| M7 文档与阶段收口 | 2/2 | 已闭环 | `b918e53`、`8b24d7a` | R2 Pass（M7.1 R1 Reject → R2 Pass；M7.2 R1 Reject → R2 Pass） | 2 → 1 commit |
| M8 验证码可选配置修复（插队） | 1/1 | 已闭环 | `2debcf2` | R3 Pass（R1 Reject：浏览器侧启用判定恒 false → 改用运行时配置；R2 Reject：换邮箱缺两态浏览器验证 → 已补） | 1 → 1 commit |

- **执行顺序**：M1 → M2 → M3 → M4 → M5 → M6 → M8 → M7（M8 为 2026-11-25 用户授权插入的功能回归热修，优先于收口；M3 按 D44 采 12 张口径）。
- **容量说明**：插入 M8 后为 8 大条目 / 16 小条目。8 为大条目上限、16 超过小条目建议上限 15；M8 只有 1 条、约 2–4 文件 / 80 行，且与 M4 前端健壮性同主题，拆阶段会额外增加收口开销，故不拆。
- **不做范围**：不启用新语言、不改 API / 鉴权 / 2FA 语义、不做 PKCE 与登录事件写入契约、不做门禁 artifact 与 AGENTS 治理条目（详见 [登记记录 §7](../../design/governance/2026-11-24-phase14-registration.md#7-不做什么)）。

### M1 i18n 门禁与产物

- **目标**: 让未启用语言也有目录级完整性门禁，并阻止未启用语言包进入客户端产物。
- **优先级**: P1（i18n 数据与产物的基础门禁）。
- **范围**: `scripts/i18n/check-locale-parity.mjs`、`utils/i18n/locale-runtime-loader.ts`、`package.json` 脚本与单测。
- **验收标准**: 未启用语言目录未创建时输出待建清单，目录创建后键集合与占位符同构断言可通过；`pnpm i18n:check` 覆盖该断言；构建产物不含 `enabled=false` 的静态语言包 chunk，core / server 模块与回退语言保留；既有 5 语门禁与运行时回退不变。
- **不做什么**: 不启用新语言；不改语言包内容结构；不改运行时语言协商。
- **依赖**: 无。
- **交付物**: 门禁脚本扩展、产物过滤、单测、口径说明。
- **风险与缓解**: 补数据期缺键直接红灯 → 目录创建即进入发布校验，分批补数据用 `--allow-incomplete=<locale>` 白名单临时降级并登记；过滤误删 → 产物核对 `enabled=false` 目录与 core / server 白名单。

#### M1.1 未启用语言同构门禁

- **目标**: `check-locale-parity` 支持按目录遍历，断言未启用语言的键与占位符同构。
- **验收标准**: 未启用语言目录存在时给出文件 / 键 / 占位符差异清单（以临时目录冒烟验证，分批补数据可用 `--allow-incomplete` 白名单）；目录未创建时只输出待建清单；`pnpm i18n:check` 与 `tests/i18n` 均覆盖；保留 `ENABLED_LOCALES` 既有断言并新增占位符校验。
- **交付物**: `scripts/i18n/check-locale-parity.mjs`、单测、`docs/standards/i18n.md` 口径。
- **依赖**: 无。

#### M1.2 语言包产物过滤

- **目标**: 语言包 `import.meta.glob` 按 `ENABLED_LOCALES` 过滤静态包。
- **验收标准**: 构建产物不含未启用语言静态 chunk；核心 / 服务端模块与回退语言保留；体积变化记录到收口记录；单测断言过滤逻辑。
- **交付物**: `utils/i18n/locale-runtime-loader.ts`、单测、构建核对记录。
- **依赖**: M1.1。

### M2 台账与多语言链接

- **目标**: 让译文台账有消费方，并修掉多语言页面内部链接回落默认语言的问题。
- **优先级**: P1（治理可验证性）。
- **范围**: `i18n/translation-provenance.json` 校验脚本、`pages/login.vue`、`components/app-footer.vue` 与相关单测。
- **验收标准**: 台账断言（模块名 ⊆ `LOCALE_MESSAGE_MODULES`、`readiness` 与 Registry 一致、`nativeReview` 取值合法）接入 `pnpm i18n:check`；`/zh-TW`、`/en-US` 下注册 / 忘记密码 / 隐私 / 条款链接保持当前语言；既有文案与视觉不变。
- **不做什么**: 不做母语审校、不改 readiness 实际取值、不改语言切换交互。
- **依赖**: M1。
- **交付物**: 校验脚本、链接改造、单测、文档。
- **风险与缓解**: 台账历史字段不齐 → 先输出差异清单，按最小补齐；`localePath` 改造误伤外链 → 只改站内字面路径并补断言。

#### M2.1 译文台账消费方

- **目标**: 新增台账校验脚本并接入 i18n 门禁。
- **验收标准**: 三类断言全部可执行；异常样例能失败并给出可操作提示；不影响现有 5 语门禁。
- **交付物**: `scripts/i18n/check-translation-provenance.mjs`、单测、`i18n:check` 接线。
- **依赖**: M1.1。

#### M2.2 多语言内部链接 localePath

- **目标**: 登录页与页脚的站内字面路径改为 `localePath()`。
- **验收标准**: 两语言前缀下登录页四条链接与页脚全部站内链接保持当前语言；单测断言生成路径；桌面与移动视觉无变化。
- **交付物**: `pages/login.vue`、`components/app-footer.vue`、单测。
- **依赖**: 无。

### M3 i18n 视觉回归

- **目标**: 为 ja / ko 的窄屏与长语言容器补像素保护（2026-11-26 用户裁定 12 张：2 语言 × 3 页 × 2 视口，390 浅色 / 768 暗色）。
- **优先级**: P2（回归保护）。
- **范围**: localized-core 视觉夹具与基线、长语言按钮容器用例。
- **验收标准**: ja-JP / ko-KR 的 register / forgot-password / sso-login 在 390 浅色与 768 暗色各有基线（共 12 张）；长语言窄容器补 2 条用例，溢出结论写入口径；全量视觉通过。
- **不做什么**: 不扩展其它语言与页面矩阵；不改组件布局（除非用例证明溢出且需要恢复 `white-space: normal`）。
- **依赖**: M1、M2（内容稳定后采集）。
- **交付物**: 视觉用例、基线图片、口径说明。
- **风险与缓解**: 基线数量增长拉长 CI → 只加 12 张；换行差异误判 → 固定文案与时钟，逐张核对归因。

#### M3.1 ja / ko 窄屏基线

- **目标**: 补 2 语言 × 3 页 × 2 视口共 12 张基线（390 浅色 / 768 暗色）。
- **验收标准**: 12 张整页截图入库且全量视觉通过；与 localized-core 的 1440 视口口径不同，按 D44 记录；含页面级无溢出断言。
- **交付物**: 视觉 spec、基线图片。
- **依赖**: M2.2。

#### M3.2 长语言窄容器用例

- **目标**: 复现 ja / ko 在窄容器的按钮换行 / 溢出。
- **验收标准**: 2 条用例（register、sso-login 各 1）断言无横向溢出；如需恢复 `white-space: normal` 则附对照结论，否则记录「无需改动」。
- **交付物**: 视觉 spec、结论记录。
- **依赖**: M3.1。

### M4 前端健壮性与样式门禁

- **目标**: 非 Admin 流程不再把失败当成功，并收敛 Admin 类型逃逸与样式检查缺口。
- **优先级**: P1（用户可见的错误语义与类型安全）。
- **范围**: 4 个 composable 的错误分支、`pages/admin/users.vue` 与 `use-admin-users` 类型、`.stylelintignore` 与 `styles/` 6 个 SCSS。
- **验收标准**: 4 条流程在 4xx / 5xx 下给出失败 Toast，成功路径不变；相关单测覆盖；Admin 无 `any` 逃逸与 `as AdminUser[]` 断言；`pnpm lint:css` 覆盖 `styles/` 且 0 error（不新增规则）。
- **不做什么**: 不改成功文案、不加新交互、不改 stylelint 规则集。
- **依赖**: 无。
- **交付物**: composable 改动、类型收紧、样式门禁配置、单测。
- **风险与缓解**: 错误码语义差异 → 复用 `throwIfAuthError` 既有映射；样式层存量告警 → 只修既有规则命中项，不加规则。

#### M4.1 非 Admin 流程失败处理

- **目标**: 改密码 / 改邮箱 / 安全设置 / 个人资料 4 条流程校验 `{ error }` 并提示失败。
- **验收标准**: 4 条流程在 4xx / 5xx 下显示失败 Toast；成功路径与文案不变；单测覆盖失败分支。
- **交付物**: `composables/use-change-password-flow.ts`、`use-security-settings.ts`、`edit-email-dialog`、`use-profile-flow`、单测。
- **依赖**: 无。

#### M4.2 Admin 类型收紧

- **目标**: `useDataTable` 与选中集使用具体行类型，去掉 `any` 与断言。
- **验收标准**: `pages/admin/users.vue` 无 `any` / `as AdminUser[]`；`pnpm typecheck` 通过；表格行为不变。
- **交付物**: `composables/admin/use-user-management.ts`、`composables/core/use-data-table.ts`、`pages/admin/users.vue`。
- **依赖**: 无。

#### M4.3 stylelint 覆盖全局样式

- **目标**: `styles/` 6 个 SCSS 纳入 `pnpm lint:css`。
- **验收标准**: `.stylelintignore` 不再整体忽略 `_*`；`pnpm lint:css` 对 `styles/` 0 error（或仅余已登记警告）；不改规则集。
- **交付物**: `.stylelintignore`、必要的样式修正、门禁记录。
- **依赖**: 无。

### M5 Admin 日志页 1440 布局

- **目标**: 消除 `/admin/logs` 在 1440 下的页面级横向溢出，并恢复常规热力图基线口径。
- **优先级**: P1（既有布局缺陷）。
- **范围**: 统计卡与热力图区块的宽度约束、1440 视觉断言。
- **验收标准**: 1440 下 `documentElement.scrollWidth - clientWidth ≤ 1`；热力图仍展示 168 桶与 7 类型；热力图 1440 基线恢复元素口径并全量视觉通过。
- **不做什么**: 不减少桶数、不改色阶、不改 1800 / 768 / 390 既有基线。
- **依赖**: M4（样式检查先恢复）。
- **交付物**: 布局改动、视觉 spec 与基线、结论记录。
- **风险与缓解**: 收敛宽度导致单元格过窄 → 改为容器内滚动并保留最小可读宽度；基线漂移 → 单文件重采后全量复核。

#### M5.1 宽度收敛与无溢出

- **目标**: 统计卡 / 热力图改为容器内滚动或收敛最小宽度。
- **验收标准**: 1440 无页面级横向溢出；168 桶完整可滚动查看；其余视口布局不变。
- **交付物**: `layouts/admin.vue`、`components/admin/logs/logs-table.vue`、溢出与裁切断言。
- **依赖**: M4.3。

#### M5.2 1440 基线恢复与回归

- **目标**: 热力图 1440 基线回到元素口径并补页面级无溢出断言。
- **验收标准**: 基线重采后全量视觉通过；断言覆盖页面级溢出为 0。
- **交付物**: `tests/visual/baseline/admin-heatmap.visual.spec.ts`、`admin-logs-layout.visual.spec.ts`、基线、admin 矩阵断言。
- **依赖**: M5.1。

### M6 移动端安全页会话表

- **目标**: 390 下会话表改为可读的卡片式布局。
- **优先级**: P2（移动端可用性）。
- **范围**: `components/security/session-table.vue`、移动端视觉基线。
- **验收标准**: ≤768 为卡片式（设备 / 掩码 / 时间 / 操作竖排），桌面表格不变；390 下无逐字折行；浅 / 暗基线入库。
- **不做什么**: 不改桌面表格列与操作语义；不改会话 API。
- **依赖**: M5（视觉矩阵与布局顺序）。
- **交付物**: 组件改动、视觉 spec、基线。
- **风险与缓解**: 卡片信息密度不足 → 保留现有字段与操作；桌面回归 → 768 以上断点隔离并复核既有基线。

#### M6.1 卡片式会话项

- **目标**: ≤768 渲染卡片式会话项。
- **验收标准**: 390 下四项信息完整、无横向溢出；桌面表格渲染不变。
- **交付物**: `components/security/session-table.vue`、组件测试（如有）。
- **依赖**: 无。

#### M6.2 移动端基线

- **目标**: 安全页 390 浅 / 暗基线。
- **验收标准**: 2 张基线入库且全量视觉通过；与既有安全页基线不冲突。
- **交付物**: 视觉 spec、基线。
- **依赖**: M6.1。

### M7 文档与阶段收口

- **目标**: 同步口径、跑全量门禁并归档阶段 14。
- **优先级**: P1（收口）。
- **范围**: 受影响规范 / 设计文档、门禁记录、归档载体。
- **验收标准**: i18n 门禁、产物过滤、台账、链接、错误处理、样式与布局口径与实现一致；全量门禁与视觉通过；阶段正文迁入归档并更新索引与 roadmap。
- **不做什么**: 不改写历史归档正文；不预写完成态。
- **依赖**: M1–M6。
- **交付物**: 文档、归档分片、收口记录。
- **风险与缓解**: 归档与实现不一致 → 收口前逐条核对验收与证据。

#### M7.1 口径同步与全量门禁

- **目标**: 同步 i18n / 视觉 / 前端错误 / 样式 / 布局口径并跑全量门禁。
- **验收标准**: `docs/standards/i18n.md`、`docs/standards/testing.md`、`docs/design/ui-ux.md` 与实现一致；lint / lint:css / typecheck / test / coverage / i18n / build / visual / docs:build 全绿并记录数字。
- **交付物**: 文档、门禁记录。
- **依赖**: M1–M6。

#### M7.2 归档与收口

- **目标**: 归档阶段 14 并清空 todo。
- **验收标准**: 阶段正文迁入 `todo-archive-phases-14`，索引倒序追加，roadmap 指针与收口记录同步，backlog 清理已上收项。
- **交付物**: 归档分片、索引、roadmap、收口记录。
- **依赖**: M7.1。

### M8 验证码可选配置修复（插队，2026-11-25 授权）

- **目标**: 验证码未启用的部署不再被前端强制要求 token，恢复邮箱注册、邮箱 / 短信验证码登录与更换邮箱。
- **优先级**: P1（功能回归；自部署未配置 CAPTCHA 时相关入口全部不可用）。
- **范围**: `utils/web/captcha.ts` 的可选解析调用方、`composables/use-register-flow.ts`、`use-login-flow.ts`、`use-otp.ts`、`components/profile/dialogs/edit-email-dialog.vue` 与单测。
- **验收标准**: `isCaptchaEnabled() === false` 时 4 条流程可提交且不出现「请先完成验证码验证」；启用验证码时失败分支与错误文案不变；单测同时覆盖启用 / 未启用两种状态；记录一次关闭 CAPTCHA 的定向冒烟结果。
- **不做什么**: 不改 captcha 启用判定与 provider 选择、不改后端插件配置、不改验证码组件 UI、不放宽启用态的失败校验。
- **依赖**: 无（用户 2026-11-25 授权插队，理由：明确功能回归）。
- **交付物**: 4 处调用方修正、单测、验证记录。
- **风险与缓解**: 缺少关闭 CAPTCHA 的部署环境 → 用 `isCaptchaEnabled` mock 单测 + 本地关闭 env 冒烟；误放宽启用态 → 保留启用态的必填与失败断言。

#### M8.1 可选验证码调用方修正

- **目标**: 4 条流程按 `isCaptchaEnabled()` 传入 `isOptional`，未启用时不解析 token。
- **验收标准**: 关闭 CAPTCHA 时注册 / OTP 登录 / 换邮箱可提交且无验证码提示；启用时行为与文案不变；相关单测通过。
- **交付物**: 调用方修正、`tests/unit/composables` 与组件测试、验证记录。
- **依赖**: 无。
