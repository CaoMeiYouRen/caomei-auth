# 2026-11-17 阶段 8 范围登记：国际化 5 语推广（10 语架构）

> **状态**：已授权启动（2026-11-17，用户确认按本规划从 M1 开始）。规划输入：用户选择「阶段 8：先 5 语」，译文采用「机翻 draft + 审校」，新语言上线形态为 `ui-ready`。
> **单一事实源**：阶段范围、原子条目与验收见本文；执行口径以 [国际化实施方案](../../standards/i18n.md)、[规划规范](../../standards/planning.md) 为准。
> **前置**：[阶段 7 收口记录](./2026-11-17-phase7-closure.md)（测试 1137 / 视觉 123 / 语言包 2 × 1510 键）。
> **参考**：[momei](https://github.com/CaoMeiYouRen/momei) 的 5 语 Registry（zh-CN / zh-TW / en-US / ja-JP / ko-KR）与 readiness / SEO 分层；组件库语言面以 caomei-ui 1.3.0 的 10 语为上限。

## 1. 阶段目标

1. **语言架构扩到 10 语**：Locale Registry 改为「10 码定义 + `enabled` 开关」，本阶段启用 5 语（zh-CN / en-US / zh-TW / ja-JP / ko-KR），其余 5 语（es-ES / fr-FR / de-DE / ru-RU / pt-BR）只登记、不启用。
2. **3 个新语言全量文案**：zh-TW / ja-JP / ko-KR 各 18 个消息模块、与 zh-CN 同构（1510 键基线，随主语言增长同步）。
3. **组件库与端到端桥接**：caomei-ui 非预注册语言按需 `registerLocale` 后在 provider 前可用；语言切换器展示 5 语原生名称；路由前缀、cookie、`User.locale`、邮件与服务端 API 语言协商覆盖新语言。
4. **上线形态**：新语言 `ui-ready`（可切换、可访问、`noindex`、不进 sitemap / hreflang）；审校完成后另行升级 `seo-ready`。
5. **门禁与证据**：5 语键集合同构、无缺失 / 重复 / 未使用键、硬编码基线不增长；新语言核心页视觉基线；10 语扩展仅剩数据与 readiness 工作。

## 2. 范围与非目标

### 2.1 本阶段范围

- `i18n/config/locale-registry.ts`：`LocaleCode` 扩为 10 码、`enabled` 开关、别名（含 `zh-Hant` → zh-TW）、`LOCALE_CODES` 常量。
- `nuxt.config.ts`：locales 只取启用语言；`locale-modules` 路由前缀匹配已支持任意语言码，无需改动。
- `utils/shared/seo.ts`：10 码 BCP47 映射；新语言 `ui-ready` 不进入索引。
- `composables/utils/use-caomei-locale.ts` + 新插件：10 码映射与 `registerLocale`（仅启用且非预注册语言）。
- `components/base/language-switcher.vue`：按 `switchable` 过滤；原生名称展示。
- `server/utils/email/i18n.ts`：邮件消息表改为按启用语言渐进加载，缺语言回退 zh-CN。
- `lib/auth.ts`：`User.locale` 校验扩到 `LOCALE_CODES`。
- 3 个新语言包（18 模块 / 语言）与 `i18n/translation-provenance.json` 译文来源台账。
- 视觉：新语言核心页（登录 + 个人中心）浅 / 暗基线。
- 文档：i18n 规范补 10 语架构、readiness 生命周期与机器翻译标注规则；阶段收口记录与归档。

### 2.2 非目标

- **不启用** es-ES / fr-FR / de-DE / ru-RU / pt-BR 的内容与路由；只保留 Registry 定义，供后续阶段扩数据。
- 不做母语者终审与 `seo-ready` 升级（本阶段产出 draft 并标注待审校模块）。
- 不翻译用户生成内容（姓名 / 应用名 / 公告）、Demo 种子数据与内部日志（延续阶段 5 边界）。
- 不做 RTL、第三语言以外的排版改造、语言包 CDN 化。
- 不调整现有 zh-CN / en-US 文案语义（仅随键同步）。

## 3. 现状取证（2026-11-17）

| 项 | 现状 | 影响 |
| :--- | :--- | :--- |
| 语言包 | 2 语言 × 18 模块 × 1510 键，`zh-CN` / `en-US` 同构 | 每新增语言约 1510 条译文 |
| Registry | `LocaleCode = 'zh-CN' \| 'en-US'`，无启用开关 | 扩语言需同时改类型、locales 生成、SEO、邮件、组件库映射 |
| caomei-ui | 1.3.0 支持 10 语，仅 `zh-CN` / `en-US` 预注册 | 其余语言需 `registerLocale` 后才能用于 provider |
| SEO | hreflang / sitemap 只输出 `seo-ready` + `indexable` | 新语言 `ui-ready` 自动排除，符合上线形态 |
| 邮件 | `EMAIL_MESSAGES: Record<LocaleCode, ...>` 静态 2 语 | 需改渐进表并补 3 语邮件模块 |
| 视觉 | 2 语矩阵（zh 全量 + en 核心 6 张） | 新语言需最小核心页基线，控制 CI 时长 |
| 用户偏好 | `User.locale` z.enum 2 值 | 需扩到 10 码，否则新语言无法持久化 |

## 4. 阶段构成（4 条主线 / 13 条原子条目）

| 编号 | 条目 | 交付面 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| M1A | Registry 10 码与启用开关 | 类型 / 注册表 / 别名 / SEO BCP47 / 邮件渐进表 / `User.locale` / 切换器过滤 / 单测 | 10 码定义、仅 2 语启用时行为不变；未知/停用语言回退默认；单测覆盖启用过滤与别名 | 无 |
| M1B | 多语言治理门禁适配 | parity / audit / fallback / registry-rules 只校验启用语言；语言包运行时门禁只跑启用语言 | `i18n:check` 在 10 码注册、2 语启用下通过；停用语言不要求目录/文件；规则覆盖 disabled 不变量 | M1A |
| M2 | caomei-ui 桥接与切换器 | `registerLocale` 插件、10 码映射、切换器 `switchable` 过滤、原生名称 | 已启用语言组件内建文案跟随；切换器只显示可切换语言；单测覆盖映射与注册 | M1A |
| M3 | zh-TW 核心语言包 | app / common / errors / validation / auth / static（6 模块） | 与 zh-CN 键同构；术语抽检（使用者/帐号等） | M1A |
| M4 | zh-TW 业务语言包 | profile / security / oauth / sso / demo / email（6 模块） | 键同构；邮件模板可渲染 | M3 |
| M5 | zh-TW Admin 语言包与启用 | admin / admin-users / admin-oauth / admin-sso / admin-logs / server-only；启用 zh-TW | parity 通过；路由 `/zh-TW` 可访问；`ui-ready` 不入索引 | M4 |
| M6 | ja-JP 核心语言包 | 6 个核心模块 | 键同构；占位符与复数语法检查通过 | M1B |
| M7 | ja-JP 业务语言包 | 6 个业务模块 | 键同构；邮件可渲染 | M6 |
| M8 | ja-JP Admin 语言包与启用 | 6 个 Admin / 服务端模块；启用 ja-JP | parity 通过；路由 `/ja-JP` 可访问；不入索引 | M7 |
| M9 | ko-KR 核心语言包 | 6 个核心模块 | 键同构；占位符检查通过 | M1B |
| M10 | ko-KR 业务语言包 | 6 个业务模块 | 键同构；邮件可渲染 | M9 |
| M11 | ko-KR Admin 语言包与启用 | 6 个 Admin / 服务端模块；启用 ko-KR | parity 通过；路由 `/ko-KR` 可访问；不入索引 | M10 |
| M12 | 视觉、门禁、文档与收口 | 新语言核心页视觉基线、SEO noindex 断言、i18n 规范、台账、收口记录 | 全量门禁通过；5 语切换浏览器验证；归档与候选回填 | M1A–M11 |

> **拆分规则**：单条超过「10 文件 / 800 行」时拆条；**翻译数据批次例外**：按「语言 × 6 模块」为原子单位（18 个文件），由键集合同构、占位符检查与抽样审校把关，不按代码行数拆分。

## 5. 关键口径

### 5.1 语言启用与 readiness

- `enabled=false` 的语言不进 `nuxt.config` locales、不进切换器、不可被探测器命中（回退默认）。
- 新语言上线为 `ui-ready`：`switchable=true`、`indexable=false`、`readiness='ui-ready'`，sitemap / hreflang / `og:locale` 继续只取 `seo-ready`。
- 升级 `seo-ready` 的前置：母语者审校 + 核心页视觉抽检 + 独立提交，不在本阶段完成。

### 5.2 译文来源与台账

- zh-TW：zh-CN 简繁转换 + 术语表校订（`使用者`、`帐号`、`设定`、`登入` 等 Taiwan 用法）。
- ja-JP / ko-KR：机器翻译 draft，标注「待母语审校」。
- `i18n/translation-provenance.json` 记录每语言来源、已审校模块、readiness 与更新时间；译文批次必须同步更新。
- 禁止把机器译文直接标为 `seo-ready`。

### 5.3 键与门禁

- 以 zh-CN 为基准：键集合完全一致、占位符（`{name}`）一致、无空值；复数语言按 vue-i18n 语法校验。
- `pnpm i18n:check`（缺失 / 反向键 / 同构 / 回退 / 硬编码 / lint / 编译）在 5 语下必须全绿。
- 未使用键告警沿用动态键白名单，不为新语言新增白名单。

### 5.4 视觉与包体

- 每个新语言只采登录 + 个人中心（浅 / 暗）4 张，3 语共 12 张；不扩全矩阵。
- 语言包按路由懒加载（沿用 `locale-modules`）；caomei-ui 语言包仅在启用语言下注册，记录包体变化。

## 6. 依赖与风险

| 项 | 说明 | 缓解 |
| :--- | :--- | :--- |
| 机器翻译质量 | ja / ko 直译可能生硬、敬语不当 | 标记 draft、`ui-ready` 不索引、按模块审校后升级；术语表统一 |
| zh-TW 术语 | 简繁转换会产生大陆用词 | 术语表 + 逐模块抽查（认证 / 安全 / Admin） |
| 新增语言包体积 | 3 语言 × 18 模块 | 路由懒加载；只注册启用语言；记录包体预算 |
| 路由 / SEO 误索引 | 新语言 `ui-ready` 若进入 sitemap | 单测断言 sitemap / hreflang 不含新语言；`i18nHead` 过滤沿用 |
| CI 时长 | 12 张新视觉基线 | 只取 2 页 × 2 主题 × 3 语；与现有矩阵同批验证 |
| 用户偏好 | `User.locale` 扩值后旧数据兼容 | 列仍为 string；z.enum 扩到 10 码，旧值不受影响 |

## 7. 验证矩阵

| 阶段 | 必跑 |
| :--- | :--- |
| M1–M2 | `pnpm test`（registry / seo / caomei-locale / email）、`pnpm typecheck` |
| M3–M11 | `pnpm i18n:check`、`pnpm test`、`pnpm typecheck`、`pnpm build`、`pnpm migration:check-budget` |
| M12 | 全量门禁 + `pnpm test:visual`（新基线）+ 浏览器切换验证 |

## 8. 交付与收口

- 每条完成即 Review Gate 后提交，并同步 `todo.md` 状态；翻译批次同时更新台账。
- M12 产出阶段 8 收口记录，归档到 [已完成工作归档](../../archive/completed-work.md)，未完成项（母语审校、10 语扩展）回填 backlog。

## 9. 实施前确认事项（2026-11-17）

| 项 | 待确认内容 | 默认建议 |
| :--- | :--- | :--- |
| 范围 | M1–M12 共 12 条原子条目；5 语先行、其余 5 语只登记 | 按本文范围实施 |
| 译文来源 | zh-TW 简繁转换 + 台湾术语；ja / ko 机翻 draft，标注待审校 | 接受 draft + `ui-ready` 不索引 |
| 上线形态 | 新语言 `switchable=true`、`indexable=false`，不进 sitemap / hreflang | 维持 `ui-ready` |
| 视觉范围 | 每语言登录 + 个人中心（浅 / 暗）4 张，3 语共 12 张 | 控制 CI 时长，不扩全矩阵 |
| 实施顺序 | M1–M2 基建先于语言包；每个语言包批次独立 Review Gate | 按 M1 → M12 顺序 |

**外部状态（规划时点）**：open issue 1（#114 讨论类）、open PR 0、master 最近 CI 全 success；未发现与本阶段冲突的在途变更。

**确认记录（2026-11-17）**：用户确认按本规划启动，从 M1 开始；实施中如调整范围或译文口径，先更新本文与 `todo.md`。
