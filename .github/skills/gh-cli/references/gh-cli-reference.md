# GitHub CLI Reference Index

这是 gh-cli skill 的 references 总入口。主 SKILL.md 只保留触发面和执行边界，详细命令按专题拆分在本目录中。

## 阅读路径

1. 先看 `auth-and-config.md`，确认认证状态、host 和默认仓库。
2. 再按任务类型进入对应命令族文档。
3. 涉及结构化输出时，统一参考 `api-search-formatting.md`。
4. 涉及批量或流水线场景时，最后补看 `automation-patterns.md`。

## 专题索引

- `auth-and-config.md`：认证、账号切换、环境变量、配置。
- `repo-issue-pr.md`：仓库、Issue、PR。
- `actions-and-release.md`：Workflow、Run、Release、Cache、Secret、Variable。
- `projects-codespaces-gists.md`：Project、Codespace、Gist、Org、Label、SSH/GPG。
- `api-search-formatting.md`：gh api、search、json/jq/template 输出。
- `automation-patterns.md`：批量操作、CI/CD、fork 同步、仓库初始化。

## 快速安全清单

- 先查再改：优先 `view/list/status/checks`，后做 mutating 操作。
- 有副作用命令必须锁定目标：仓库、编号、分支、environment。
- 批量操作先展示筛选条件和样本，再执行。
- 不在示例和日志中输出真实 token、secret 值。

## 官方文档

- https://cli.github.com/manual/
- https://docs.github.com/en/github-cli
- https://docs.github.com/en/rest
- https://docs.github.com/en/graphql
