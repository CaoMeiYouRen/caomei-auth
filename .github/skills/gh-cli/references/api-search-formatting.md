# API Search Formatting

## gh api

- GET 用户信息: `gh api /user`
- GraphQL: `gh api graphql -f query='query { viewer { login } }'`
- POST 示例:
  `gh api --method POST /repos/owner/repo/issues --field title="Issue" --field body="Body"`
- 分页: `gh api /user/repos --paginate`
- jq 提取: `gh api /repos/owner/repo --jq '.stargazers_count'`

## search 命令族

- 代码搜索: `gh search code "TODO" --repo owner/repo`
- issue 搜索: `gh search issues "label:bug state:open"`
- pr 搜索: `gh search prs "is:open review:required"`
- 仓库搜索: `gh search repos "stars:>1000 language:typescript" --limit 50`

## 输出策略

- `--json`: 优先用于后续解析或自动化
- `--jq`: 直接提取关键字段，减少后处理
- `--template`: 生成稳定的展示文本
- `--web`: 只在需要跳转页面时使用

## 推荐字段

- repo: `name,owner,visibility,description,defaultBranchRef`
- issue: `number,title,state,author,labels,comments`
- pr: `number,title,state,author,headRefName,baseRefName,statusCheckRollup`
- run: `databaseId,status,conclusion,workflowName,headBranch`

## 常见错误

- 使用 `--jq` 但未配合 `--json` 导致字段不可用。
- 用表格输出做自动化解析，导致格式不稳定。
- `--paginate` 结果过大但无过滤条件，造成低效查询。
