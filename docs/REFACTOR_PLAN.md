# 草梅 Auth 重构方案

## 概述

本方案针对项目当前暴露出的高耦合、文件体量过大、重复代码、测试覆盖不足以及文档滞后等问题，提出一组可迭代落地的工程改造举措。整体目标是在不影响现有功能的前提下，逐步提升代码质量与可维护性，为后续需求迭代和多端部署奠定基础。

## 目标摘要

| 编号 | 目标             | 成功标准                                                                                                 |
| ---- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| G1   | 降低耦合度       | 纯函数（纯逻辑）与副作用代码分层，公共逻辑迁移到 `utils/**` 或可复用 hooks；核心模块依赖方向单向、可注入 |
| G2   | 控制文件长度     | `*.ts` 单文件 ≤ 500 行，`*.vue` 单文件 ≤ 1000 行，新增 ESLint `max-lines` 规则守护                       |
| G3   | 提升复用率       | 重复逻辑抽象为 composable、指令或 util，删减 ≥ 70% 样板代码（表单、API 包装、校验等）                    |
| G4   | 测试覆盖率 ≥ 60% | `pnpm test --coverage` 语句覆盖 ≥ 60%、分支 ≥ 50%；CI 阻断回退                                           |
| G5   | 文档同步         | `docs/**`、README、CHANGELOG 与代码改动保持一致，提供迁移指南与测试报告                                  |

## 工作流与措施

### 1. 解耦逻辑与副作用（G1）

-   **模块梳理**：列出所有执行 I/O、网络、数据库、副作用的模块，确定纯逻辑边界。优先处理 `server/utils/email.ts`, `server/utils/phone.ts`, `lib/auth-client.ts`, 各页面内联的业务逻辑。
-   **分层策略**：
    -   纯逻辑迁移到 `utils/pure/**`（或现有 util 文件中）并以函数形式暴露。
    -   副作用层（API、数据库、第三方 SDK）仅依赖纯逻辑，通过依赖注入/参数传递共享逻辑结果。
    -   Vue 组件和 composable 仅调用副作用层或纯逻辑层，禁止直接深入 server util。
-   **技术措施**：
    -   建立 `@/utils/factory/*` 用于创建带副作用的实例（如 Twilio、Nodemailer），便于在测试中 mock。
    -   使用 `setNavigationDependencies` / `provide/inject` 方案隔离 Nuxt auto-import 对测试的影响。
-   **验收**：关键模块（邮件、短信、验证码、auth flows）均具备纯函数单测与副作用集成测；代码依赖图无循环引用。

### 2. 控制文件长度（G2）

-   **基线扫描**：使用 `npx eshw max-lines --ts 500 --vue 1000`（或自写脚本）生成超标文件列表，纳入 issue。
-   **拆分策略**：
    -   Vue 大文件拆分为 `components/` 子组件或 `composables/`；将复杂逻辑迁往脚本模块。
    -   TS 大文件按功能域拆分，如 `server/api/auth/[...all].ts` 拆为 handler + service + validator。
-   **静态规则**：
    -   在 `eslint.config.js` 增加 `max-lines` 与 `max-lines-per-function`，自定义豁免（如 entity 定义）。
    -   在 PR 模板与 CI 中加入提示（若脚本输出超标则失败）。
-   **验收**：扫描输出为空；新文件默认遵守限制。

### 3. 提升代码复用（G3）

-   **候选清单**：
    -   表单输入、验证码发送、密码强度等组件现有高度重复逻辑（多页面/多组件内拷贝）。
    -   API 调用与错误处理：集中到 `utils/api-client.ts` 或 `useApiRequest` composable。
    -   校验逻辑：统一收敛至 `utils/validate.ts`、`utils/privacy.ts` 等纯函数。
-   **实施步骤**：
    1. 建立 `packages/shared` 或 `lib/shared` 目录放置跨端逻辑；或继续使用 `utils/**`。
    2. 对重复组件创建基础组件（如 `BaseFormField`, `FormActionFooter`），并提供样式 mixin。
    3. 对重复 API 模式封装 `createResourceClient`，接受 baseURL、路径配置。
-   **量化指标**：通过 `ts-prune`/`depcruise` 对比重构前后模块引用数，重复代码块减少 ≥ 70%。

### 4. utils 分层与复用策略（G3 补充）

-   **目录规划**：
    -   `utils/shared/**`（或 `lib/shared/**`）：不依赖 Nuxt/Node 的纯函数与常量，可直接被前后端复用。
    -   `utils/web/**`：只在客户端使用的逻辑（浏览器 API、窗口状态、组件 helper）。
    -   `server/utils/**`：仅服务端可用的逻辑（数据库、文件系统、第三方服务）。
    -   通过 `barrel` 文件（index.ts）暴露统一入口，避免跨层误引用。
-   **依赖约束**：
    -   `shared` 不得引用 `web`/`server`，`web` 可以引用 `shared`，`server` 可以引用 `shared`，但禁止反向依赖。
    -   配置 `eslint-plugin-boundaries` 或自定义 lint 规则，在 CI 阻止错误引用。
-   **迁移步骤**：
    1. 统计当前 `utils/**` 中的通用逻辑（如 `validate`, `privacy`, `password`, `smart-input`），优先迁入 `shared`。
    2. 将仅 server 依赖（fs, node:crypto, TypeORM）的 util 放入 `server/utils` 并提供纯逻辑 + 副作用拆分。
    3. Web 端 hooks/composables 若仅依赖浏览器，统一放入 `utils/web` 或 `composables/shared`。
    4. 在 `tsconfig`/`paths` 中增加 `@/shared/*`, `@/web-utils/*`, `@/server-utils/*` 别名，提升可读性。
-   **复用收益衡量**：统计前后端重复实现的函数数量（基线 vs 重构后），重复实现清零；通过 `pnpm depcruise --config .dependency-cruise.cjs` 生成依赖图验证引用层级正确。

### 5. 覆盖率 ≥ 60%（G4）

-   **阶段化推进**：
    1. **P1**：纯函数/确定性逻辑（已完成大部分，继续覆盖新增 util）。
    2. **P2**：副作用轻量模块（rate-limit、email-service、phone-service），通过依赖注入和 mock 实现。
    3. **P3**：API & 组件集成；利用 `@nuxt/test-utils` + in-memory DB fixture。
-   **工具配置**：
    -   在 `vitest.config.ts` 的 `coverage` 中设置阈值（如 `lines: 0.6`）并输出 `lcov`。
    -   为 PR CI 新增 `pnpm test --coverage` job，未达标自动失败。
-   **补测清单（新增）**：
    -   `server/utils/email-service.ts`（模板错误、限流、sendEmail 异常）。
    -   `server/utils/phone.ts`（Spug/Twilio 分支、限流日志）。
    -   `server/api/*` 关键路由（auth、admin、oauth）——走黑盒，用 fixtures。
    -   新拆出的 composable / Base 组件。

### 6. 文档同步（G5）

-   **新增文档**：
    -   本文件 `docs/REFACTOR_PLAN.md`。
    -   `docs/architecture/decoupling.md`：说明新层次、模块职责。
    -   `docs/testing/coverage.md`：记录覆盖策略、运行命令、夹具说明。
-   **更新内容**：
    -   `README.md`：加入“架构 & 质量守护”章节与覆盖率徽章。
    -   `docs/PLAN.md` & `docs/TEST.md`：反映当前进度、阶段目标。
    -   `CHANGELOG.md`：在对应 release 中列出重构与测试提升。
-   **流程约束**：PR 模板新增 “文档同步” 复选框；缺失时 reviewer 可直接拒绝。

### 7. Lint 要求（ESLint & Stylelint）

-   **目标**：
    -   CI 中 `pnpm lint`、`pnpm stylelint` 必须 0 error；warning 数量逐 Sprint 下降，最终目标控制在 0-5 以内。
    -   任何新增代码不得引入新的 lint warning，除非有 eslint-disable 注释并注明原因。
-   **策略**：
    1. 在 lint 命令后追加 `--max-warnings=0`（先在 CI 实验，视遗留 warning 数量逐步收紧）。
    2. 建立 `lint-baseline.json` 记录当前 warning，逐文件清零后从基线移除。
    3. Stylelint 同步配置 `--max-warnings=0` 并统一 SCSS 变量/混入使用；对老旧样式逐步整改。
-   **验收**：CI 通过时无 lint error，warning 数按计划下降；PR 模板要求附上 lint 结果（或 CI 链接）。

## 执行路线图

| 阶段     | 时间   | 重点                                       | 交付                                    |
| -------- | ------ | ------------------------------------------ | --------------------------------------- |
| Sprint 1 | 1 周   | 纯函数梳理、max-lines 检查、补充覆盖率配置 | util 解耦、eslint 规则、coverage job    |
| Sprint 2 | 1-2 周 | 大文件拆分、公共组件抽象、email/phone 测试 | 拆分后的模块、Base 组件库、服务单测     |
| Sprint 3 | 2 周   | API & 组件集成测试、文档完善               | e2e/集成测试、docs 更新、coverage ≥ 60% |

## 成功度量

-   **技术指标**：
    -   `pnpm lint` 与 `pnpm test --coverage` 均为 CI 必跑项。
    -   `depcruise` 图无循环依赖，`madge` 报告清零。
    -   `sonarqube` 或 `codecov` 报告显示覆盖率 ≥ 60%。
-   **过程指标**：
    -   每个 refactor PR 包含拆分说明、测试截图、文档更新链接。
    -   形成“纯逻辑先写单测”的开发习惯，review checklist 包含“副作用隔离”项。

## 后续建议

-   按季度回顾 max-lines 和复用效果，防止回退。
-   若后续需要进一步自动化，可引入 `nx` 或 `turbo` 分模块构建，提高解耦粒度。
-   针对高风险模块（认证、支付、日志）增加契约测试，保证拆分后行为一致。
