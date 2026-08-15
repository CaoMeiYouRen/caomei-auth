# AI 资产治理规范 (AI Governance Standards)

本文档定义项目内 Skills / Agents 资产的分层、命名、库存、镜像、生命周期与清理规则。项目级 AI 行为准则、角色边界、PDTFC 流程与安全红线仍以 [AGENTS.md](../../AGENTS.md) 为唯一权威事实源；本文只负责治理"这些定义文件如何被组织、同步、审查和淘汰"。

## 1. 权责边界

1.  **项目级规则来源**：`AGENTS.md` 负责定义项目级角色矩阵、冲突顺序、默认路径与安全红线。
2.  **治理规范职责**：本文负责定义 repo 内 Skills / Agents 的目录边界、命名方式、镜像要求、生命周期、弃用与清理口径。
3.  **平台适配文件职责**：`CLAUDE.md`、`.github/copilot-instructions.md` 等入口文件只负责平台差异、发现顺序和最小门禁，不得重写项目级规则。

## 2. 资产分层

### 2.1 项目内部维护资产

以下定义属于项目内部维护资产，由仓库负责版本控制、镜像同步与治理审查：

- `.github/agents/*.agent.md`
- `.github/skills/<skill-name>/SKILL.md`
- `.github/skills/<skill-name>/references/`
- `.github/skills/<skill-name>/scripts/`
- `.github/skills/<skill-name>/assets/`
- `.claude/agents/**` 与 `.claude/skills/**` 中与上述主定义逐文件对应的镜像内容
- `.opencode/agents/**` 与 `.opencode/skills/**` 中与上述主定义逐文件对应的镜像内容
- `.agents/agents/**` 与 `.agents/skills/**` 中与上述主定义逐文件对应的镜像内容

约束如下：

1.  `.github/` 是主定义目录。
2.  `.claude/`、`.opencode/` 与 `.agents/` 只承担平台兼容镜像职责（由 `scripts/setup-ai.mjs` 维护链接），不允许独立扩展另一套角色体系。
3.  任何内部定义调整都必须先改 `.github/` 主定义，再同步各平台镜像。
4.  项目内部维护的 skill 必须在 frontmatter 中显式声明 `metadata.internal: true`，作为内部可见性边界的唯一机器可读标识。

### 2.2 外部同步或平台提供资产

以下内容属于外部来源，不纳入项目内部库存，也不应镜像进 `.github/` / `.claude/` / `.opencode/` / `.agents/`：

- 编辑器或扩展自带的外部 skill，例如 `copilot-skill:/...`
- 用户全局目录或第三方仓库中的示例 skill / agent
- 仅用于参考的外部模板、附件或上游实现

约束如下：

1.  外部资产只允许作为参考来源或调用入口，不得伪装成项目内部定义。
2.  若需要吸收外部方案，必须按本项目规范重写为内部定义，而不是直接复制成长期镜像。
3.  首批允许引用的外部 skills 及其来源、同步地址、更新频率、失效处理与转内部化门槛，以 [外部 Skills 准入清单](./external-skills-intake.md) 与 `.github/external-skills-registry.json` 为准。
4.  **先验来源核验（投毒面防御）**: 引入任何外部 skill / agent / MCP / 模板前，必须核对来源仓库 URL 与维护组织是否为可信主体，禁止仅凭"内容看起来有用"直接采纳。来源不明的资产必须登记到准入清单并完成来源核验后才能引用。

## 3. 目录与命名规范

### 3.1 Skills

1.  skill 目录名必须使用 `kebab-case`，并与 `SKILL.md` frontmatter 中的 `name` 完全一致。
2.  内部 skill 的 frontmatter 必须至少包含 `name`、`description`、`metadata.internal` 三项；其中 `metadata.internal` 固定为 `true`。
3.  skill 根目录只保留该 skill 的主定义与配套资源，不得混入其他 skill 的副本。
4.  `references/` 只存放清单、模板、示例或说明材料。
5.  `scripts/` 只存放该 skill 独占且需要随 skill 一起维护的辅助脚本；若脚本已成为仓库公共治理能力，应回收至 `scripts/<domain>/`。
6.  `assets/` 只存放该 skill 运行必需的静态资源，不得把临时草稿或截图长期堆积在其中。

### 3.2 Agents

1.  agent 文件必须使用 `kebab-case.agent.md`。
2.  `name` 应体现角色名，`description` 必须能成为真实触发面，而不是抽象介绍。
3.  agent 文件只保留角色定位、输入输出、交接边界和禁区，不重复抄写完整项目规范。

## 4. 库存与引用关系治理

1.  每个内部 skill / agent 都必须至少满足以下任一条件，否则视为待清理对象：
    - 被 `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md` 或规划文档明确引用。
    - 被其他内部 agent / skill 作为推荐依赖引用。
    - 属于当前阶段明确保留、但尚未广泛接入的治理定义，并在规划文档中有清晰落点。
2.  长期未被引用的定义，不得以"以后可能用得上"为理由无限保留，应进入弃用或清理流程。
3.  任何 inventory 变更都必须同步核对以下位置是否仍一致：
    - 物理目录 `.github/agents/`、`.github/skills/`
    - 镜像目录 `.claude/agents/`、`.claude/skills/`、`.opencode/agents/`、`.opencode/skills/`、`.agents/agents/`、`.agents/skills/`
    - 开发入口与导览文档（`AGENTS.md`、`CLAUDE.md`、`copilot-instructions.md`）
    - 治理脚本的校验范围（`scripts/ai/check-governance.mjs`，若已引入）

## 5. 镜像同步规则

1.  `.github/` 与各平台镜像（`.claude/`、`.opencode/`、`.agents/`）必须逐文件一致，包含主定义和配套资源，而不只是 `SKILL.md` 或 `.agent.md` 本体。
2.  镜像漂移、缺失文件、额外残留文件或额外残留目录都属于治理缺陷。
3.  若平台能力差异需要补充说明，应写在 `CLAUDE.md` 或平台入口文档中，而不是在镜像目录中偷偷改职责边界。
4.  修改内部定义后，至少执行以下校验：
    - `pnpm ai:check`（若已引入）
    - `pnpm lint:md`（若已引入）
    - 若改动触及脚本或配置，再补对应静态检查与运行验证

## 6. 生命周期与弃用流程

内部 Skills / Agents 默认采用以下生命周期：

| 状态 | 含义 | 允许动作 |
| :--- | :--- | :--- |
| `proposed` | 已有需求或方案，但尚未成为正式资产 | 允许评估和临时草稿，不允许长期镜像 |
| `active` | 正式在库并纳入治理检查 | 必须满足命名、引用、镜像与校验要求 |
| `deprecated` | 仍存在兼容需求，但不再推荐继续扩写 | 必须写明替代方案、保留原因与移除条件 |
| `removed` | 已从主定义和镜像清除 | 同步清理入口引用、历史残留与无效脚本 |

弃用时至少要说明：

1.  为什么弃用。
2.  替代定义是什么。
3.  还剩哪些消费者或入口未迁移。
4.  何时允许彻底删除。

## 7. 维护责任

1.  **项目内部维护资产**：由仓库维护者负责长期治理；当前执行该治理任务的主责角色负责本轮改动的同步、校验与收口。
2.  **外部资产**：由上游维护；本仓库负责记录接入边界、引用方式和失效后的清理策略。
3.  **镜像责任**：任何修改内部主定义的人，必须在同一次任务中同步各平台镜像（或确认其为指向 `.github/` 的链接），不能把镜像修正留给后续"顺手处理"。

## 8. 清理与审计要求

出现以下任一情况时，应触发治理清理：

- 镜像漂移或镜像残留目录
- 无引用定义长期保留
- 职责高度重叠的重复 skill / agent
- 外部模板被直接复制进仓库后长期未项目化改造
- `description`、frontmatter、相对链接或目录结构导致发现 / 编译失败
- `metadata.internal` 缺失、值漂移或与资产分层结论不一致

最低审计输出至少包含：

1.  变更范围
2.  当前库存与镜像状态
3.  已执行治理校验
4.  清理结论或保留理由
5.  后续迁移或补跑计划

## 9. 变更前检查

- 是否明确区分了内部资产与外部参考资产。
- 是否先改 `.github/` 主定义，再同步各平台镜像。
- 是否补齐了引用关系，而不是只创建物理文件。
- 是否为弃用或清理提供了明确理由和替代方案。
- 是否执行了 `pnpm ai:check` 与相应的 Markdown / 脚本校验（若已引入）。
