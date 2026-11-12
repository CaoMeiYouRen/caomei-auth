---
name: full-stack-master
description: 需要统筹需求澄清、上下文扫描、技术方案、前后端实现、UI 验证、测试、质量审查、文档同步和提交节奏时使用。它负责编排多技能协作，而不是亲自替代所有专业技能。用户提到 end-to-end workflow、全流程开发、从需求到提交、PDTFC+、多技能编排时都应触发。

metadata:
  internal: true
---

# Full Stack Master

铁律：不要跳过规划和质量门，直接从需求冲到实现和提交。全链路编排的价值就在于减少返工，而不是增加速度幻觉。

## 能力定位

- **工作流自动编排**：串联需求 → 设计 → 开发 → 审计 → 测试 → 文档 → 提交的全链路。
- **技能聚合**：集成所有核心技能，按阶段分派。
- **Session 感知**：跨 session 恢复任务上下文与经验（见下文 Session 协议）。
- **可复用与可拓展**：支持新场景接入，支持多项目切换。

## 统一执行原则

> 验证分级矩阵与不同改动类型的最低验证要求见 [references/standards-reference.md](./references/standards-reference.md)；项目内已有权威规范时，以项目规范为准。

编排遵循四步判断顺序：

1. **先暴露假设**：需求有歧义或上下文不足时，先说明假设、可选解释与风险，不静默选择一种解释。
2. **选最小方案**：默认选择满足当前验收标准的最小实现，不引入无关抽象。
3. **限制改动范围**：改动范围与 Todo 验收点或 blocker 一一对应，发现无关问题只记录不顺手扩写。
4. **最小验证决定是否扩写**：完成首个实质改动后先做最小充分验证，再决定是否继续。

规划准入、候选池与归档规则以项目 [规划规范](../../../docs/standards/planning.md) 为唯一权威：新事项先评估并登记 backlog，未经用户明确授权不得进入当前阶段；本节不复述准入细则。

## 子代理编排纪律

编排纪律以项目 [AI 协作规范](../../../docs/standards/ai-collaboration.md) §1.2 为唯一权威。本技能只保留一句约束：并行只用于只读检索与证据收集，最终结论、放行判断与文档回写由当前主责统一收口；存在共享写入面时采用“并行检索 / 串行落盘”。

## 标准工作流（PDTFC+）

### P (Plan) — 需求分析与规划

- 读取项目上下文与任务状态（AGENTS.md、README、package.json、`docs/plan/todo.md`、`docs/plan/backlog.md`、`docs/plan/roadmap.md` 与验收标准）。
- 需求模糊时交给 product-manager 做最小必要澄清，不跳过。
- 按 [规划规范](../../../docs/standards/planning.md) 判断落点：已授权条目进入当前阶段；新候选先登记 backlog，等待用户决策。
- 输出受影响文件清单、验证矩阵和阶段交接顺序。
- 不在需求未收敛时启动代码改动。

- **技能**：context-analyzer、requirement-analyst、technical-architect

### D (Do) — 开发实现

- 同一事项同一时点只保留一个实现主责。
- 按方案映射把改动交给对应技能：后端 backend-expert、前端 nuxt-code-editor、文档 documentation-specialist。
- 实现收尾须通过本地自检（lint + typecheck + 定向测试）。
- 预计改动超出任务粒度约束（默认 10 文件或 800 行新增，项目可调整）时，先返回 P 拆分为多个原子条目，分批实现、分批审计、分批提交。
- **范围闸门**：开发中发现新的优化点或非阻塞事项时，返回 P 重新分流，不静默扩写。

- **技能**：backend-expert、nuxt-code-editor、devops-specialist 等按需

### A (Audit) — 质量门与审计放行（强制）

- D 阶段完成后，必须用 quality-guardian 选择并执行最小充分检查。
- 必须加载本项目 code-reviewer 执行结构化审查，不得自我审查替代。
- **协议单一来源**：验证分级矩阵、审计调用协议、审计轮次与范围冻结、并发分区与单模块拆分，以项目 [AI 协作规范](../../../docs/standards/ai-collaboration.md) 的 §2 A (Audit) 与 §3 为准；技能默认定义见 [code-reviewer](../code-reviewer/SKILL.md)。3 轮未过时按项目修复工作流 §5.3 停止并请求人类介入。本阶段只声明调用要点，不重述阈值。
- **审计调用要点**：审计 prompt 必须携带 `audit-depth` 声明（+ 理由）、变更文件清单、已验证证据摘要、本轮轮次与范围；未声明时按 code-reviewer 的防御默认执行。
- **复审**：第 2+ 轮只移交上轮问题编号对应的修复 diff；第 3 轮未过时按 code-reviewer 的改进协议处理，不原样续审。
- 发现 blocker 退回 D 或回流 P，不携带未关闭 blocker 进入后续阶段。

- **技能**：quality-guardian、code-reviewer、security-guardian

### V (Validate) — UI 验证

- 涉及页面渲染、交互流程时，使用 ui-validator 完成浏览器验证。
- 无 UI 面影响时显式记录跳过原因，不默认省略。

- **技能**：ui-validator

### T (Test) — 测试与回归

- 按改动类型和风险选择定向/全量/coverage 验证，不一刀切全量执行。
- 测试暴露的代码改动必须回到 D 并重新经过 A 阶段。

- **技能**：test-engineer

### F (Finish) — 交付与提交

- 更新任务状态，按需同步相关文档。
- 需要提交时，由 conventional-committer 生成并执行提交。
- 每个原子条目独立提交；A 阶段未放行的改动不得提交。
- 不自动 push；仅 [Git 规范](../../../docs/standards/git.md) §8 授权的定时任务情形可推送，其余需用户明确指示。

- **技能**：documentation-specialist、conventional-committer

## 交接协议

阶段之间移交任务时，交接内容必须包含（缺项视为交接未完成）：

- 任务目标与验收标准；
- 受影响文件清单；
- 已完成阶段与当前阶段；
- 已验证证据摘要（命令 + 结果 + 关键断言行号）；
- 未覆盖边界与下一步。

审计类交接按 code-reviewer 的调用协议补充 `audit-depth`、轮次与范围；存在共享写入面时遵循子代理编排纪律的“并行检索 / 串行落盘”。

## 迭代中途发现事项

D / A / V / T 任一阶段发现新增事项时，先暂停扩写，按项目 [规划规范](../../../docs/standards/planning.md) 判断是否在当前待办或验收范围内：

- **允许插队**：按 [AGENTS.md](../../../AGENTS.md) §5.1 判定并写明“为何插队”，本技能不重述例外类别。
- **默认延期**：体验优化、洁癖式重构、探索性能力、未来功能、非紧急依赖升级，登记 backlog，不打断当前阶段。
- **禁止静默膨胀**：不得未经用户确认把原子任务扩展成新的功能包或子阶段；涉及验收标准 / 范围变化时交用户决策。

## 需求挖掘方法论

1. **逐级递进**：先锁定整体结构和目标，再深入实现细节。
2. **单点突破**：一次只问一个问题，待用户回答后再追问。
3. **循环校验**：回答不清晰时换一种表述方式确认。
4. **意图抽离**：分析"想要什么"背后的"为什么"。

## 推理模式与失败自检

根据问题类型选择推理模式：

| 模式 | 适用场景 | 核心方法 |
|:---|:---|:---|
| 根因分析 | 修 bug、查事故 | 5-Why 追问 → 扫描同类 bug → git log 定位引入 commit |
| 第一性原理 | 全新模块设计 | 质疑假设 → 删除不必要 → 简化剩余 → 加速核心路径 |
| 减法模式 | 重构、清理 | 删除优先，不增加新抽象；先压缩再提取 |
| 搜索优先 | 不熟悉的模块 | 先查项目文档 → 再查代码 → 必要时外部搜索 → 最后动手 |
| 证据驱动 | 性能、质量审计 | 先跑测量（benchmark/coverage）→ 确定缺口 → 收敛改动 |

**失败自检**：同一方案连续 3 次未能解决问题时，必须声明当前方案失败（失败在哪、试了什么、为何无效），从表中至少列举 2 个替代模式，选择最匹配的一个并向用户解释切换理由，然后重新分析——而不是改个参数重跑旧方案。

## Session 协议（跨 session 恢复）

本技能内化轻量 Session 感知机制，状态文件写入项目 `.session/` 目录（已在 `.gitignore` 中排除）。

### 新 Session 开局

1. 读取 `.session/current-task.yaml`（当前任务、已完成步骤、下一步）、`.session/runtime-state.json`（失败计数、当前推理模式、上次验证结果）与 `.session/wisdom.md`（跨 session 经验）；文件不存在时按首次运行处理，不阻塞任务。
2. 做开局检查：工作区干净且是新任务时，先按 [references/task-start.md](./references/task-start.md) 看 CI 回执（`gh run list` 过滤 `HEAD` / `@{u}` 的失败）；进行中的任务跳过。
3. 向用户输出一份 **不超过 10 行** 的 briefing：当前阶段 + 任务、已完成步骤、下一步、上次 session 的认知状态摘要（如有）、CI 回执一行（通过 / 失败 + run 链接 / 不可用 + 原因）。

### Session 收尾（用户说"收工""结束""今天到这"或切换任务时）

1. 更新 `.session/current-task.yaml`：进度、next_steps（3 项以内）、updated_at；有失败发生时同步 `.session/runtime-state.json`（失败计数、推理模式、已试方案）。
2. 发现值得跨 session 复用的 pattern / bug / decision 时，追加到 `.session/wisdom.md`（按日期分组，每条一行要点）。
3. 若 wisdom 活跃条目数 ≥ 20，提醒用户"建议执行蒸馏"（把可复用经验沉淀为 skill 或归档）。
4. 向用户输出 **不超过 5 行** 的收尾摘要：完成内容、下一步、阻塞点、新固化的 wisdom 条目（如有）。

## 技能映射

- context-analyzer：建立上下文。
- requirement-analyst：澄清需求。
- technical-architect：设计方案。
- backend-expert / nuxt-code-editor：实施改动。
- documentation-specialist：同步文档。
- ui-validator：验证界面。
- test-engineer：补测试与查失败。
- security-guardian：补安全审计。
- quality-guardian：运行质量门。
- code-reviewer：做结构化审查（Review Gate）。
- conventional-committer：管理交付和提交。

## 反模式

- 总控技能亲自接管所有实现细节，导致专业技能失效。
- 在需求仍然模糊时就启动代码改动。
- 质量门和 code review 只走形式，不影响后续阶段。
- 跳过 A 阶段审计直接进入提交。
- 需求/方案阶段不记录假设，静默扩写当前任务。
- 用训练数据记忆替代外部搜索与验证。

## 交付前检查

- [ ] 已完成上下文、方案、实现、验证、审查和交付的最小闭环（PDTFC+ 全阶段）。
- [ ] 每个阶段都有明确负责技能，无阶段空转或遗漏；阶段交接内容完整（目标 / 验收标准 / 文件清单 / 阶段 / 证据 / 边界）。
- [ ] A 阶段审计已放行（携带 audit-depth 声明、轮次与证据摘要）。
- [ ] 未跳过质量门或审查，无未关闭 blocker。
- [ ] 迭代中途新事项已按插队 / 延期规则分流，无静默范围膨胀。
- [ ] `todo.md` 完成态与 Review Gate 结论同批落地，已完成项已按规划规范归档。
- [ ] 任务状态已同步，session 状态已更新（如启用 Session 协议）。
- [ ] 输出中已说明当前进度、风险和下一步。

## 维护者参考

重构、合并、降级或删除本技能前，先读 [references/rationale.md](./references/rationale.md)：存在理由、关键假设、失效判据与项目覆盖锚点。执行编排时不需要加载它。
