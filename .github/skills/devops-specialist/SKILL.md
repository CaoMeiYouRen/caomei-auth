---
name: devops-specialist
description: 修改 Docker、CI/CD、部署配置、环境变量、运行时参数、构建脚本和发布流程时使用。优先覆盖 Docker、Vercel、Cloudflare 与 GitHub Actions 场景。用户提到 deploy、Dockerfile、workflow、CI、CD、environment variables、build pipeline、release config 时都应触发。

metadata:
  internal: true
---

# DevOps Specialist

铁律：不要在没有确认运行环境、环境变量和回滚路径前直接改部署配置。

## 工作流

- [ ] Step 1: 识别部署目标 ⚠️ REQUIRED
	- [ ] 1.1 明确目标平台、构建命令、运行命令和产物形式。
	- [ ] 1.2 盘点依赖的环境变量、密钥和外部服务。
- [ ] Step 2: 对齐当前配置 ⚠️ REQUIRED
	- [ ] 2.1 阅读 package.json、相关配置文件和现有 workflow。
	- [ ] 2.2 找出当前流程中的单点失败和平台假设。
- [ ] Step 3: 实施变更
	- [ ] 3.1 修改容器、构建、部署或 CI 流程时，保持职责分层清晰。
	- [ ] 3.2 显式处理缓存、并发、工件和失败退出码。
	- [ ] 3.3 不把 secrets 写进仓库或日志。
- [ ] Step 4: 验证与回滚
	- [ ] 4.1 尽量执行本地构建或最小验证命令。
	- [ ] 4.2 输出需要的环境变量、风险点和回滚方式。

## 关注点

- 构建命令是否与实际脚本一致。
- 环境变量是否定义清楚，默认值是否安全。
- 镜像、缓存和依赖安装是否存在明显浪费或不稳定性。
- CI 是否能在失败时提供足够日志和明确状态。
- 若项目使用 pnpm v11+，确认 `pnpm-workspace.yaml` 中的 `allowBuilds` 配置正确；缺少该配置会导致 CI 中 `pnpm install` 抛出 `ERR_PNPM_IGNORED_BUILDS`（常见受阻包：esbuild、sharp、workerd）。

## 项目特化提示

- Dockerfile 与 docker-compose.yml 要一起考虑，不要只改单边配置。
- 如果项目使用 .env 模板或 runtimeConfig 一类运行时配置入口，优先沿用现有模式。
- Vercel、Cloudflare 和 GitHub Actions 的部署配置要和 package.json 中真实脚本保持一致。
- 追求最小镜像时，也要兼顾调试可用性和构建稳定性。
- 当 CI 构建失败且日志中出现 `ERR_PNPM_IGNORED_BUILDS` 时，说明缺少 `allowBuilds` 配置；将受阻包（如 esbuild、sharp、workerd）添加到 `pnpm-workspace.yaml` 的 `allowBuilds` 列表中，并在 PR 中同步提交该变更。

## 反模式

- 改了 workflow 却不核对 package.json 中的真实脚本。
- 为了图快把 secrets、token 或生产地址写进配置文件。
- 只修当前平台，不说明对其他部署目标的影响。
- CI 构建因 `ERR_PNPM_IGNORED_BUILDS` 失败后，在 CI 配置中临时关闭 frozen-lockfile 或跳过构建脚本验证，而不是修复 `allowBuilds` 配置。

## 交付前检查

- [ ] 目标平台、构建流程和环境变量已经对齐。
- [ ] 未引入硬编码 secrets 或危险默认值。
- [ ] 已给出最小验证步骤与回滚提示。
- [ ] 配置变更和脚本命令保持一致。
- [ ] 已确认 `pnpm-workspace.yaml` 中的 `allowBuilds` 配置包含 CI 构建所需的依赖（如 esbuild、sharp、workerd 等）。










