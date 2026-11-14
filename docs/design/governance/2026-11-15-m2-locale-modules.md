# 2026-11-15 阶段 5 M2：消息模块化与按需加载

> **状态**：已完成（2026-11-15），Review Gate 放行后单次提交。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M2 / §5.2；[国际化实施方案](../../standards/i18n.md) §4。
> **关联**：[M1 记录](./2026-11-15-m1-caomei-ui-1.3.0.md)｜[i18n 评估与实施方案](./2026-11-05-i18n-evaluation.md) §6｜[视觉参考态基座](./2026-11-08-visual-baseline-harness.md)。

## 1. 模块口径（17 个）

`i18n/config/locale-modules.ts` 是模块唯一的注册表；模块名即语言文件名。登记 §5.2 列出 16 个模块，本批把 `app`（应用外壳：`app.name` / `footer` / `language.*`）从 `common` 拆出并登记为第 17 个，理由：

- 这 3 组键属于「应用壳层」，任何路由（含错误页、SSO、OAuth）都要用，但不等于通用按钮 / Toast 文案；
- 拆分后 `common` 只承载跨页面复用文案，后续 M4–M9 上收时有明确落点；
- 归入 core 后首屏体积与拆分前相同（键总量不变）。

| 分类 | 模块 | 加载时机 |
| :--- | :--- | :--- |
| core（`files[]` 预装） | `app` / `common` / `errors` / `validation` / `auth` | 首屏 |
| 页面 | `profile` / `security` / `oauth` / `sso` / `demo` | 进入对应路由 / Demo 模式 |
| 后台 | `admin` / `admin-users` / `admin-oauth` / `admin-sso` / `admin-logs` | `/admin/**` 及业务子域 |
| 服务端 | `email` / `server-only` | 服务端按场景显式加载（M15 / M16） |

`common` / `auth` 以及 12 个非 core 模块当前为 `{}` 占位文件，供 M4+ 按批次填充；不提前写入未翻译键，避免 parity 与覆盖率失真。

## 2. 实现

| 面 | 内容 | 文件 |
| :--- | :--- | :--- |
| 模块注册 | 模块顺序、core 集合、key group、路由规则、文件路径与路径归一化（剥离 locale 前缀） | `i18n/config/locale-modules.ts` |
| 运行时加载 | `import.meta.glob` 按需 `import()` + `mergeLocaleMessage`；glob 用负向模式排除 core 与 server 模块（避免 core 文案二次打包）；以 i18n 实例为 key 的 `WeakMap` 缓存（core 视为已装载）；只合并当前语言（key 同构由 `i18n:check` 保证，未配置 `fallbackLocale` 时回退副本不参与渲染）；chunk 失败按缺文案降级并允许重试 | `i18n/config/locale-runtime-loader.ts` |
| 路由接线 | 全局中间件读取 `nuxtApp.$i18n`（全局中间件早于页面 setup，`useI18n()` 在 SSR 下会抛 `SyntaxError: 26`） | `middleware/i18n-modules.global.ts` |
| Registry / Nuxt 配置 | `files` 由模块表派生（17 个，供治理脚本校验磁盘完整性）；`@nuxtjs/i18n` 的 `locales[].files` 只取 core（`getEagerLocaleMessageFilePaths`） | `i18n/config/locale-registry.ts`、`nuxt.config.ts` |
| 语言包 | 每语言 17 个模块文件；`app` / `language` / `footer` 由 `common.json` 迁入 `app.json`，键路径不变 | `i18n/locales/**` |
| 测试 | 模块表 12 例（17 模块、core / server 边界、路径归一化、路由映射、Demo、`pages/**` 覆盖守卫）+ loader 9 例（core 跳过、单语言合并、幂等、别名、客户端模块导入器、glob 排除清单守卫、legacy composer、无 composer 兜底）+ 中间件 4 例 + Registry 文件派生断言 | `tests/unit/i18n/locale-modules.spec.ts`、`locale-runtime-loader.spec.ts`、`locale-registry.spec.ts`、`tests/unit/middleware/i18n-modules.spec.ts` |

## 3. 端到端验证（路由按需加载）

在 dev server + 视觉夹具库下做定向实验（临时在 `admin-logs.json` 写入探针键、在 `pages/admin/logs.vue` 渲染该键，验证后已完全还原）：

| 场景 | 结果 |
| :--- | :--- |
| `/admin/users`（首屏） | 页面无探针元素，`admin-logs` 模块未加载 |
| 点击侧栏进入 `/admin/logs`（SPA） | 探针显示 `ADMIN_LOGS_PROBE`，即进入路由时合并了 `admin-logs` 模块 |
| 离开再返回 `/admin/logs` | 探针仍为 `ADMIN_LOGS_PROBE`（缓存命中，不重复合并） |
| 直接访问 `/admin/logs`（SSR） | 探针同样命中，SSR 与客户端行为一致 |

复现条件：`zh-CN/admin-logs.json` 临时写入 `{"admin":{"logs":{"__probe":"ADMIN_LOGS_PROBE"}}}`，`pages/admin/logs.vue` 模板加 `<div data-probe>{{ $t('admin.logs.__probe') }}</div>`；实验后两份文件均已还原（`admin-logs.json` 恢复 `{}`）。

## 4. 包体与首屏

| 指标 | M2 前 | M2 后 | 说明 |
| :--- | ---: | ---: | :--- |
| 入口 CSS | 415,165 B | 415,165 B | 无变化 |
| 入口 JS | 371,430 B | 376,403 B（+4,973 B） | 加载器 + 模块注册表 + 全局中间件（含 20 条懒加载映射） |
| 总 JS | 2,183,129 B | 2,188,702 B（+5,573 B） | 上述代码 + 20 个空懒加载 chunk（10 个客户端模块 × 2 语言，实测合计 600 B）；无 core 文案副本 |
| 包体预算 | 通过 | 通过（入口 CSS +3.86%，上限 +10%） | `pnpm migration:check-budget` |

> 首轮实现把 `import.meta.glob('../locales/**/*.json')` 全量纳入，导致 14 个永不触达的 core / server chunk（含 14,724 B core 文案副本，总 JS +22,028 B）。Review Gate 指出后改为负向模式排除，产物复核：仅入口 chunk 含 20 条 `../locales/*.json` 映射，core 文案不再出现在任何 JS chunk；总 JS 回落至 +5,573 B。模块内容在 M4+ 填充后，懒加载 chunk 才会承载实际文案。

## 5. 验证矩阵

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | 通过：99 键不变，语言包结构一致，Registry 2 语言 / 17 文件校验通过，硬编码基线 107 文件 / 1,390 行未变 |
| `pnpm test` | 973 passed（125 files；较上批 +25：模块表 12、loader 9、中间件 4） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` | 通过（1m 47s） |
| `pnpm migration:check-budget` | 通过（见 §4） |
| `pnpm test:visual` | 102 passed（模块拆分不改变渲染结果） |
| SSR 冒烟 | `/login` 200 且输出 `app` / `footer` / `language` 文案；`/en-US/login` 的 `html lang=en-US` |

## 6. 边界与后续

- 模块文件当前为空占位；M4 起每批只填本批页面对应的模块，禁止一次性写入未翻译键。
- 服务端邮件 / API 错误面的模块装配（`email` / `server-only`）在 M15–M16 接入；本批仅登记模块与 `LOCALE_SERVER_MODULES`。
- `footer.tagline` 等既有键在组件里仍是硬编码（`components/app-footer.vue`），属 M9 文案批次，不在本批改动。
- 视觉掩码 / 基线策略不变；模块化不改变 manifest 之外的可视输出。
