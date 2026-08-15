# Review Gate 证据模板

默认将临时审查记录写入 `artifacts/review-gate/`（已被 git ignore），用于多轮 review 对账与续查。

推荐文件名：`artifacts/review-gate/YYYY-MM-DD-<scope>.md`

## 使用方式

1. 首轮 review 创建一份记录（字段按下方模板预填）。
2. 每轮复查在同一文件追加一个新的 `Round N` 章节。
3. 问题编号保持稳定（`RG-B01`、`RG-W01`、`RG-S01`……），避免上一轮 blocker 在下一轮失联。

## 模板

```md
# Review Gate Record

- 范围:
- 关联 Todo:
- 改动类型:
- 风险等级:（低 / 中 / 高）
- audit-depth:（quick / standard / deep，调用方声明）
- 记录路径:

## Round 1（第 1 轮）

### 变更范围
- 文件清单:
- 关键入口:

### 最低验证要求
- 目标层级:（对照 code-reviewer SKILL.md 最低验证矩阵）
- 需要的命令:

### 已执行验证
- 命令:
- 结果:

### Findings
#### blocker
1. RG-B01 标题
   - 位置:
   - 风险:
   - 修复方向:

#### warning

#### suggest

### Review Gate
- 结论: Pass | Reject
- 失败原因或通过条件:
- 实际用时 / 是否超时间盒:（调用方宿主时钟事后实测回填，agent 自报用时为估算值不作数）
- 本轮新增问题:
- 本轮已关闭问题:
- 待复查问题:

### 未覆盖边界

### 后续补跑计划

## Round 2（第 2 轮）

### 复查说明
- 本轮变更:（只审上轮问题编号对应的修复点 diff）
- 复查结论:
```

## 最低要求

- 必须写明已执行验证与未执行原因。
- 必须区分 `Pass` / `Reject`（Gate 结论）与 `blocker` / `warning` / `suggest`（问题分级）。
- 必须保留未覆盖边界和补跑计划。
- 多轮 review 必须显式记录已关闭和待复查问题。

## 多轮延续规则

- Round 2+ 只复查上轮未关闭问题编号对应的修复点 diff，不重读全量 diff。
- 已关闭问题在对应编号旁标注关闭轮次；未关闭问题保持编号不变。
- 最终交付时，`Review Gate` 结论与复查基线必须与证据记录一致。
