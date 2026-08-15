# Actions and Release

## Workflow 与 Run

- 工作流列表: `gh workflow list`
- 查看工作流: `gh workflow view ci.yml --yaml`
- 手动触发: `gh workflow run ci.yml --ref main`
- 运行列表: `gh run list --limit 20`
- 查看运行: `gh run view 123456789 --log`
- 观察运行: `gh run watch 123456789 --interval 5`
- 重跑失败: `gh run rerun 123456789`
- 取消运行: `gh run cancel 123456789`
- 下载产物: `gh run download 123456789 --dir ./artifacts`

## Cache / Secret / Variable

- cache 列表: `gh cache list --limit 50`
- 删除 cache: `gh cache delete 123456789`
- 查看 secret: `gh secret list`
- 设置 secret: `echo "$MY_SECRET" | gh secret set MY_SECRET`
- 查看 variable: `gh variable list`
- 设置 variable: `gh variable set MY_VAR "value"`

## Release

- 列表: `gh release list`
- 查看: `gh release view v1.0.0`
- 创建: `gh release create v1.0.0 --notes "..."`
- 上传资产: `gh release upload v1.0.0 ./file.tar.gz`
- 下载资产: `gh release download v1.0.0 --pattern "*.tar.gz"`
- 编辑: `gh release edit v1.0.0 --notes "updated"`
- 删除: `gh release delete v1.0.0 --yes`

## 自动化建议

- 需要串联 run id 时，优先 JSON 输出并取关键字段。
- 对 release/tag 相关命令，先确认目标 tag 是否已存在。
- 删除 cache、release、asset 前先做一次 list/view 复核。
