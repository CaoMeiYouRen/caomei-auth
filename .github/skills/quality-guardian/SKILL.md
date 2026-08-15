---
name: quality-guardian
description: 运行并解读 lint、类型检查、测试等质量门时使用。它不只是执行命令，还要根据变更范围选择最小充分检查、分析失败原因，并给出是否允许继续提交或发布的判断。用户提到 lint、typecheck、tests、quality gate、验证改动时都应触发。

metadata:
  internal: true
---

# Quality Guardian

铁律：不要把“命令跑过了”当成质量结论。必须解释跑了什么、为什么跑、失败在哪里、是否允许继续。

## 工作流

- [ ] Step 1: 评估所需检查 ⚠️ REQUIRED
	- [ ] 1.1 根据改动类型判断要跑 lint、test、typecheck 还是组合检查。
	- [ ] 1.2 区分快速验证和全量验证。
- [ ] Step 2: 执行质量门 ⚠️ REQUIRED
	- [ ] 2.1 优先使用 package.json 中真实存在的脚本。
	- [ ] 2.2 如果没有精细脚本，再说明为什么只能跑更重的检查。
	- [ ] 2.3 ⚠️ **绕过 `pnpm run` 执行质量门**：`pnpm run lint` 会触发依赖状态检查 → 自动 `pnpm install` → 可能因 `ERR_PNPM_IGNORED_BUILDS` 退出码 1 而失败，掩盖真实的 lint 结果。正确做法是直接调用二进制：
	  ```powershell
	  & "node_modules\.bin\eslint.cmd" .
	  & "node_modules\.bin\vitest.cmd" run
	  ```
	  或者用 `npx <binary>`（如果二进制支持 npx 模式）。避免在执行质量门时引入不必要的依赖检查副作用。
- [ ] Step 3: 分析结果
	- [ ] 3.1 提炼失败文件、错误类别和根因，而不是整段贴日志。
	- [ ] 3.2 明确这是阻塞问题、建议问题，还是外部已知问题。
- [ ] Step 4: 给出放行结论
	- [ ] 4.1 明确是否允许进入提交、发布或下一阶段。
	- [ ] 4.2 如果未跑某些检查，说明原因和残余风险。

## 常见检查

- pnpm lint
- pnpm lint:md
- pnpm test

## 项目特化提示

- 如果仓库提供 typecheck 或等价的类型检查脚本，应纳入质量门；如果没有，必须明确说明当前缺少该层验证。
- 如果全量测试成本过高，优先运行与改动范围直接相关的测试文件或测试集。
- 输出结论时要把“脚本不存在”和“脚本通过”严格区分。

## 反模式

- 不看 package.json，臆造并不存在的脚本。
- 把失败日志原样倾倒给用户，不提炼根因。
- 没跑全量检查却假装“全部通过”。

- 使用 `pnpm run` 执行 lint/test，触发不必要的依赖状态检查，导致 `ERR_PNPM_IGNORED_BUILDS` 伪装成质量门失败。

## 交付前检查

- [ ] 已基于变更范围选择质量门。
- [ ] 使用的命令都真实存在。
- [ ] 已明确失败根因或残余风险。
- [ ] 输出包含能否继续下一阶段的判断。










