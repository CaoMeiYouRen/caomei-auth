# 2026-11-19 阶段 8 收口记录：国际化 5 语推广（10 语架构）

> **状态**：M1A–M12 全部交付，2026-11-19 收口。
> **范围与验收**：[阶段 8 范围登记](./2026-11-17-phase8-registration.md)。
> **前置**：[阶段 7 收口记录](./2026-11-17-phase7-closure.md)（测试 1137 / 视觉 123 / 语言包 2 × 1510 键）。

## 1. 交付清单

| 条目 | 交付 | 状态 |
| :--- | :--- | :--- |
| M1A | Locale Registry 扩至 10 码 + `enabled` 开关 + 别名 + `User.locale` 扩值 + 邮件渐进表（`f0e632e`） | 完成 |
| M1B | 治理门禁只校验启用语言，停用语言不要求目录（`fe17a8b`） | 完成 |
| M2 | caomei-ui `registerLocale` 插件、10 码映射、切换器 `switchable` 过滤（`8590df3`） | 完成 |
| M3 | zh-TW 核心 6 模块 599 键（`ce5e96e`） | 完成 |
| M4 | zh-TW 业务 6 模块 393 键（`3cc7ed0`） | 完成 |
| M5 | zh-TW Admin 6 模块 + 启用（`4bb8713`） | 完成 |
| M6 | ja-JP 核心 6 模块 599 键（`0263902`） | 完成 |
| M7 | ja-JP 业务 6 模块 393 键（`83e8b9b`） | 完成 |
| M8 | ja-JP Admin 6 模块 + 启用（`30a9af3`） | 完成 |
| M9 | ko-KR 核心 6 模块 599 键（`e97918f`） | 完成 |
| M10 | ko-KR 业务 6 模块 393 键（`eaae38a`） | 完成 |
| M11 | ko-KR Admin 6 模块 + 启用（`06a8ed9`） | 完成 |
| M12 | 新增语言视觉基线 12 张、5 语切换验证、i18n 规范、台账、收口与归档（本次提交） | 完成 |

## 2. 终态指标

| 指标 | 收口值 | 对照（阶段 7） |
| :--- | :--- | :--- |
| 语言包 | **5 语启用 × 18 模块 × 1510 键**；10 码登记，5 码停用 | 2 语 × 1510 |
| 就绪度 | `zh-CN` / `en-US`：`seo-ready`；`zh-TW` / `ja-JP` / `ko-KR`：`ui-ready`（不索引） | 2 语 `seo-ready` |
| 测试 | **1154 passed / 155 files** | 1137 / 153 |
| 覆盖率 | Statements **78.39%** / Branches 63.45% / Functions 72.58% / Lines **78.75%** | 78.35% / 78.70% |
| 视觉基线 | **136 passed**（123 原有 + 13 新增：12 张语言基线 + 1 条 5 语切换断言） | 123 |
| 重复代码 | jscpd **3.55%**（4,982 / 140,409 行、323 clones，阈值 5%；测量于收口提交工作树，`pnpm lint:duplicate`） | 3.73% |
| 包体 | 入口 CSS **415,165 B**（+3.86%，上限 +10%）；入口 JS 360,429 B；总 JS / CSS 2,504,976 B / 1,499,989 B；预算通过 | 2,303,029 / 1,499,989 |
| 质量门 | `lint` / `lint:css` / `ai:check` / `quality:file-size` / `migration:check-imports` / `i18n:check` / `typecheck` / `build` / `migration:check-budget` / `test` / `test:coverage` / `lint:duplicate` / `lint:md:check` / `test:visual` 全绿 | 同左 |

## 3. 阶段级变更

- **语言架构**：`LocaleCode` 由 2 值扩为 10 值并引入 `enabled` 开关；路由、切换器、组件库注册、邮件表、`User.locale`、SEO 全部由 Registry 派生，单点扩语言只剩数据与 readiness 工作。
- **上线形态**：新语言 `ui-ready`（`switchable=true` / `indexable=false`），页面级 robots 按 readiness 输出 `noindex, nofollow`，sitemap / hreflang / `og:locale` 只取 `seo-ready`。
- **译文台账**：`i18n/translation-provenance.json` 按语言记录来源、审校级别、已审 / 待审模块与 readiness，三语与 Registry 对齐。
- **翻译批次口径**：以「语言 × 6 模块」为原子单位（18 文件例外），每批用「键同构 + 占位符 + vue-i18n 编译」脚本自证，再由 Review Gate 复核。
- **门禁适配**：`message-catalog` 的「非中文语言包不含中文」对 ja（汉字）与 ko（品牌名）改为「本地文字覆盖率 + 简体特征字」；ko-KR 追加「剥离品牌名后不得残留 CJK」的逐条断言。
- **视觉**：新增语言只采登录 + 个人中心（浅 / 暗）4 张 × 3 语 = 12 张，并补一条 5 语切换的浏览器断言（切换器 5 项、可切到 한국어）。

## 4. 与范围登记的偏差（均已登记理由）

| 项 | 登记 | 实际 | 原因 |
| :--- | :--- | :--- | :--- |
| 视觉基线范围 | 每语言 4 张，3 语 12 张 | 12 张 + 1 条功能断言（无截图） | 5 语切换验收需要浏览器级证据，视觉工程是唯一现成的 Playwright 入口 |
| 本地视觉执行 | `pnpm test:visual*` 自动拉 Playwright 容器 | 使用 `vis-playwright-tools:1.65.0`（官方镜像 + build-essential） | 本地官方镜像内 `pnpm i` 时 `better-sqlite3` 回退源码编译、因镜像缺 `make` 失败（未取到预编译包）；改用同一官方镜像加 build-essential 本地派生镜像采集，派生镜像不入仓库与 CI。CI 仍用官方镜像且其安装步骤为绿，首次 CI 视觉若出现像素漂移需按官方镜像重采 |
| `message-catalog` 断言 | 沿用「非中文语言包不含中文」 | 对 ja / ko 改为覆盖率 + 黑名单（ko 额外逐条无 CJK） | 日语汉字与韩语品牌名会误判；同时修正该文件在主 vitest 配置下的数据来源（改读原始 JSON） |
| 后台 Admin 语言包 | 每语言 518 键 | 518 键（`server-only` 为 `{}`，与基准一致） | 基准语言本身无 `server-only` 文案 |

## 5. 遗留与已知边界

- **母语审校与 `seo-ready`**：zh-TW / ja-JP / ko-KR 均为机翻（zh-TW 另做术语校订），`nativeReview=false`；母语审校、术语定稿与核心页抽检后逐语言独立升级（backlog §3.2「新语言母语审校与 seo-ready 升级」）。
- **10 语内容扩展**：es-ES / fr-FR / de-DE / ru-RU / pt-BR 仍只有 Registry 定义（backlog §3.2「国际化 10 语内容扩展」）。
- **停用语言的同构门禁**：`i18n:check` 与运行时门禁只遍历 `ENABLED_LOCALES`，未启用语言补数据期间无 CI 保护（backlog §3.2）。
- **未启用语言的懒加载包体**：`locale-runtime-loader` 的 glob 未按 Registry 过滤，后续新增语言会产生不可达 chunk（backlog §3.2）。
- **`message-catalog` 数据来源**：主 vitest 配置（Nuxt 环境）下 `import.meta.glob` 曾取到位置元数据，现象未能稳定复现，已把内容断言改为读原始 JSON 并登记 backlog 待定 repro。
- **视觉阈值与矩阵**：新增语言只做桌面 1440 核心页；平板 / 移动端矩阵与「低于阈值的纯色漂移」仍是既有 backlog 项。
- **既有个候选**：DataTable 上游能力、`docker-publish` 重建 gate、`braces` 依赖跟进等保持 backlog。

## 6. 验证命令

```bash
pnpm lint && pnpm lint:css && pnpm ai:check && pnpm quality:file-size && \
pnpm migration:check-imports && pnpm i18n:check && pnpm typecheck && pnpm build && \
pnpm migration:check-budget && pnpm test && pnpm test:coverage && \
pnpm lint:duplicate && pnpm lint:md:check
pnpm test:visual   # 容器内，136 passed
```

运行时抽查（`node .output/server/index.mjs`，5 语）：

| 路径 | 结果 |
| :--- | :--- |
| `/login`、`/en-US/login` | 200，`lang` 正确，无 `noindex` |
| `/zh-TW/login`、`/ja-JP/login`、`/ko-KR/login` | 200，`lang` 正确，`robots=noindex, nofollow` |
| `/ja-JP/register`、`/ja-JP/forgot-password`、`/ja-JP/about` | 200，`lang=ja-JP`，`noindex` |
| `/ko-KR/register`、`/ko-KR/forgot-password`、`/ko-KR/about` | 200，`lang=ko-KR`，`noindex` |
| `/es-ES/login`、`/ko-KR/login`（启用前） | 302（停用语言无路由） |
| `sitemap.xml` | 不含 zh-TW / ja-JP / ko-KR |
| hreflang | 仅 `zh` / `zh-CN` / `en` / `en-US` / `x-default` |
| 切换器 | 列出 5 语，可切到 한국어 并跳转 `/ko-KR/login` |

## 7. 收口时的仓库与外部状态（2026-11-19）

- **CI**：最近 `master` 推送（`4bb8713..e97918f`）的 Test / Publish Docker Image / Deploy VitePress / Push on master / TODO to Issue 全部 success；Docker 工作流已过发布前安全告警门禁。
- **安全告警**：Dependabot open 3 条均为 medium（`@nuxt/schema` / `minimatch` / `glob`，上游无修复版本）；Code Scanning open 0。`critical` / `high` 为 0，发布门禁不阻塞。
- **Issue**：open 1（#114「问题反馈、问卷调查和交流群」，`help wanted` / `question`，所有者讨论类，不按缺陷流程处理）。
- **PR**：open 0。
- **下一阶段**：未启动。候选方向（需用户授权后登记范围）：① 三语母语审校与 `seo-ready` 升级（i18n 延续）；② 10 语内容扩展（数据批次复用本阶段流程）；③ 账号找回与 2FA 边界治理（backlog §2.12，已有设计草案）。
