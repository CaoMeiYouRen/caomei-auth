# Auth and Config

## 安装与版本

- Windows: `winget install --id GitHub.cli`
- macOS: `brew install gh`
- Linux: 按 GitHub CLI 官方安装说明配置 apt/yum/zypper 源
- 验证: `gh --version`

## 认证模式

- 交互登录: `gh auth login`
- 指定企业域名: `gh auth login --hostname enterprise.internal`
- token 登录: `gh auth login --with-token < token.txt`
- 查看状态: `gh auth status`
- 查看当前激活账号: `gh auth status --active`
- 切换账号: `gh auth switch --hostname github.com --user username`
- 获取 token: `gh auth token`
- 退出登录: `gh auth logout --hostname github.com --user username`

## Git 集成

- 初始化凭据助手: `gh auth setup-git`
- 指定 host 初始化: `gh auth setup-git --hostname enterprise.internal`
- 刷新 scopes: `gh auth refresh --scopes write:org,read:public_key`

## 配置管理

- 查看配置: `gh config list`
- 获取单项: `gh config get editor`
- 设置编辑器: `gh config set editor vim`
- 设置 git 协议: `gh config set git_protocol ssh`
- 关闭交互提示: `gh config set prompt disabled`
- 清缓存: `gh config clear-cache`

## 环境变量

- `GH_TOKEN`: 自动化认证 token
- `GH_HOST`: 默认 host
- `GH_REPO`: 默认仓库 `owner/repo`
- `GH_PROMPT_DISABLED=true`: 关闭交互提示
- `GH_EDITOR`, `GH_PAGER`, `GH_TIMEOUT`: 编辑器、分页器和超时

## 认证与配置排障

- `gh auth status` 显示未登录: 先执行 `gh auth login` 或补 `GH_TOKEN`
- 命令打到错误 host: 检查 `GH_HOST`、`--hostname` 和当前登录账号
- 命令打到错误仓库: 检查 `GH_REPO` 或明确传 `--repo owner/repo`
- 自动化卡住等待输入: 关闭 prompt 或补齐必要参数
