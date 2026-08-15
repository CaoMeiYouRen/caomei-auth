# Projects Codespaces Gists

## Projects

- 项目列表: `gh project list --owner owner`
- 查看项目: `gh project view 123 --format json`
- 创建项目: `gh project create --title "My Project"`
- 字段列表: `gh project field-list 123`
- 添加条目: `gh project item-add 123 --owner owner --repo repo --issue 456`
- 编辑条目: `gh project item-edit 123 --id 456 --title "Updated"`

## Codespaces

- 列表: `gh codespace list`
- 创建: `gh codespace create --repo owner/repo --branch main`
- 查看: `gh codespace view`
- ssh: `gh codespace ssh`
- 停止: `gh codespace stop`
- 删除: `gh codespace delete`
- 日志: `gh codespace logs --tail 100`

## Gists

- 列表: `gh gist list --limit 20`
- 查看: `gh gist view abc123 --files`
- 创建: `gh gist create script.py --desc "My script"`
- 编辑: `gh gist edit abc123`
- 删除: `gh gist delete abc123`
- 克隆: `gh gist clone abc123`

## 组织与辅助资源

- 组织列表: `gh org list`
- 标签: `gh label list`, `gh label create bug --color d73a4a`
- SSH keys: `gh ssh-key list`, `gh ssh-key add ~/.ssh/id_ed25519.pub`
- GPG keys: `gh gpg-key list`, `gh gpg-key add ~/.gnupg/pubkey.asc`

## 安全边界

- 删除 codespace/gist/label/key 前先确认目标 id。
- project item 修改前先保留原始字段快照，避免误覆盖。
