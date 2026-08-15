---
name: gh-cli
description: 使用 GitHub CLI（gh）处理仓库、issue、pull request、workflow、project、release、codespace、gist、search、api、auth、config、alias、secret、variable、extension、ruleset 和 status 等命令行操作时使用。用户提到 gh、gh cli、GitHub CLI、gh auth、gh repo、gh issue、gh pr、gh workflow、gh project、gh release、gh api、gh search、gh codespace、gh secret、gh variable、gh alias 时都应触发。

metadata:
  internal: true
---

# GitHub CLI

铁律：先确认目标资源、认证状态和输出形式，再执行 gh 命令；默认优先读取与查询，任何有副作用的操作都必须明确到具体资源。

## 工作流

- [ ] Step 1: 锁定命令族和目标
  - [ ] 1.1 明确是 repo、issue、pr、workflow、project、release、codespace、gist、search、api 还是 auth/config。
  - [ ] 1.2 明确目标仓库、hostname、账号或 environment，避免依赖默认上下文。
- [ ] Step 2: 检查认证与配置
  - [ ] 2.1 若涉及远程资源，先确认 gh 已登录且账号/host 正确。
  - [ ] 2.2 若需要机器可读输出，优先使用 `--json`、`--jq` 或 `--template`，不要先用肉眼读表格。
- [ ] Step 3: 执行最小充分命令
  - [ ] 3.1 只运行能回答当前问题的最小命令。
  - [ ] 3.2 批量操作、删除、关闭、合并、发布、禁用、归档、移除类命令必须先确认影响范围。
- [ ] Step 4: 输出与后续动作
  - [ ] 4.1 汇报命令结果时，保留关键字段、状态和下一步。
  - [ ] 4.2 若还需要后续 gh 命令，先说明依赖关系再继续。

## 参考资源

- [Command index](references/gh-cli-reference.md)：参考文档总入口与阅读路径。
- [Auth and config](references/auth-and-config.md)：认证、账号切换、环境变量、配置管理。
- [Repo issue pr](references/repo-issue-pr.md)：仓库、Issue、PR 的高频命令与安全边界。
- [Actions and release](references/actions-and-release.md)：Workflow、Run、Release、Cache、Secret、Variable。
- [Projects codespaces gists](references/projects-codespaces-gists.md)：Project、Codespace、Gist、Org、Label、Key。
- [API search formatting](references/api-search-formatting.md)：gh api、search、--json/--jq/--template 的输出策略。
- [Automation patterns](references/automation-patterns.md)：批量处理、CI/CD、fork 同步、仓库初始化模式。

## 反模式

- 在目标仓库不明确时直接依赖默认 repo。
- 先执行破坏性命令，再回头确认对象是否正确。
- 明明可以用 JSON 输出，却手工解析表格文本。
- 在没有明确授权时执行 delete、merge、close、archive、disable 之类操作。

## 交付前检查

- [ ] 目标资源和上下文已明确。
- [ ] 认证状态已确认，或已说明需要用户先登录。
- [ ] 输出格式选择合理，适合当前任务。
- [ ] 所有副作用命令都已取得明确确认。
