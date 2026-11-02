# 任务开局检查（CI 回执）

> 新任务开始时先看 CI 回执，再进入规划或实现。目的是避免在「上一轮推送已经把主链路打红」的状态上继续叠加改动。

## 1 触发条件

同时满足才执行：

- 是新任务（不是上一轮任务的续做）；
- 工作区干净（`git status --porcelain` 为空）；
- 当前没有进行中的任务（`.session/current-task.yaml` 无 `in_progress` 项、上一轮 briefing 未声明同一任务）。

`todo.md` 里有未完成条目属阶段常态，不作为跳过依据。

## 2 步骤

1. 取本地 `HEAD` 与上游分支（`@{u}`）的 sha；两个 sha 各查一次，相同则只查一次；`@{u}` 不存在时只查 `HEAD`。
2. 按 commit 查询（不要按分支名查，否则本地在 feature 分支时看不到该分支的 run）；`gh` 版本不支持 `--commit` 时才退回 `--branch <默认分支>` 并仍按 `headSha` 过滤：

   ```bash
   gh run list --commit <sha> --limit 20 \
     --json databaseId,headSha,workflowName,event,conclusion,url
   ```

3. 在 briefing 里单列一行：`CI 回执：通过 / 失败（run 链接）/ 无相关 run / 不可用（原因）`。

### 结论映射

| conclusion | 处理 |
| :--- | :--- |
| `success` | 通过 |
| `failure` / `timed_out` / `startup_failure` | 失败，按第 3 节处置 |
| `action_required` | 待处理：在 briefing 标注，不阻断当前任务 |
| `cancelled` / `skipped` / `neutral` | 不判定，标注即可 |
| 查不到 run | 写「无相关 run」，不得写成通过 |

## 3 处置

- **只处理本次推送引起的失败**：历史失败、Dependabot 分支、与本仓改动无关的失败不纳入，标记「非本次推送」。
- 能直接修的（断言、配置、基线、小范围依赖补丁）在本任务内修掉并说明。
- 失败严重（主链路红、发布或安全门禁阻断、影响当前或后续交付）时，先说明失败点、影响面与建议，由用户裁决是否立刻修。
- 一次任务内只检查一次，不重复执行。

## 4 降级与边界

- `gh` 不可用 / 未认证 / 网络失败：briefing 记录「CI 回执不可用 + 原因」，继续任务，**不得**视为 CI 通过。
- 工作区非空或任务已在进行中：跳过，专注当前任务（本条件优先于「新任务」判断）。
- 不把 CI 回执当成质量门：它只回答「上一轮推送有没有把主链路打红」。

## 5 项目参数

| 参数 | 默认 | 项目可覆盖 |
| :--- | :--- | :--- |
| 默认分支 | 仓库默认分支 | `AGENTS.md` |
| 任务态文件 | `.session/current-task.yaml` | `AGENTS.md` |
| 展示位置 | 任务开局 briefing | `AGENTS.md` |

## 6 采纳验收

- [ ] 新任务 briefing 里能看到 CI 回执行，失败时有 run 链接。
- [ ] `gh` 不可用时写了「不可用 + 原因」，没有被当成通过。
- [ ] 进行中的任务没有重复触发该检查。
- [ ] `cancelled` / `action_required` / 无 run 三种情况没有被误写成通过。
