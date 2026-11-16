# 2026-11-16 阶段 6 范围登记：质量门禁补齐、Admin 错误面与体验性能

> **状态**：已授权启动（2026-11-16，用户确认「先 A 后 B」：A 批质量门禁与 Admin 错误面收口，B 批体验与性能）。完成态以 `todo.md` 与 Review Gate 结论为准。
> **单一事实源**：阶段范围、原子条目与验收见本文；执行口径以 [开发规范](../../standards/development.md)、[API 规范](../../standards/api.md)、[国际化实施方案](../../standards/i18n.md)、[测试规范](../../standards/testing.md) 为准；候选详情见 [backlog.md](../../plan/backlog.md)；方向见 [roadmap.md](../../plan/roadmap.md)。
> **前置**：[阶段 5 收口记录](./2026-11-16-phase5-closure.md)（i18n 全量完成，双语门禁在位）；[阶段 5 范围登记](./2026-11-14-phase5-registration.md)。
> **准入规则**：[规划规范](../../standards/planning.md)。

## 1. 阶段目标

1. **关闭质量门禁盲区**：markdown 三级目录可被 `lint:md` 拦截；`i18n:check` 增加「源码 → 语言包」反向键校验，避免缺键直出键名。
2. **Admin 错误面可解释**：统一错误读取链路（`error.data.message` 优先）、修正以 HTTP 200 + body `status` 表达失败的接口、校验错误统一 Zod error map。
3. **Admin 展示口径统一**：日期跟随 locale、`auth.quick` / `auth.quickLogin` 命名空间收敛、对话框关键交互补单测。
4. **体验与性能**：时区偏好（前端展示 + 服务端 / 邮件）、注册控制（名单 + 管理端 + 审计）、Admin 日志 IP 精确筛选与统计联动、热点路径基准与缓存策略、Demo 数据分布增强。

## 2. 范围与非目标

### 2.1 本阶段范围

- **A 批（M1–M8）**：`lint:md` glob、i18n 反向键校验；Admin 错误读取 helper 与 10 处重复定义收敛、OAuth 应用接口错误面、Zod error map；Admin 日期本地化、i18n 命名空间收敛、用户对话框单测。
- **B 批（M10–M17）**：`User.timezone` 与前端展示、服务端 / 邮件时区；注册控制规则与入口、管理端配置与审计；性能基准与索引、缓存策略与回归阈值；Admin 日志 IP 精确筛选与统计联动；Demo 数据分布增强。
- **检查点**：M9（A 批收口）、M18（阶段收口）。

### 2.2 非目标

- 不新增第三语言 / RTL；不改认证流程结构（注册控制只增加准入校验，不替换 better-auth 流程）。
- 不做 UI 改版；除时区选择与注册控制配置外不新增页面结构。
- 不引入 Redis 作为必需依赖；缓存策略评估可给出可选路径，但默认保持 SQLite + 进程内 `lru-cache`。
- 不做 Admin 日志的事件类型维度与热力图：当前只有 Session 实体、无登录事件数据源；事件类型 / 热力图已登记 backlog §2.4，待新数据源规划后另裁。
- 不处理 jscpd 重复率、stylelint 18 升级、视觉矩阵补 768 / 1024、视觉阈值 token 断言、DataTable 上游能力、固定时钟用例改造、`docker-publish` 重建路径 gate、`braces` 升级（均保留 backlog）。
- 不处理企业级特性、开发者生态、安全告警系统等未授权方向。

## 3. 现状取证（2026-11-16 基线）

| 项 | 现状 | 影响 |
| :--- | :--- | :--- |
| `lint:md` 覆盖 | `package.json` 使用 `lint-md *.md docs/**/*.md .github/**/*.md`，未开 `globstar` 时 `docs/**` 等价 `docs/*/*.md`、`.github/**` 等价 `.github/*/*.md`；`docs/design/governance/` 与 `.github/` 三级文件无门禁 | 实测 governance 目录 3 文件 6 处违规（省略号 3 / `space-around-number` 1 / `space-around-alphabet` 1 / 行内代码空格 1）已漂移 |
| i18n 校验方向 | `i18n:check` 覆盖「语言包同构 + 语言包 → 源码未使用键」，无「源码 → 语言包」 | M4-2 的 `auth.quick.fieldPhone` 缺键在全绿下进入生产构建 |
| Admin 错误读取 | `errorMessage(error, fallback)` 全仓 10 份同构定义（4 composable + 6 对话框），只读 `error.message` | ofetch 在 500 时给出 `[GET] "url": 500 ...` 技术串，服务端本地化 `message` 位于 `error.data.message` |
| Admin OAuth 接口 | `server/api/admin/oauth/applications/[id].{put,delete}.ts` 用 body `status: 404/500` 表达失败 | 前端未校验 `success`，失败仍弹成功 Toast |
| Admin 校验错误 | `resolveValidationMessage` 对非 `validation.*` 文案原样返回；admin 侧未挂 `createZodErrorMap` | 类型级错误透出 Zod 默认英文 |
| Admin 日期 | 列表：`sso/providers.vue:148`、`oauth/applications.vue:295` 默认 `zh-CN`；详情 / 会话 / 日志：`formatDateTime` 固定格式 | `en-US` 下时间格式与排序口径不一致 |
| i18n 命名空间 | `auth.quick.*`（23 键，页面）与 `auth.quickLogin.*`（7 键，flow）并存 | 与「一页一命名空间」惯例不一致，审计易漏 |
| Admin 对话框测试 | 封禁时长换算（`0 → undefined` 永久）、详情动作可见性、会话撤销仅由视觉层覆盖 | 交互回归无单测兜底 |
| 时区 | `User` 无 `timezone`；`utils/shared/date.ts` 默认 `zh-CN`，`dayjs` 固定 `zh-cn` | 无用户时区来源，服务端 / 邮件时间无法按用户时区渲染 |
| 注册控制 | better-auth `disableSignUp: false`；无域名 / 号码名单 | 注册入口无准入策略 |
| Admin 日志筛选 | `sessions.get` 支持 `userId` / `startDate` / `endDate` / `status` / `search`（`search` 含 IP 模糊匹配），趋势图已随 `stats.get` 交付；无独立 IP 精确参数，全仓无事件类型数据源 | M16 收窄为 IP 精确筛选与统计联动；事件类型 / 热力图转 backlog |
| 性能 | `lru-cache` 仅用于数据库存储层；无热点路径基准脚本 | Session 校验与 Admin 列表查询无回归阈值 |
| Demo 数据 | `generateDemoSessions(200)` 均匀随机日期 | 分布不真实，统计卡与趋势图观感偏差 |

## 4. 阶段构成（4 条主线 / 18 条原子条目）

| 编号 | 条目 | 批次 | 交付面 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M1 | `lint:md` 多层目录门禁与历史漂移修正 | A | `package.json` 改显式多层 glob（`*.md docs/*.md docs/*/*.md docs/*/*/*.md .github/*.md .github/*/*.md .github/*/*/*.md`，不用 `**`）；修正实测 6 处违规；接入 CI（`test.yml` / `regression-weekly.yml`），lint-staged 不新增 md 规则 | `docs/design/governance/**` 与 `.github/**` 三级目录均纳入门禁；故意写入坏格式可被拦截；全仓 `pnpm lint:md` 通过；改动 ≤10 文件 / 800 行 | 无 |
| M2 | i18n 源码 → 语言包反向键校验 | A | `scripts/i18n/audit-locale-keys.mjs` 增加反向扫描（`t()` / `$t()` / `te()` 字面量）；动态拼接键走文件化白名单；接入 `i18n:check` | 人为 `t('nope.key')` 使 `i18n:check` 失败；现有源码零误报；白名单与硬编码 allowlist 分离且有注释 | 无 |
| M3 | Admin 错误文案统一读取与 helper 收敛 | A | 新增 `utils/shared/api-error.ts`（`error.data?.message` → 非技术串 `error.message` → 调用方 fallback）；替换 4 个 composable + 6 个对话框定义 | 500 时 Toast 显示服务端本地化 message 而非 `[GET] ... 500`；10 处重复定义归零；单测覆盖 ofetch 500 / 4xx / 未知错误 | 无 |
| M4 | Admin OAuth 应用接口错误面 | A | `[id].put.ts` / `[id].delete.ts` 改 `createLocalizedError`（或等价状态码 + 本地化 message）；`use-application-management` 捕获错误 | 删除 / 启停失败返回 4xx/5xx 且带 `Content-Language`；前端弹失败 Toast；双语言测试覆盖 404 / 500 | M3 |
| M5 | Admin 校验错误统一 Zod error map | A | admin 相关 `safeParse` 挂 `createZodErrorMap`（参照 `/api/social`）；`resolveValidationMessage` 非键文案回退 `errors.admin.paramsInvalid` | 类型级错误（如 `disabled: "x"`）显示本地化文案，不透出 Zod 英文；既有表单提示不回归；单测覆盖 | M3 |
| M6 | Admin 日期本地化口径统一 | A | 抽 `useLocaleDate()`（取 `nuxtApp.$i18n.locale`），替换 `providers` / `applications` 列表列与 `user-detail`(3) / `user-sessions`(2) / `logs-table`(1)，共 8 个调用点 | `en-US` 下 8 个调用点按 en 输出；表格列统一短格式（zh `2026/6/15 12:15`）、详情保留秒；受影响基线重采并归因；无残留默认 `zh-CN` 调用；`test` / `test:visual` 通过 | 无 |
| M7 | `auth.quick` 命名空间收敛 | A | 合并 `auth.quick.*`（23）与 `auth.quickLogin.*`（7）为单一页面命名空间；同步 `pages/quick-login.vue`、`use-quick-login-flow.ts` 与测试 | 两套命名空间归一；`i18n:check` / 未用键审计通过；快速登录页与 flow 双语正常；视觉无未归因变化 | 无 |
| M8 | Admin 用户对话框定向单测 | A | `tests/unit/components/admin/users/**`：封禁时长 `0 → 永久`、详情动作可见性（自操作保护）、会话撤销调用 | 3 类用例通过；对应组件行覆盖率不低于当前；无新增 `any` | 无 |
| M9 | A 批收口检查点 | A | A 批门禁复核、文档同步、批次记录 | A 批 8 条全绿（`lint` / `typecheck` / `test` / `i18n:check` / `build`）；文档口径一致；无未登记遗留 | M1–M8 |
| M10 | 时区偏好与前端展示 | B | `User.timezone`（nullable）+ 个人中心时区选择 + `useUserTimezone()`；日期展示按用户时区与 locale | 设置后页面时间按所选时区显示；未设置回退浏览器时区；三方言 `create.sql` 更新，SQLite 实跑、MySQL / PostgreSQL 脚本语法核对（本地无实例）；部署文档补 `ALTER TABLE`；`/profile` 时区选择在 zh / en × light / dark 四张定向视觉截图 | M6 |
| M11 | 服务端与邮件时区 | B | 审计日志、会话时间、邮件时间的服务端格式化入口统一；请求上下文时区来源 | 服务端与邮件时间与用户时区一致；非法时区回退默认；测试覆盖 UTC / Asia/Shanghai / America/New_York | M10 |
| M12 | 注册控制规则与注册入口 | B | 邮箱域名黑白名单 + 手机号国家 / 地区黑名单（配置模型 + Zod）；注册、邀请、第三方首次绑定统一校验；本地化错误码 | 名单命中被拒且提示本地化；未命中放行；既有用户登录不受影响；各入口单测 | 无 |
| M13 | 注册控制管理端配置与审计 | B | Admin 配置页（或设置区）+ 读写 API + 变更审计记录（操作者 / 时间 / 变更内容）；权限校验 | 管理员可增删改名单；非管理员 403；变更写入审计日志；双语与表单校验通过 | M12 |
| M14 | 性能基准与索引 | B | `scripts/perf/` 基准脚本（Session 校验、Admin 列表查询）；SQLite 索引（`EXPLAIN` 验证）；基线报告入 `artifacts/` | 脚本可复跑并输出 p50 / p95；热点查询无全表扫描；报告记录运行环境；既有测试不回归 | 无 |
| M15 | 缓存策略与回归阈值 | B | 进程内 `lru-cache` 边界评估（Session 校验 / 配置读取）；Redis 可选路径文档化；回归阈值脚本（阈值由 M14 基线裁定） | 选型结论与边界落文档；阈值脚本可执行；未引入必需外部依赖 | M14 |
| M16 | Admin 日志筛选增强（IP 精确与统计联动） | B | `utils/shared/api-schemas.ts` 增加独立 `ip` 参数；`sessions.get` / `stats.get` 接受同一组筛选条件；前端筛选与统计卡联动；同步 `docs/api/admin.md`（现有 `stats` 文档写了 `period` / `startDate` / `endDate` 但实现未解析，属既有漂移）；复用 M14 索引 | IP 精确筛选命中且与 `search` 模糊不冲突；组合筛选（IP × 状态 × 区间）结果正确；统计卡随筛选变化；分页 / 排序不回归；查询耗时不超过 M14 基线阈值；`docs/api/admin.md` 与实现一致；双语与视觉通过 | M14 |
| M17 | Demo 数据生成增强 | B | 可配置分布（活跃度长尾、时段峰谷）+ 固定 seed 可复现；统计卡与 Demo 会话一致 | 同 seed 输出稳定；分布参数可配置且有默认；Demo 页面无异常；单测覆盖 | 无 |
| M18 | 阶段收口与归档 | B | 包体 / 覆盖率 / 视觉复核、文档同步、收口记录、归档 | 全量门禁通过；`todo.md` 归档；`roadmap` / `backlog` / `index` 口径一致 | M1–M17 |

> **拆分规则**：单条超过「10 个文件 / 800 行新增」时按模块或对话框拆条；条目编号变更须回扫 `todo.md`、`roadmap.md`、本记录与 `.session/`。

## 5. 关键口径

### 5.1 批次推进

- A 批（M1–M8）全部通过 M9 检查点后才进入 B 批；B 批口径在批次开始时确认（见 5.5–5.8），确认结果写入本记录与 `todo.md` 验收要点。
- 任一批次内条目完成即提交，不等待整批；检查点只做复核与收口。

### 5.2 门禁改造

- 先测量再收口：M1 首跑会暴露历史漂移，实测 6 处同批修正；若超过 10 文件 / 800 行，拆出「历史文档格式修正」条目。
- 门禁脚本必须可复现失败：新增校验都要有「故意破坏 → 拦截」的负向验证记录。

### 5.3 i18n 反向键

- 字面量严格校验；动态拼接（模板字符串、变量入参）走显式白名单文件，白名单每项注明来源，不与硬编码中文 allowlist 合并。
- 检查纳入 `i18n:check`，不新增独立命令。

### 5.4 Admin 错误面

- 优先 HTTP 语义：失败用 4xx / 5xx + `createLocalizedError`，不再用 200 + body `status`。
- 前端统一 `getApiErrorMessage(error, fallback)`：`error.data?.message` → 非技术串 `error.message` → fallback；技术串（含 `[GET]` / `[POST]`）不得直出 Toast。

### 5.5 时区

- 来源优先级：用户设置 > 浏览器时区 > 服务端默认（`UTC` 存储，展示按用户时区）。
- 存储格式：IANA 名称（`Asia/Shanghai`），非法值回退默认；旧用户 `null` 走回退链。
- 邮件时间按收件人时区渲染，同步邮件请求上下文优先。

### 5.6 注册控制

- 域名规则：精确匹配与后缀匹配（`example.com` / `.edu.cn`）分开表达；号码规则按 E.164 国家码前缀。
- 仅作用于新注册与第三方首次绑定，不影响既有用户登录；拒绝时统一本地化错误码，避免枚举探测。

### 5.7 性能

- 先基准后优化：M14 产出可复跑脚本与首次基线，M15 的阈值以此裁定（不在登记阶段承诺具体数字）。
- 不引入必需外部服务；Redis 只作为可选路径记录，默认保持进程内缓存。

### 5.8 Demo 数据

- 固定 seed 保证可复现；分布参数（活跃用户占比、时段峰谷）有默认值并可配置；Demo 页面统计与生成数据一致。

## 6. 依赖与风险

| 项 | 说明 | 缓解 |
| :--- | :--- | :--- |
| 时区迁移 | `User.timezone` 需在生产库 `ALTER TABLE` | 三方言建表脚本 + 部署文档补 ALTER 说明，旧值 `null` 兼容 |
| 注册控制面 | 涉及注册 / 邀请 / 第三方绑定多入口 | 统一收口到单一校验函数，入口各自单测；开关默认关闭 |
| 性能阈值 | 首次基线可能受运行环境影响 | 报告记录环境与样本量；阈值只用于相对回归 |
| 日志筛选数据量 | 大表组合筛选可能退化 | 先加索引并 `EXPLAIN` 验证；必要时限制时间跨度上限 |
| 事件类型维度 | 无登录事件数据源（仅 Session 实体），本阶段不做 | 已登记 backlog §2.4；如后续需要，另立「登录事件日志」条目并评估保留期与写入成本 |

## 7. 验证矩阵

| 阶段 | 必跑 |
| :--- | :--- |
| 每条改动 | `pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / 定向 `pnpm test` |
| A 批检查点（M9） | 上述 + `pnpm i18n:check` / `pnpm build` / `pnpm lint:md` / `pnpm ai:check` |
| B 批检查点（M18） | 全量门禁 + `pnpm test:coverage` / `pnpm migration:check-budget` / `pnpm test:visual` / `pnpm lint:duplicate` |

## 8. 交付与收口

- 每批收口时同步 `todo.md`、`roadmap.md`、`backlog.md`（上收条目移出候选）、`.session/` 与 [治理索引](./index.md)。
- M18 产出阶段 6 收口记录，并按 [规划规范](../../standards/planning.md) §5 归档到 [已完成工作归档](../../archive/completed-work.md)。

## 9. 偏差登记

| 条目 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| M10 三方言实跑 | `create.sql` 各实跑一次 | SQLite 内存实跑；MySQL / PostgreSQL 仅脚本语法核对 | 本地与 CI 无 MySQL / PostgreSQL 实例，避免引入临时容器依赖；部署前由数据库文档的 ALTER 语句兜底 |
