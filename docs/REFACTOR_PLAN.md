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
    -   使用 `injectNavigationDeps` / `provide/inject` 方案隔离 Nuxt auto-import 对测试的影响。
-   **验收**：关键模块（邮件、短信、验证码、auth flows）均具备纯函数单测与副作用集成测；代码依赖图无循环引用。

#### G1 现状诊断

-   **服务器侧副作用混杂（部分已缓解）**：`server/utils/phone.ts` 仍同时承担限流、模板拼装、第三方 SDK 初始化和失败兜底，导致 twilio/Spug 等实例在函数内部硬编码，任何测试都必须真连外部服务。`server/utils/email.ts` 已于 2025-11-19 引入依赖注入与工厂封装，现阶段重点转向短信模块。限流逻辑仍在多个渠道重复一遍（`limiterStorage.increment` + 日志记录），且和文案耦合，阻碍后续新增渠道。
-   **前端页面直接处理鉴权流程**：`pages/login.vue`（1076 行）、`pages/register.vue`（743 行）和 `pages/security.vue`（1109 行）在 `<script setup>` 内完成 form state、字段校验、验证码解析、`authClient` 调用、toast 提示与导航逻辑，缺少 composable 或 service 层。任何副作用（如 `resolveCaptchaToken`、`authClient.phoneNumber.sendOtp`）都直接耦合在页面，导致页面无法在单元测试里被 mock。
-   **通用流程未抽象**：`utils/code.ts` 既访问 UI 组件（`useToast`、`CaptchaExpose`）又直接消费 `authClient`，缺乏依赖注入。即便页面想接入别的验证码提供商，也只能复制整段逻辑。
-   **依赖倒置尚未形成体系**：目前采用 DI 的模块有 `utils/navigation.ts`（`injectNavigationDeps`）与 `server/utils/email.ts`，其余模块仍直接引用 Nuxt auto-import 或第三方实例。要落实 G1，需要把 factory/dependency pattern 下沉到短信、验证码、日志等关键路径。

#### G1 近期进展

-   ✅ 2025-11-19：完成 `server/utils/email.ts` 的依赖注入与限流解耦，引入 `injectEmailDeps`/`resetEmailDeps`，并复用 `utils/factory/mailer.ts` 以便在测试环境中注入假实现。
-   ✅ 2025-11-19：新建 `utils/factory/mailer.ts` 和 `tests/unit/server/email.spec.ts`，覆盖成功发送与全局限流两条路径，为后续短信模块提供参考范式。

#### G1 拆解要点

1. **建立副作用工厂**：在 `utils/factory/mailer.ts`、`utils/factory/sms.ts` 中集中创建 nodemailer/twilio/spug 客户端，并暴露可 Mock 的工厂方法。`server/utils/email.ts`、`server/utils/phone.ts` 仅负责 orchestrate（限流结果 + provider 调度）。
2. **抽离纯逻辑**：将限流 key 生成、错误文案、验证码有效期计算等纯函数放入 `utils/shared/rate-limit.ts`、`utils/shared/otp.ts`，供 server 和 client 复用，避免在不同副作用文件中复制。所有纯函数先补单测，再被 service 层引用。
3. **前端流程模块化**：为登录/注册/安全页面创建 `composables/useLoginForm.ts`, `useRegisterFlow.ts`, `useSecuritySettings.ts`，由 composable 管理 `authClient` 调用、captcha token、toast，而页面仅聚焦 UI。`utils/code.ts` 应拆成纯逻辑（组装请求参数）+ UI hook（注入 toast、captcha）。
4. **引入依赖注入约定**：扩展 `injectNavigationDeps` 模式到验证码、authClient 调用，约定所有涉及外部 I/O 的模块必须导出 `inject*Deps`（或类似 `injectSmsDeps`、`injectCaptchaDeps`）的 API，默认实现引用 Nuxt auto-import，在测试中可替换。
5. **配套测试策略**：在 service 拆分完成后，为 rate-limit 纯函数和 provider 调度写 Vitest，mock nodemailer/twilio 工厂以验证错误路径，确保验收指标（关键模块都有纯函数 & 集成测）可量化。

#### G1 优先改造文件清单（按优先级）

| 文件                    | 当前症状                                                                                                                                                             | 计划动作                                                                                                                                                                       | 优先级   | 状态                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------- |
| `server/utils/email.ts` | 发送流程同时创建 transporter、读取 env、做限流和日志，`transporter.verify()` 每次调用都会触发真实网络；限流逻辑与短信模块重复。                                      | 拆分为 `emailRateLimit` 纯函数 + `createMailer` 工厂；`sendEmail` 保留 orchestrator 角色，引入依赖注入以便在测试 / Worker 环境替换实现。                                       | Critical | ✅ 已完成（2025-11-19） |
| `server/utils/phone.ts` | 单文件内嵌 Spug/Twilio class、限流与日志混杂；`fetch` 和 `twilio()` 直接在运行期执行，难以 mock；手机格式校验与 provider 强耦合。                                    | 将 provider 定义移动到 `utils/providers/sms/*`; 抽出 `resolveSmsProvider(channel)` 与限流工具；向外暴露 `injectSmsDeps` 注入 fetch/twilio client。                             | Critical | ✅ 已完成（2025-11-20） |
| `pages/login.vue`       | 1076 行脚本包含表单状态、校验、验证码解析、OTP 发送、2FA 对话框等所有副作用，无法在其他入口复用；与 `pages/register.vue`、`pages/forgot-password.vue` 逻辑高度重复。 | 新建 `composables/useLoginFlow.ts`（集中管理 captcha/OTP/authClient 调用）和 UI 子组件；页面仅绑定 composable 的响应式 state。                                                 | Critical | ⬜ 待处理               |
| `utils/code.ts`         | hook 内部直接引用 `useToast`、`authClient`、`setTimeout`，既包含业务流程也包含 UI 提示，无法在 SSR/测试中注入替代实现。                                              | 拆分为 `useOtpDispatcher`（仅处理 UI toast）+ `createOtpService`（纯函数，接受 `sendOtp`/`captchaResolver`）并提供依赖注入，供登录/注册/安全页面共享。                         | High     | ⬜ 待处理               |
| `pages/register.vue`    | 与登录页共享 70% 表单/验证码/错误提示逻辑，但目前复制粘贴；直接触发 `authClient` 和验证码，违背“页面不直接触达副作用层”的目标。                                      | 复用 `useRegisterFlow` composable，重构成 UI-only 页面，并与登录页面共享 OTP/校验逻辑模块。                                                                                    | High     | ⬜ 待处理               |
| `pages/security.vue`    | 1109 行脚本内直接处理 2FA、备份码、会话撤销（`authClient.session.revoke*`）、二维码生成（`QRCode`）等副作用，逻辑与 UI 紧耦合。                                      | 拆成 `useSecuritySettings` composable + 若干 presentational 组件 (`SecurityTwoFactorPanel`, `SecuritySessionTable`)，二维码生成/备份码下载放到 util/service 层，方便独立测试。 | High     | ⬜ 待处理               |

> 其余文件（如 `server/utils/admin-role-sync.ts`, `lib/auth-client.ts`）在完成上述关键改造后再按依赖链推进，避免一次性大改造成风险。

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

### 8. 原子修改与测试闭环

-   **规定**：每次修改时只改一项内容，并需要完成测试。
-   **执行**：
    -   严禁在一个提交或 PR 中混杂多个不相关的重构任务。
    -   修改完成后，必须运行对应的单元测试或集成测试，确保不破坏现有功能。
    -   若修改模块缺乏测试，必须先补充测试。

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
