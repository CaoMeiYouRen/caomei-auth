# Git 工作流规范 (Git Workflow Standards)

## 1. 分支策略

| 分支 | 职责 |
|------|------|
| `master` | 主分支，承载稳定代码、版本发布与验收合并。 |

补充约束：

- 简单 `fix`、`docs` 类维护工作可直接在 `master` 完成。
- 功能开发创建独立分支，命名格式：`feature/<功能描述>`。
- 某功能确实需要长期维护时，应创建独立分支而不是把分支树堆到项目目录。

## 2. 合并与集成

- **Review 前置**: 任何改动在进入 commit 之前必须先经过一次 review（`@code-auditor` Review Gate）。
- **未闭环禁止提交**: review 指出问题但未形成结论的，不得继续 commit 或合并。
- **合并方式**: 功能分支完成后通过合并到 `master` 收口（Pull Request / Merge Request）。

## 3. 提交规范

所有 `git commit` 操作必须遵循以下约束（与 `AGENTS.md` 提交规范一致）：

1. **必须使用 `conventional-committer` skill**：任何代码、文档、配置或脚本的提交都必须通过 `conventional-committer` skill 执行。禁止直接使用 `git commit -m "..."` 裸提交。
2. **格式要求**：提交消息必须符合 Conventional Commits 规范（`type(scope): description`），且 `description` 统一使用**中文或用户使用的语言**。
3. **质量前置**：提交前必须确认 `@code-auditor` Review Gate 已放行、`@quality-guardian` 质量核查已通过，且 `pnpm lint`、`pnpm typecheck` 和必要的定向测试均已通过。质量门禁未通过时不得提交。
4. **原子粒度**：一个提交对应一个逻辑变更，关联且仅关联 `docs/plan/todo.md` 中的一个原子条目。
5. **推送禁令**：`git commit` 后不得自动执行 `git push`，推送仅限用户明确要求时执行。提交完成后应告知用户"已提交到本地，等待推送确认"。

### 3.1 提交消息格式

提交消息遵循 Conventional Commits 格式：`<type>(<scope>): <subject>`，可附带正文。

**提交策略（默认单次提交）**：

1. 先判断改动是否为原子任务，是否命中当前 Todo 条目。
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

- **禁止擅自推送**: commit 后不得自动执行 `git push`，除非用户明确指示。
- **改动前检查**: 每次改动前执行 `git status` 确认工作区干净。
- **远程同步**: 开始前获取远端更新（`git fetch` + `git log HEAD..@{u}`），有新增提交先 `git pull --rebase` 同步。
