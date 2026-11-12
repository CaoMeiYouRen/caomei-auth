# Git 工作流规范 (Git Workflow Standards)

## 1. 分支策略

| 分支 | 职责 |
|------|------|
| `master` | 主分支，承载稳定代码、版本发布与验收合并。 |

补充约束：

- 简单 `fix`、`docs` 类维护工作可直接在 `master` 完成。
- 功能开发创建独立分支，命名格式：`feature/<功能描述>`。
- 某功能确实需要长期维护时，应创建独立分支而不是把分支树堆到项目目录。
- 开新分支的条件、合并与清理方式见 §9。

## 2. 合并与集成

- **Review 前置**: 任何改动在进入 commit 之前必须先经过一次 review（`@code-auditor` Review Gate）；依赖类 PR 由 CI 门禁替代（§7）。
- **未闭环禁止提交**: review 指出问题但未形成结论的，不得继续 commit 或合并。
- **合并方式**: 功能分支完成后通过合并到 `master` 收口（Pull Request / Merge Request）。
- **来源校验**: 合并 PR 前必须确认作者属于可信提交者（§5），且 CI 通过、Review Gate 放行；依赖类 PR 由 Mergify 按 CI 门禁合并，属已授权例外（§7）。

## 3. 提交规范

所有 `git commit` 操作必须遵循以下约束（与 `AGENTS.md` 提交规范一致）：

1. **必须使用 `conventional-committer` skill**：任何代码、文档、配置或脚本的提交都必须通过 `conventional-committer` skill 执行。禁止直接使用 `git commit -m "..."` 裸提交。
2. **格式要求**：提交消息必须符合 Conventional Commits 规范（`type(scope): description`），且 `description` 统一使用**中文或用户使用的语言**。
3. **质量前置**：提交前必须确认 `@code-auditor` Review Gate 已放行（核验 `pnpm lint`、`pnpm typecheck` 和必要的定向测试证据），质量门禁未通过时不得提交。
4. **原子粒度**：一个提交对应一个逻辑变更，关联且仅关联 `docs/plan/todo.md` 中的一个原子条目；规划 / 治理类改动可关联 `docs/plan/backlog.md` 中的对应候选，并在提交说明中注明。
5. **推送约束**：默认不推送，具体授权情形、目标与前置验证由 [§8 推送策略](#8-推送策略) 单点定义；未授权时提交完成后应告知用户"已提交到本地，等待推送确认"。

### 3.1 提交消息格式

提交消息遵循 Conventional Commits 格式：`<type>(<scope>): <subject>`，可附带正文。

**提交策略（默认单次提交）**：

1. 先判断改动是否为原子任务，是否命中当前 Todo 条目；规划 / 治理类改动可关联 backlog 候选。
2. 判断改动类型：**默认为单次提交**；仅在改动面大、不宜单次落盘时才拆分多个提交。
3. 根据改动内容生成规范的提交消息。

**单次提交**：

```
<type>(<scope>): <subject>
<空行>
- <变更条目>
```

**类型映射（强制）**：

- README、API、`.md`、markdown 等文档类改动一律归为 `docs`。
- unit、e2e、test 等测试文件改动一律归为 `test`。
- 无法确定类型时一律归为 `chore`。

**类型速查表**：

| 类型 | 说明 | 示例（scope） |
| --- | --- | --- |
| `feat` | 新功能 | user、payment |
| `fix` | 缺陷修复 | auth、data |
| `docs` | 文档 | README、API |
| `style` | 格式 / 样式 | formatting |
| `refactor` | 代码重构 | utils、helpers |
| `perf` | 性能优化 | query、cache |
| `test` | 测试 | unit、e2e |
| `build` | 构建系统 | webpack、npm |
| `ci` | 持续集成 | workflows、dependabot |
| `chore` | 杂项维护 | scripts、config |
| `revert` | 回滚 | - |

**书写规则（subject）**：

- `type` 与 `scope` 使用英文。
- subject 使用中文描述改动内容，末尾不加句号。
- 最长 120 字符（推荐上限），commitlint 硬限制 140 字符，超长会触发拦截。
- 只使用简体中文或用户指定语言，无必要不使用脚注；需要标注的放正文中。

**正文规则**：

- 用 `-` 作为列表符号，每行最长 120 字符，内容精炼。
- 说明**做了什么**与**为什么这么做**。
- 使用简体中文或用户指定语言。
- 无必要可不写正文；条目太多时内容应精简。

## 4. AI 行为准则

- **禁止擅自推送**: 默认不推送，`git commit` 后停在本地；仅 [§8 推送策略](#8-推送策略) 授权的情形可执行 `git push`。
- **改动前检查**: 每次改动前执行 `git status` 确认工作区干净。
- **远程同步**: 开始前获取远端更新（`git fetch` + `git log HEAD..@{u}`），有新增提交先 `git pull --rebase` 同步。
- **来源优先**: 处理 issue / PR 前先确认作者身份（§5），外部来源只做只读审查与公开沟通，不修改、不合并。

## 5. 可信提交者与来源校验

处理任何 issue / PR 前，先用 `gh issue view <n> --json author` / `gh pr view <n> --json author` 确认作者身份；具备 write 权限的贡献者名单以 `gh api repos/{owner}/{repo}/collaborators --jq '.[] | select(.permissions.push or .permissions.admin) | .login'` 为准。

| 来源 | 判定 | 默认处理 |
| --- | --- | --- |
| 项目所有者（`CaoMeiYouRen`） | 可信 | 可评估、可合并 |
| 项目贡献者（具备 write 权限的 collaborator） | 可信 | 可合并 |
| `dependabot[bot]`、`dependfix[bot]` 等可信机器人 | 可信 | 命中 Mergify 规则且带 `dependencies` label 时自动合并（§7），否则按常规流程处理 |
| 其他外部作者 | 不可信 | 只读审查与公开沟通，不修改、不合并 |

- 不可信来源的 issue / PR：可以阅读、复现、评论反馈，但不得修改代码后合并。
- `gh` 返回 `app/<bot>`（如 `app/dependabot`）时，视为与 `<bot>[bot]` 同一来源。
- 无法确认身份时按不可信处理，并记录判断依据。

## 6. Issue 处理

- **默认只做调研**：阅读、复现、定位根因，不直接进入实现。
- **项目所有者提交的 issue**：评估后可登记 `backlog.md`；登记不等于启动授权，进入 `todo.md` 仍需用户（项目所有者）决策。
- **外部 issue**：先分析核实，再给出一次简短反馈确认问题是否成立；成立则保留并等待用户（项目所有者）决策是否进 backlog，不成立则说明依据后关闭。结论需以执行角色的技术复核为依据。
- **不重复评论**：先查 `gh issue view <n> --json updatedAt,comments`；若 `updatedAt` 未变化、且上一轮已给过评估，不再追加评论，只在摘要中提及（label 变更、机器人同步不算更新）。
- **上游反馈**：依赖作者为 `CaoMeiYouRen` 的包确认存在相关缺陷时，可向对应上游仓库提交 issue；必须先查重、遵守该仓库的模板与规范，并经用户审查授权后才能提交。与 `CaoMeiYouRen` 存在协作关系的上下游项目同理。
- 讨论、反馈、交流群类 issue（`question` / `help wanted` 等）不按缺陷流程关闭。

## 7. PR 处理

- **依赖类 PR**（`dependabot[bot]`、`dependfix[bot]`）：作者命中 `.github/mergify.yml` 规则且带 `dependencies` label 时走 Mergify 自动合并，依赖升级风险由 CI 门禁承担；未命中（如 dependfix 由 PAT 属主或 `github-actions[bot]` 创建、无 `dependencies` label）按常规流程处理。自动化巡检只修复其 CI 失败，不手动合并。
- **未通过 Mergify 自动合并的 PR**：按常规 PR 处理——审查、修复，再决定保留 / 关闭 / 合并。
- **任何来源的 PR 都必须审查**（依赖类 PR 由 CI 门禁替代，见上）：合并前确认作者可信、CI 通过、Review Gate 放行；不可信来源的 PR 只能给出保留或关闭的结论，不得合并。
- **可信提交者的 PR**：为合并而修正冲突或错误时，仅限简单修改（冲突解决、格式、明显的单点错误）；推送该修复必须符合 [§8](#8-推送策略) 的授权情形或经用户明确指示。涉及逻辑调整或范围变更的复杂修改必须走常规流程（独立分支 + Review Gate）。
- **合并执行**：合并动作由用户或获授权的定时任务执行，执行前必须满足来源可信、CI 通过、Review Gate 放行三项条件；依赖类 PR 由 Mergify 按 CI 门禁合并，属已授权自动化路径，其审查由 CI 门禁替代。合并到 `master` 与推送 `master` 后果等价（触发镜像发布与部署），授权来源同 §8。Mergify 当前门槛为 `Test` job，视觉回归不参与依赖类 PR 的自动合并判定。
- **不重复评论**：先查 `gh pr view <n> --json updatedAt,commits,comments`；`updatedAt` 未变、无新提交且上一轮已评估的，不再重复 comment。

## 8. 推送策略

默认**不推送**：`git commit` 只落在本地，推送需用户明确授权。当前仅在定时任务中获得有限授权，只允许以下三种情形：

1. **修复 CI 状态时**：只有推送触发 CI，才能验证修复是否正确。推送后必须等待该次 CI 结果再决定下一步，同一时间最多允许一个后续改动在跑。
2. **完整条目完成后**：可以推送，但不是默认动作。优先积累若干条改动后一次推送；推送前在本地完成必要验证（长耗时检查可跳过，安全告警门禁由 CI 强制执行、不在可跳过之列），推送后监控 CI；CI 耗时较长时可先继续后续改动。
3. **修复 PR 分支时**：修复 open PR 的 CI 失败，或对可信提交者的 PR 做 §7 允许的简单修正时，可推送到对应 PR 分支（含 `dependabot` / `dependfix` 分支）。推送后同样等待 CI 结果，同一时间最多一个后续推送。

约束：

- 推送目标为 `master` 或对应 PR 分支，禁止 `force push`。
- 推送 `master` 会触发 `Publish Docker Image`（镜像发布与部署）；`Release`（semantic-release）当前仅由每周定时或手动触发，提交 type 决定届时是否发版，非必要不使用 `feat` / `fix`。
- **定时任务上下文标记**：定时任务启动时在 `.session/runtime-state.json` 写入 `automation: { "task": "<任务名>", "startedAt": "<ISO8601>" }`，任务结束或交互式会话启动时清除；仅当 `startedAt` 属于本次运行且 task 匹配时才视为定时任务，无有效标记时按交互式会话处理，默认不推送。
- 授权仅覆盖定时任务；交互式会话仍未获授权，需用户明确指示。

## 9. 分支升级与阶段规划联动

- **开新分支的条件**：改动可能影响项目整体运行状态，或规模明显超出单个原子条目时，开独立分支实施；CI 通过后合并回 `master`，合并后清理该分支。
- **开始下一阶段规划时**：先拉取最新 issue、PR 与 Actions 状态，分析其中有影响的内容（未关闭缺陷、失败工作流、待评估候选），必要时列入下一阶段规划；不得据此自动把 backlog 候选升级为当前阶段。

## 10. 自动化巡检纪律

- 只处理可自动判定的问题；需要产品决策、范围裁定或视觉裁定的内容，记录后停止推进。
- 自动化产生的新候选只登记 `backlog.md`，不得直接写入 `todo.md`。
- 任何自动化动作都要留下证据（命令输出、CI 链接、提交 hash），便于人工复核。
