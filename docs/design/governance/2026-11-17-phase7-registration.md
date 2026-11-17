# 2026-11-17 阶段 7 范围登记：质量与测试基建

> **状态**：已授权启动（2026-11-17，用户选择「B｜质量与测试基建」）。完成态以 `todo.md` 与 Review Gate 结论为准。
> **单一事实源**：阶段范围、原子条目与验收见本文；执行口径以 [开发规范](../../standards/development.md)、[测试规范](../../standards/testing.md) 为准；候选见 [backlog.md](../../plan/backlog.md)。
> **前置**：[阶段 6 收口记录](./2026-11-17-phase6-closure.md)（测试 1090 / 视觉 110 / 覆盖率 76.07%）。

## 1. 阶段目标

1. **工具链门禁收口**：stylelint 升到 18 并解除共享配置 pin；新增文件规模门禁，抑制大文件继续增长。
2. **视觉测试基建**：补齐平板宽度（768）基线；把「固定时钟导致对话框内 Select 鼠标失效」从隐患变成明确口径与 helper。
3. **错误面收尾**：修复 Admin 对话框 better-auth 调用失败静默（未校验 `response.error`）。
4. **质量指标口径**：jscpd 目标达成口径落文档；补齐 `pages` / `plugins` 覆盖率短板。

## 2. 范围与非目标

### 2.1 本阶段范围

- 依赖：`stylelint` 16 → 18、`stylelint-config-cmyr` 解 pin（1.0.0 → ^1.1.0）。
- 新门禁：文件规模检查（`scripts/quality/check-file-size.mjs` + 基线清单 + CI）。
- 视觉矩阵：新增 768×1024 平板基线（核心页），保留现有 1440 / 390 基线不变。
- 测试口径：固定时钟交互 helper 与文档；Admin 对话框失败反馈；覆盖率补测。

### 2.2 非目标

- 不拆分历史大文件（`lib/auth.ts`、`check-governance.mjs` 等只登记基线，不在本阶段重构）。
- 不新增业务功能（登录事件、风控、SDK 等仍在 backlog）。
- 不调整视觉阈值 / 允许清单（保留 backlog），只新增平板基线。
- 不修改 DataTable 依赖行为（上游能力缺口继续保留候选）。

## 3. 现状取证（2026-11-17）

| 项 | 现状 | 影响 |
| :--- | :--- | :--- |
| stylelint | `stylelint ^16.26.1` + `stylelint-config-cmyr 1.0.0`（阶段 4 为恢复门禁固定） | 1.1.0 要求 stylelint 18；当前无法解 pin |
| 文件规模 | `max-lines` 600：5 个文件超限（`lib/auth` 788、`check-governance.mjs` 781、`user-detail-dialog` 630、`pages/security` 616、`typeorm-adapter` 613；M2 取证时补登此前遗漏的 `typeorm-adapter`） | warning 常态化，新增大文件无阻断 |
| 视觉矩阵 | 只覆盖 1440×900 与 390×844 | 平板宽度无回归保护 |
| 固定时钟 | `page.clock.setFixedTime` 下对话框内 Select 鼠标交互失效（Vue invoker 守卫） | 交互用例只能走键盘，口径散落在注释 |
| Admin 失败反馈 | `authClient` 4xx/5xx 返回 `{ error }` 不抛出，封禁 / 创建 / 会话撤销失败静默 | 用户无提示、对话框不关闭 |
| 重复代码 | jscpd 3.71%（目标 < 5%） | 目标已达成，候选需移出并登记口径 |
| 覆盖率 | Statements 76.07% / Lines 76.36%；`pages` 约 34.9%、`plugins` 约 25% | 页面与插件是短板 |

## 4. 阶段构成（4 条主线 / 7 条原子条目）

| 编号 | 条目 | 交付面 | 验收 | 依赖 |
| :--- | :--- | :--- | :--- | :--- |
| M1 | stylelint 18 升级与共享配置解 pin | `stylelint` ^18.0.0、`stylelint-config-cmyr` ^1.1.0；按新规则修复样式 | `pnpm lint:css` 0 error；配置无临时规则副本；`pnpm build` 通过；`pnpm test:visual` 110 基线全绿且 login / profile / admin-users 三页抽检无 diff | 无 |
| M2 | 文件规模门禁与基线 | `scripts/quality/check-file-size.mjs`、`file-size-baseline.json`（5 个超限文件登记当前行数与拆分计划）、`quality:file-size` 脚本、CI 接入 | 新增/增长超 600 行被拦截；基线内文件不得继续增长；缩减后可更新基线；单测覆盖阈值与基线解析 | 无 |
| M3 | 视觉矩阵补平板宽度 | 视觉矩阵新增 `tablet`（768×1024），覆盖 login / register / profile / admin-users / admin-logs 等核心页，新增基线 | 新增基线 `test:visual` 通过；既有 1440 / 390 基线零变化；无横向溢出 | 无 |
| M4 | 固定时钟交互口径收口 | 交互 helper：对话框内 Select 用键盘打开/选择；记录 `clock.install()` 可行性结论；更新相关用例与注释 | admin-users 封禁 / 创建对话框、会话撤销用例以键盘路径连续 3 次运行通过；文档写明约束与推荐写法 | M3 |
| M5 | Admin 对话框 better-auth 失败反馈 | 封禁 / 创建用户 / 会话撤销 / 角色操作显式校验 `response.error`，给本地化兜底文案 | 失败弹错误 Toast 且不误报成功；单测覆盖 error 与成功分支 | 无 |
| M6 | 覆盖率短板补测 | 补 `pages` / `plugins` 定向测试，覆盖率不低于阶段 6 基线且 `pages` ≥ 40%、`plugins` ≥ 40% | `pnpm test:coverage` 达标；覆盖率报告记录模块下限 | 无 |
| M7 | 阶段收口与归档 | 全量门禁、文档同步（含 jscpd 达标口径写入测试规范）、收口记录、归档、1024 横向候选回填 backlog | 全量门禁通过；`todo.md` 归档；jscpd 口径与 backlog 同步；载体口径一致 | M1–M6 |

> **拆分规则**：单条超过「10 个文件 / 800 行新增」时拆条；依赖升级（M1）若引发大面积规则修复，拆出「样式规则修复」条目。

## 5. 关键口径

### 5.1 stylelint 18

- 升级后先跑全量 `lint:css` 统计新增违规，再决定是否拆条；不得用 `stylelint-disable` 批量压制。
- `stylelint-config-cmyr` 恢复 `^1.1.0`，不在项目内复制规则；仅当共享配置缺规则时补最小覆盖并注明原因。

### 5.2 文件规模

- 阈值沿用 600 行；基线文件按「文件 → 当前行数」登记，只允许缩减，增长即失败。
- 基线文件新增时必须在清单里写明 owner 与拆分计划；不允许把新文件直接加入基线。

### 5.3 视觉平板基线

- 只为核心页新增 768×1024；不扩大到全部 Admin 矩阵，控制 CI 时长。
- 新基线必须与现有桌面 / 移动基线同批验证，避免混合代基线。

### 5.4 固定时钟

- 优先用键盘路径操作对话框内 Select；`clock.install()` 仅作为验证项，若无法解除守卫则记录结论并保留键盘 helper。

### 5.5 质量指标

- jscpd 目标 < 5% 已达成（3.71%），候选移出 backlog，阈值与报告口径写入测试规范。
- 覆盖率以阶段 6 为基线不退化，本阶段只抬 `pages` / `plugins` 下限，不设全局新门槛。

## 6. 依赖与风险

| 项 | 说明 | 缓解 |
| :--- | :--- | :--- |
| stylelint 18 规则差异 | 可能产生大量样式违规 | 先统计再修复；必要时拆条 |
| 平板基线 | 新增截图会延长视觉 CI | 只选核心页（约 10–15 张） |
| 覆盖率补测 | 页面测试依赖 Nuxt 环境，成本较高 | 优先 Admin 页面与 plugins 纯逻辑单测 |

## 7. 验证矩阵

| 阶段 | 必跑 |
| :--- | :--- |
| M1 | `pnpm lint:css` / `pnpm build` / 视觉抽检 |
| M2 | `pnpm quality:file-size` / 单测 / `pnpm lint` |
| M3–M4 | `pnpm test:visual`（新增平板基线）/ 定向交互用例 |
| M5–M6 | `pnpm test` / `pnpm test:coverage` |
| M7 | 全量门禁（与阶段 6 收口一致） |

## 8. 交付与收口

- 每条完成即提交并同步 `todo.md`；M7 产出收口记录并归档到 [已完成工作归档](../../archive/completed-work.md)。
