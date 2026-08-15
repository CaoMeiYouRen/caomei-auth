# AI 代理配置文档 (AGENTS.md)

## 1. 概述

本文档旨在规范草梅 Auth 项目中 AI 代理（Agents）与智能助手的配置、协作模式及行为准则，确保 AI 在高效辅助开发的同时符合项目的高质量标准。

## 2. 权威事实源与冲突处理顺序

-   `AGENTS.md` 是平台无关的唯一权威事实源，负责定义项目级 AI 行为准则、职责边界、PDTFC 工作流与安全红线。
-   `CLAUDE.md`、`.github/copilot-instructions.md` 与其他平台适配文档仅承担工具适配、开发者引导与差异补充说明，不得与 `AGENTS.md` 并列定义核心规则。
-   冲突处理顺序如下：
    1. `AGENTS.md` 与其显式引用的项目规范文档（如开发、API、测试、文档规范）。
    2. 平台专属适配文件中与工具能力、加载顺序、目录回退相关的补充说明。
    3. 开发入口说明（如 `README.md`、文档站导航、开发指南）中的导览性提示。
-   若平台能力受限，只允许补充"工具差异、降级策略与回退路径"，不得覆盖或改写项目级行为准则。

## 3. 项目基本信息

-   **项目名称**: 草梅 Auth 统一登录平台
-   **核心框架**: Nuxt 4.x (Vue 3.x + TypeScript)
-   **UI 设计**: SCSS (BEM) + PrimeVue
-   **后端**: better-auth + TypeORM + Nitro Server Routes
-   **数据校验**: Zod（单一事实来源，前后端共享 Schema）
-   **包管理器**: PNPM
-   **主题色**: 红色系 (#e63946)
-   **开发约束**: ESLint + Stylelint + Conventional Commits + PDTFC 循环

### 3.1 常用命令

| 分类 | 命令 | 说明 |
|------|------|------|
| 开发 | `pnpm dev` | 启动开发服务器 |
| 开发 | `pnpm build` | 构建生产版本 |
| 开发 | `pnpm generate` | 生成静态站点 |
| 开发 | `pnpm preview` | 预览构建后的应用 |
| 测试 | `pnpm test` | 运行所有测试 |
| 测试 | `pnpm test:coverage` | 运行测试并生成覆盖率报告 |
| 质量 | `pnpm lint` | 运行 ESLint 并自动修复 |
| 质量 | `pnpm lint:css` | 运行 Stylelint 并自动修复 |
| 质量 | `pnpm lint:duplicate` | 运行 jscpd 重复代码检查 |
| 质量 | `pnpm typecheck` | 运行 TypeScript 类型检查 |
| 提交 | `pnpm commit` | 使用 Commitizen 引导提交 |
| 文档 | `pnpm docs:dev` | 启动文档开发服务器 |
| 文档 | `pnpm docs:build` | 构建文档 |

## 4. AI 编程配置与指导

### 4.1 核心编程准则

AI 在生成或修改代码时，必须优先参考 [开发规范](./docs/standards/development.md) 与 [API 规范](./docs/standards/api.md)，确保在 TypeScript、Vue 风格、样式规范及国际化等方面的一致性：

-   **类型安全**: 严禁使用 `any`，优先 `unknown` 或具体类型定义，使用类型收窄函数。
-   **显式优于隐式**: 类型、导入、导出都应明确声明；早返回，少嵌套。
-   **最小变更原则**: 只改必须改的，不做无关重构。
-   **技术栈偏好**: 优先使用项目中已集成的库（`dayjs`、`lodash-es`、`fs-extra`、`google-libphonenumber`、内部 `logger`），新增依赖前确认项目中没有功能相近的已有依赖。
-   **校验模式**: 使用 `utils/shared/` 下的 Zod Schema 作为单一事实来源，前端 `useForm` + 后端 `schema.parse` 共用。
-   **UI 文本**: 禁止硬编码中文/英文字符串，统一遵循 [国际化实施方案](./docs/standards/i18n.md) 从语言包读取。

### 4.2 Agent-First 方法论

本项目默认采用 Agent-First 的协作方式：用户应直接把目标交给 Agent，而不需要先区分 script、skill 和 agent；一次性需求由 Agent 直接完成，可复用流程由 Agent 沉淀为 skill。对于反复出现的高频任务，Agent 应持续演化既有 skills，而不是长期依赖用户重复描述同一类工作流。

### 4.3 信息获取与搜索优先原则 (Search-First)

AI 代理在遇到以下情况时，**必须优先使用搜索工具获取一手信息**，严禁仅凭训练记忆生成答案：

- 同一问题修复失败 >= 2 次，或根因分析不明确
- 涉及不熟悉的库/框架/API、跨平台差异或安全合规判断
- 需要外部文档、版本迁移指南或社区方案来支撑决策

搜索时应遵循多源交叉验证，优先采纳官方文档与权威社区来源，关键事实至少 2 个独立来源确认。

## 5. 协作工作流 (PDTFC 循环)

为了保证交付质量，任何功能开发任务必须严格遵循 PDTFC (Plan-Do-Test-Fix-Commit) 循环：

1.  **P (Plan)**: 分析任务上下文（`context-analyzer` skill）；核对 `docs/plan/todo.md` 与 `docs/plan/roadmap.md` 确认规划归属；更新设计文档（`docs/design/`）；输出受影响文件清单与技术路径。
2.  **D (Do)**: 使用 `nuxt-code-editor` skill 编写代码；必须阅读并严格遵守 [开发规范](./docs/standards/development.md)、[API 规范](./docs/standards/api.md) 与 [测试规范](./docs/standards/testing.md)；始终使用 TypeScript、Vue 3 Composition API、SCSS BEM 和 i18n 规范。
3.  **T (Test)**: 运行本地测试（`pnpm test`）与 Lint 检查（`pnpm lint`、`pnpm lint:css`、`pnpm typecheck`）；复杂测试增强可移交 `@test-engineer`。
4.  **F (Fix)**: 分析测试失败原因并修复；修复过程中如有重大逻辑变动，同步记录到 `@documentation-specialist`；同一问题修复失败 >= 2 次时，必须先触发搜索优先流程，不得用同一思路反复重试。
5.  **C (Commit)**: 提交前必须通过 `@code-auditor` Review Gate 放行，并经 `@quality-guardian` 质量核查（`pnpm typecheck`、`pnpm lint`、`pnpm lint:css`），严禁在存在类型错误或 Lint 警告的情况下提交；调用 `conventional-committer` skill 生成符合 Conventional Commits 规范的提交信息；确保 `@documentation-specialist` 已完成文档补全。

### 5.1 迭代中途发现事项处理规则

当智能体在任一阶段发现新增事项时：

1. **先暂停扩写**：判断该事项是否已在当前待办或当前验收范围内。
2. **允许插队的范围**：仅限阻塞当前交付、明确功能回归、高风险安全/合规问题或导致当前任务无法闭环的基础缺陷，且必须补充"为何插队"的文字说明。
3. **默认延期的范围**：体验优化、洁癖式重构、探索性能力、非紧急依赖升级，默认记录到 `docs/plan/roadmap.md` 或其他规划载体，不打断当前阶段。
4. **禁止静默膨胀**：不得在未告知用户的情况下，把一个原子任务扩展成新的功能包或新的子阶段。

## 6. AI 智能体体系 (AI Agents Matrix)

项目通过多智能体协同模式驱动开发，每个阶段必须有明确唯一的主责角色，避免多个智能体在同一阶段重复承担同类职责。

| 智能体 | 适用场景 | 主要输出 | 必经交接点 | 不应承担 |
| :--- | :--- | :--- | :--- | :--- |
| `@full-stack-master` | 默认开发主责角色；驱动 PDTFC 全循环，负责需求分析、方案设计、前后端实现到测试修复和最终提交 | 全栈代码改动、测试、提交、阶段编排 | 代码落地后交 `@code-auditor` 审计；涉及界面交 `@ui-validator`；复杂测试交 `@test-engineer`；文档交 `@documentation-specialist` | 不应绕过质量审查、测试和文档收口直接宣布完成 |
| `@code-auditor` | 所有代码改动完成后的强制 Review Gate；执行结构化审查（正确性、安全、架构、规范一致性） | 审计结论（Pass/Reject）、问题分级（blocker/warning/suggest） | Pass 后才能进入提交或后续阶段；Reject 时退回对应开发者 | 不应承担需求定义、功能开发主责或测试增强主责 |
| `@quality-guardian` | 质量检查执行者；运行类型检查、Lint、测试等质量门 | 质量检查结论、缺陷清单 | 检查通过后才能进入提交；失败时退回对应开发者 | 不应承担需求定义、功能开发主责 |
| `@test-engineer` | 测试补强、回归验证、覆盖率提升 | 新增/修正测试、运行结果、剩余缺口 | 测试代码变更仍需交 `@code-auditor` 审看 | 不应承担需求规划、视觉验收或替代质量审计 |
| `@ui-validator` | 页面可视化变更后的浏览器验证、响应式/主题验证 | 验证记录、截图/结论、回退问题清单 | UI 通过后交 `@test-engineer` 或回到开发者修复 | 不应承担业务逻辑实现、产品规划或替代自动化测试 |
| `@qa-assistant` | 只读问答、代码/文档检索、架构解释 | 证据化回答、定位结果、推荐阅读路径 | 如需修改代码或文档，转交对应执行角色 | 严禁修改代码、配置或规划文档 |
| `@documentation-specialist` | 设计文档、规范文档、README/Plan 同步维护 | 文档更新、同步说明 | 规划类文档与开发结论对齐 | 不应虚构未实现能力或替代产品验收 |

### 6.1 默认推荐路径

1. 代码实现阶段默认由 `@full-stack-master` 统一负责需求理解、方案设计与前后端落地。
2. 任何代码改动收尾都必须进入 `@code-auditor` Review Gate，不能用"已本地验证"替代审计结论。
3. 涉及实际页面或交互渲染的改动，再交 `@ui-validator` 做浏览器验证。
4. 测试补强与回归验证由 `@test-engineer` 主责承担。
5. 设计、规范、README 与 Plan 文档同步由 `@documentation-specialist` 承担。

### 6.2 主定义、镜像与 Skills 复用治理

-   `.github/agents/` 与 `.github/skills/` 是项目内 agent / skill 的主定义目录，负责维护角色名、职责边界、引用关系与推荐路径。
-   `.claude/agents/` 与 `.claude/skills/` 是 Claude 发现入口的兼容镜像，`.opencode/agents/` 与 `.opencode/skills/` 是 OpenCode 发现入口的兼容镜像，`.agents/agents/` 与 `.agents/skills/` 是通用 Agent 入口的兼容镜像；所有平台镜像必须与 `.github/` 保持同名、同库存、同职责边界（本地以链接形式指向主定义，由 `scripts/setup-ai.mjs` 维护），不得独立发明另一套角色体系。
-   Agent 文件应优先引用既有 skills 与项目规范文档，只保留角色定位、输入输出、交接点和禁区；PDTFC 全流程、质量门禁及专项规则应沉淀在 `AGENTS.md`、专项 skills 与规范文档中，不在多个 agent 文件里重复抄写。
-   任何 agent / skill 库存变更，都应同步更新 `AGENTS.md`、平台适配入口文档，以及受影响的 `.github/` / `.claude/` / `.opencode/` / `.agents/` 镜像文件，避免角色名、路径和 fallback 约定漂移。

## 7. 安全与行为红线

### 7.1 核心文件保护

-   严禁修改或删除 `.env`；非必要不得读取 `.env`，应当优先参考 `.env.example` 了解环境变量字段。
-   修改本文件 `AGENTS.md` 前必须询问用户，并得到用户明确指示。
-   严禁在代码中硬编码任何 API Key、Token 或敏感凭据；严禁将 `.env` 文件提交到 Git。
-   用户输入必须经过 Zod Schema 校验和清洗后再使用；SQL 查询必须使用参数化，禁止拼接。

### 7.2 Git 工作树与隔离

-   开始改动前先检查 `git status` 确认工作区干净，并检查远程分支是否有新提交（`git fetch` + `git log HEAD..@{u}`），有则先 `git pull --rebase` 同步。
-   需要删除文件时，只能一次删除一个明确路径的文件，禁止批量删除文件或目录。

### 7.3 提交规范 (Commit Convention)

所有 `git commit` 操作必须遵循以下约束：

1. **必须使用 `conventional-committer` skill**：任何代码、文档、配置或脚本的提交都必须通过 `conventional-committer` skill 执行。禁止直接使用 `git commit -m "..."` 裸提交。
2. **格式要求**：提交消息必须符合 Conventional Commits 规范（`type(scope): description`），且 `description` 统一使用**中文或用户使用的语言**。
3. **质量前置**：提交前必须确认 `@code-auditor` Review Gate 已放行、`@quality-guardian` 质量核查已通过，且 `pnpm lint`、`pnpm typecheck` 和必要的定向测试均已通过。质量门禁未通过时不得提交。
4. **原子粒度**：一个提交对应一个逻辑变更，关联且仅关联 `docs/plan/todo.md` 中的一个原子条目。
5. **推送禁令**：`git commit` 后不得自动执行 `git push`，推送仅限用户明确要求时执行。提交完成后应告知用户"已提交到本地，等待推送确认"。
6. **提交钩子**：提交必须通过 husky 钩子（commitlint / lint-staged），禁止使用 `--no-verify` 跳过。

## 8. 其他要求

1.  **多语言响应**: 在与用户沟通时，应使用用户发送的语言进行回复（默认为中文）。
2.  **重大变更确认**: 在进行涉及架构、核心逻辑或项目路线图的重大变更前，必须主动向用户请求确认。
3.  **性能下限原则**: 使用的 AI 智能体，其基础能力不应低于 Gemini 3 Flash / Claude Sonnet 4.5 / GPT-5 这一档的大模型水平。

## 9. 相关文档

-   **规划**: [项目路线图](./docs/plan/roadmap.md) | [待办事项](./docs/plan/todo.md) | [AI 基建优化规划](./docs/design/governance/ai-infrastructure-optimization.md)
-   **规范**: [开发规范](./docs/standards/development.md) | [API 规范](./docs/standards/api.md) | [测试规范](./docs/standards/testing.md) | [文档规范](./docs/standards/documentation.md) | [国际化实施方案](./docs/standards/i18n.md) | [Git 规范](./docs/standards/git.md) | [安全规范](./docs/standards/security.md) | [AI 协作规范](./docs/standards/ai-collaboration.md) | [AI 资产治理规范](./docs/standards/ai-governance.md) | [外部 Skills 准入清单](./docs/standards/external-skills-intake.md)
-   **设计**: [架构设计](./docs/design/architecture.md) | [UI/UX 设计](./docs/design/ui-ux.md) | [数据库设计](./docs/design/database.md)
-   **API 参考**: [API 文档](./docs/api/)
-   **适配与入口**: [Claude 适配说明](./CLAUDE.md) | [Copilot 指令](./.github/copilot-instructions.md) | [项目主页入口](./README.md)

---

> 本文档会随着项目发展持续更新，确保 AI 代理配置与项目需求保持同步。
