# Repo Issue PR

## 仓库

- 查看仓库: `gh repo view [owner/repo]`
- 列表: `gh repo list [owner] --limit 50`
- 创建: `gh repo create my-repo --public --description "desc"`
- fork: `gh repo fork owner/repo --clone`
- 同步 fork: `gh repo sync`
- 设置默认仓库: `gh repo set-default owner/repo`

## Issue

- 列表: `gh issue list --state all --limit 50`
- 查看: `gh issue view 123 --comments`
- 创建: `gh issue create --title "Bug: ..." --body "..."`
- 编辑: `gh issue edit 123 --add-label bug`
- 关闭: `gh issue close 123 --comment "Fixed by #456"`
- 状态总览: `gh issue status`

## Pull Request

- 列表: `gh pr list --state open --limit 50`
- 查看: `gh pr view 123 --comments`
- 创建: `gh pr create --base main --head feature-x --title "..."`
- 拉取分支: `gh pr checkout 123`
- diff: `gh pr diff 123 --name-only`
- 检查项: `gh pr checks 123 --watch`
- 审核: `gh pr review 123 --approve --body "LGTM"`
- 合并: `gh pr merge 123 --squash --delete-branch`

## JSON 输出建议

- PR 列表结构化输出: `gh pr list --json number,title,state,author`
- Issue 筛选: `gh issue list --json number,title,labels --jq '.[] | {number,title}'`
- 仓库详情: `gh repo view --json name,description,defaultBranchRef`

## 安全边界

- 合并、关闭、删除前必须确认编号和目标仓库。
- `gh pr merge --admin`、`gh repo delete` 默认视为高风险命令。
- 批量关闭 issue/pr 前先展示命中的编号样本。
