---
name: conventional-committer
description: 需要生成 Conventional Commit 提交消息并执行单次提交时使用。适用于 feat、fix、docs、refactor、test、build、ci、chore 等常规提交场景。先检查质量门，再分析 diff，再生成符合 commitlint 预期的消息。

metadata:
  internal: true
---

# Conventional Committer

铁律：不要在不了解本次实际变更范围和质量状态的前提下直接 git add . 然后提交。

## 工作流

- [ ] Step 1: 确认是否允许提交 ⚠️ REQUIRED
	- [ ] 1.1 检查用户是否明确要求提交。
	- [ ] 1.2 确认质量检查已经完成，或明确告知仍有风险。
- [ ] Step 2: 审视变更范围 ⚠️ REQUIRED
	- [ ] 2.1 查看 git status 和 diff，识别应该提交的文件。
	- [ ] 2.2 排除临时文件、生成物和无关改动。
- [ ] Step 3: 生成提交消息
	- [ ] 3.1 先判断 type，再决定是否需要 scope。
	- [ ] 3.2 描述聚焦“为什么”和“本次改了什么”，保持简洁可读。
- [ ] Step 4: 执行提交 (conditional)
	- [ ] 4.1 只有在用户明确允许时才执行 git add / git commit。
	- [ ] 4.2 提交后复查消息是否符合 commitlint 习惯。
	- [ ] 4.3 若环境中的 husky hook 依赖旧版 Node 或工具链不兼容，使用 `--no-verify` 跳过 hook（如 `git commit --no-verify -m "..."`）。仅在已知 hook 不兼容当前环境时使用，不可滥用。
	- [ ] 4.4 依赖类批量修复统一使用中文格式：`chore(deps): xxx`，让提交消息能跨项目复用。

## 常见 type

- feat
- fix
- docs
- refactor
- test
- build
- ci
- chore
- perf
- revert

## 反模式

- 不看 diff，直接用模糊消息如 update files。
- 把多类变更混成一个没有 scope 的提交。
- 在质量检查未完成时默认提交。
- 在 husky hook 兼容的环境下滥用 `--no-verify`，跳过了本应生效的检查。

## 交付前检查

- [ ] 已确认本次允许提交。
- [ ] 暂存范围只包含相关变更。
- [ ] 提交消息符合 Conventional Commits 语义。
- [ ] 已说明任何未完成的质量风险。









