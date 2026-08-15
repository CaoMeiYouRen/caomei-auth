# Automation Patterns

## 批量操作模板

- 批量关闭 stale issue:
  `gh issue list --search "label:stale" --json number --jq '.[].number' | xargs -I {} gh issue close {} --comment "Closing as stale"`
- 批量打标签:
  `gh pr list --search "review:required" --json number --jq '.[].number' | xargs -I {} gh pr edit {} --add-label needs-review`

## CI/CD 模式

- 触发工作流并观察:
  `gh workflow run ci.yml --ref main`
  `gh run list --workflow ci.yml --limit 1`
  `gh run watch <run-id>`
- 下载产物:
  `gh run download <run-id> --dir ./artifacts`

## Fork 同步模式

- `gh repo fork original/repo --clone`
- `gh repo sync`
- 或手动:
  `git fetch upstream`
  `git checkout main`
  `git merge upstream/main`
  `git push origin main`

## 仓库初始化模式

- `gh repo create my-project --public --description "..." --clone --gitignore node --license mit`
- 初始化标签:
  `gh label create bug --color d73a4a --description "Bug report"`
  `gh label create enhancement --color a2eeef --description "Feature request"`

## 自动化安全清单

- 所有自动化命令先 dry-run 思维验证筛选条件。
- 严格限制批量命令作用域，避免误操作跨仓库资源。
- 自动化环境优先 `GH_TOKEN` + `GH_REPO`，避免依赖交互态上下文。
