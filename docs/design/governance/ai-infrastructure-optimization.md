# AI 基建优化规划 (AI Infrastructure Optimization Plan)

> 状态: `proposed`
> 日期: 2026-08-15
> 适用范围: 草梅 Auth 项目的 Skills / Agents / 项目规范 / i18n 规划

## 1. 背景与目标

本规划基于对以下参考项目的交叉比对得出，旨在将草梅 Auth 的 AI 基建（Skills、Agents、项目规范、i18n 规划）升级到与生态一致的现代水平：

- **cmyr-skills-agents**: 通用 Skills / Agents 源仓库（权威来源，同步对象）
- **momei**: AI 基建与规范体系蓝本（结构、治理经验来源，特别是 i18n）
- **dependfix**: 以 momei 为蓝本完成独立化的精简范本（裁剪口径参考）

**原则**: 忠于原文，调整不适用于本项目的部分。momei 仅作为结构与治理经验蓝本，1.0 后按本项目自身实践演进；Skills 一律从 cmyr-skills-agents 源仓库同步，不复制 momei 项目特化版本。

**目标**:

1. `AGENTS.md` 成为平台无关的唯一权威事实源（角色矩阵、冲突顺序、PDTFC 流程、安全红线）。
2. Skills 升级为源仓库最新格式（`metadata.internal` + 结构化流程），按需精选引入。
3. Agents 体系补齐高价值角色，统一角色命名，`opencode.json` 接入。
4. 规范文档补齐缺口（api / git / security / ai-collaboration / ai-governance 等），修复现有死链。
5. 引入 AI 治理脚本（`ai:check`、`lint:md`、外部 skill 准入清单），防止镜像漂移。
6. i18n 规划参考 momei 升级（Locale Registry、模块化消息、回退链分级、better-auth locale 映射、治理脚本）。

## 2. 现状盘点

| 资产 | 现状 | 结论 |
|---|---|---|
| Skills | 6 个，全部旧版 Copilot 格式（`version: 1.0.0`、`author: GitHub Copilot`、`applyTo`/`tools`） | 需全量升级 + 精选扩展 |
| Agents | 4 个（`full-stack-developer`、`documentation-specialist`、`quality-guardian`、`test-engineer`） | 需统一命名 + 补齐角色 |
| 镜像机制 | `scripts/setup-ai.mjs` 维护 `.claude`/`.agents`/`.opencode` 链接 `.github` 主定义 | ✅ 保留，补充校验脚本 |
| 规范文档 | `docs/standards/` 仅 4 份；`api.md` 不存在但被引用（死链）；`docs/design/api.md`、`docs/PLAN.md` 均为死链引用 | 需补齐与修复 |
| AI 配置 | 无 `opencode.json`、无 `CLAUDE.md`、无 `.cursor`；`.github/copilot-instructions.md` 为旧格式且含死链 | 需新增与精简 |
| i18n | 仅 `docs/standards/i18n.md` 基础规划，零落地（无依赖、无 `locales/`、无治理脚本） | 需按 momei 升级规划 |

## 3. 参考项目经验映射与采纳原则

### 3.1 采纳（忠实参照）

| 经验 | 来源 | 适配方式 |
|---|---|---|
| `AGENTS.md` 唯一权威事实源结构（冲突顺序 → 命令表 → 方法论 → 角色矩阵 → 镜像治理 → 提交红线） | momei / dependfix | 按本项目规模精简（dependfix 口径） |
| Skills 新格式（`metadata.internal`、结构化 Step 流程、`references/`） | cmyr-skills-agents | 全量同步现有 6 个 + 精选引入 |
| `opencode.json`（`default_agent` + agent prompt 引用 `.github/agents/` 主定义） | momei / dependfix | 直接采纳 |
| `CLAUDE.md` 平台适配层（目录发现、冲突处理、常用命令、Git 规则） | momei | **精简为引用式**，以 `AGENTS.md` 为主，不重复编写 |
| `.github/copilot-instructions.md` 精简引用模式 | momei | 重写为引用式，修复死链 |
| 规范体系拆分（`ai-collaboration` / `ai-governance` / `git` / `security` / `planning` / `external-skills-intake`） | momei / dependfix | 按本项目规模补齐 |
| `scripts/ai/check-governance.mjs`（`ai:check`：frontmatter、镜像一致性、死链、外部 skill 清单） | momei | 直接引入，删除不适用项 |
| `external-skills-registry.json` + `external-skills-intake.md`（外部 skill 准入清单） | momei | 按本项目采纳（nuxt / vue / vitest / vitepress / pnpm 等） |
| i18n 治理体系（Locale Registry、模块化消息、回退链分级、服务端装配、审计脚本、`vitest.i18n.config.ts`、`lint:i18n`） | momei | 重点吸收（见第 6 节） |

### 3.2 排除（不适用于本项目）

| 资产 | 排除理由 |
|---|---|
| `super-search`、`opencode-usage`、`opc-*` 系列 | 个人/全局工具，非项目开发能力 |
| `security-alert-remediator`、`multi-repo-alert-remediator`、`dependfix-remediator` | 属于 dependfix 项目本体能力 |
| `pnpm-major-migrator`、`git-flow-manager` | 低频维护场景，按需再引入 |
| `backend-logic-expert`、`database-expert`、`vue-frontend-expert` | momei 项目特化版；改取 cmyr 源仓库通用版 `backend-expert` / `frontend-expert` |
| momei 的 9 个 agents | 精简为 6-7 个高价值角色 |
| `.session/` session 治理、`.opencode/plugins/`、hooks | 锦上添花，列为二期可选 |
| `performance.md`（Lighthouse/Bundle 预算体系） | 本项目无对应性能预算基建，暂不引入 |

## 4. 优化点清单（分批复核顺序）

### 第一批：基础设施骨架

- [ ] 重构 `AGENTS.md` 为权威事实源模式（momei 结构 × dependfix 精简度）
- [ ] 新增 `opencode.json`（`default_agent: full-stack-master` + agent 引用 `.github/agents/` 主定义）
- [ ] 新增 `CLAUDE.md`（精简引用式，指向 `AGENTS.md`）
- [ ] 重写 `.github/copilot-instructions.md` 为精简引用式
- [ ] 修复死链：补 `docs/standards/api.md`；修正 agent / 文档中对 `docs/design/api.md`、`docs/PLAN.md` 的引用

### 第二批：技能与角色

- [x] 从 cmyr-skills-agents 同步 6 个现有 skill 为新格式，升级为项目适配版（补 `metadata.internal`）
- [x] 精选引入新 skills（约 10-12 个）：
    `frontend-expert`、`backend-expert`、`devops-specialist`、`technical-architect`、`requirement-analyst`、`security-guardian`、`code-reviewer`、`ui-validator`、`qa-assistant`、`gh-cli`、`full-stack-master`
- [x] Agents 升级：`full-stack-developer` → `full-stack-master`；新增 `code-auditor`、`ui-validator`、`qa-assistant`（`product-manager` 留待二期评估）

### 第三批：规范文档

- [x] 新增 `docs/standards/ai-collaboration.md`（PDTFC 流程细节 + 验证矩阵，按本项目规模精简）
- [x] 新增 `docs/standards/ai-governance.md`（镜像治理 + 生命周期）
- [x] 新增 `docs/standards/git.md`、`docs/standards/security.md`（dependfix 版本精简）
- [x] 新增 `docs/standards/api.md`（基于实际 handler 契约，第一批已随死链修复落地）
- [x] 新增 `docs/standards/external-skills-intake.md` + `.github/external-skills-registry.json`（配套 ai-governance 引用，提前至本批落地）

### 第四批：治理脚本与 i18n

- [ ] 新增 `scripts/ai/check-governance.mjs` + `package.json` 增加 `ai:check`、`lint:md`（含 `lint-md` 依赖）
- [x] 新增 `external-skills-registry.json` + `docs/standards/external-skills-intake.md`（已提前至第三批落地）
- [ ] i18n 规划升级（见第 6 节）

### 二期可选

- [ ] `.session/` session 治理（current-task.yaml / wisdom.md / runtime-state.json + 蒸馏机制）
- [ ] `.opencode/plugins/` session 钩子、`scripts/ai-hooks/`
- [ ] `product-manager` agent 与 `planning.md` 规范

## 5. 各批次完成定义

| 批次 | 完成定义 |
|---|---|
| 第一批 | `AGENTS.md` / `CLAUDE.md` / `opencode.json` 就绪；无死链；`pnpm lint:md` 通过（如已引入） |
| 第二批 | `.github` 主定义 + `.claude`/`.opencode`/`.agents` 镜像逐文件一致；`ai:check` 通过 |
| 第三批 | 规范文档齐全且被 `AGENTS.md` 引用；所有相对链接可解析 |
| 第四批 | `ai:check` 无 error；外部 skill 清单文档与 JSON 一致；i18n 规划更新完成 |

## 6. i18n 专项规划（参考 momei）

### 6.1 现状与差距

当前 `docs/standards/i18n.md` 为基础规划（`@nuxtjs/i18n` + 双语言包），缺少 momei 已验证的治理经验：

| momei 经验 | 现状 | 适配说明 |
|---|---|---|
| `Locale Registry` 集中管理语言元数据 + 回退链 | ❌ 无 | 引入 `i18n/config/locale-registry.ts` 概念 |
| `ui-ready` / `seo-ready` 分级准入 | ❌ 无 | 先 UI 后 SEO 放量，避免半成品进索引 |
| 模块化消息加载（`<locale>/<module>.json` + lazy） | ⚠️ 仅规划 4 个粗粒度模块 | 按 `common` / `auth` / `admin` / `profile` 等业务域拆分 |
| 服务端共享 Locale Registry + 回退装配 | ❌ 未涉及 | 本项目有 MJML 邮件模板，需服务端装配设计 |
| `better-auth-localization` 边界适配映射 | ⚠️ 未涉及 | 本项目使用 better-auth，`zh-Hans`/`zh-Hant` 仅作认证插件边界适配值，不能成为项目内部标准 |
| i18n 治理脚本（audit-locale-keys / check-locale-parity / audit-duplicate-messages） | ❌ 无 | 引入对应规划与脚本命名 |
| `vitest.i18n.config.ts` + `lint:i18n` 门禁 | ❌ 无 | 引入运行时 i18n 测试与慢规则校验 |
| 邮件模板多语言（服务端 locale 感知） | ⚠️ 有提及无设计 | 按用户 `preferredLanguage` 自动切换 MJML 模板 |

### 6.2 规划落地要点

1. **语言标识规范**: 项目内部统一 `zh-CN` / `en-US`（与 PrimeVue / Nuxt i18n 对齐）；`better-auth-localization` 的 `zh-Hans` / `zh-Hant` 仅作认证插件边界适配值，由认证层映射回内部 locale。
2. **Locale Registry**: `i18n/config/locale-registry.ts` 统一维护启用语言、默认语言、路由前缀、回退链与就绪度（`ui-ready` / `seo-ready`）。
3. **模块化消息**: `i18n/locales/<locale>/<module>.json` 多文件结构，Nuxt i18n `lazy + files[]` 按模块装配；后台按业务域拆分为 `admin-*` 独立模块。
4. **服务端装配**: 服务端翻译加载器与前端共享 Locale Registry，按模块合并读取 + 非默认语言回退；MJML 模板按用户语言切换；错误消息与日志语言化。
5. **治理门禁**: `scripts/i18n/audit-locale-keys.mjs`（key parity + 未翻译项）、`check-locale-parity.mjs`（语言间 parity）、`audit-duplicate-messages.mjs`（重复消息）；`vitest.i18n.config.ts` 运行时验证；`lint:i18n` 慢规则。
6. **分级准入**: 新语言先 `ui-ready`（可切换、可渲染、不索引），满足 key parity + 审计通过 + 邮件覆盖后升 `seo-ready`（sitemap / feed / SEO）。

### 6.3 里程碑

| 里程碑 | 内容 | 前置 |
|---|---|---|
| M1 | 升级 `docs/standards/i18n.md` 规划（本规划第 6.2 节落地） | 本批 |
| M2 | 安装 `@nuxtjs/i18n`、建 `locales/` 目录与 Locale Registry | 后续独立任务 |
| M3 | 全量页面替换 + 服务端装配 + 邮件多语言 | 依赖 M2 |
| M4 | 治理脚本 + CI 门禁 + 运行时测试 | 依赖 M2/M3 |

## 7. 关联文档

- 权威事实源: [AGENTS.md](../../../AGENTS.md)（本规划实施后）
- 现有规范: [开发规范](../../standards/development.md) | [测试规范](../../standards/testing.md) | [国际化实施方案](../../standards/i18n.md)
- 参考蓝本: momei `docs/standards/ai-collaboration.md` / `ai-governance.md` / `docs/design/modules/i18n.md`；dependfix `AGENTS.md`
- 源仓库: cmyr-skills-agents `skills/` / `agents/`
